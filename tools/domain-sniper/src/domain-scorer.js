#!/usr/bin/env node
/**
 * Domain Authority Scorer
 *
 * Takes domains extracted from PACER filings and scores them by:
 * - Domain authority (Open PageRank — free, no key)
 * - Domain age (WHOIS lookup)
 * - Registration status (is it actually expired/available?)
 * - Estimated value
 *
 * Usage:
 *   node src/domain-scorer.js
 *   node src/domain-scorer.js --input data/filings.json --output data/scored.json
 */

import { parseArgs } from 'node:util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseCliArgs() {
    const options = {
        input: { type: 'string', short: 'i', default: 'data/filings.json' },
        output: { type: 'string', short: 'o', default: 'data/scored.json' },
        help: { type: 'boolean', short: 'h' },
    };

    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
Domain Authority Scorer — Score domains from PACER filings

Usage:
  node src/domain-scorer.js [options]

Options:
  --input, -i    Input filings JSON (default: data/filings.json)
  --output, -o   Output scored JSON (default: data/scored.json)
  --help, -h     Show this help
`);
        process.exit(0);
    }

    return {
        input: values.input,
        output: values.output,
    };
}

/**
 * Check domain authority using Open PageRank API (free, no key required).
 * https://www.domcop.com/openpagerank/
 *
 * Returns a score from 0-10 (10 = highest authority).
 */
async function getPageRank(domain) {
    const url = `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(domain)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'API-OPR': process.env.OPENPAGERANK_KEY || '',
            },
        });

        if (!response.ok) return null;

        const data = await response.json();
        const result = data.response?.[0];

        if (result && result.status_code === 200) {
            return {
                pageRankDecimal: result.page_rank_decimal || 0,
                pageRankInteger: result.page_rank_integer || 0,
                rank: result.rank || null,
                domain: result.domain,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Check if a domain is registered or available using RDAP (free, no key).
 * RDAP is the modern replacement for WHOIS.
 */
async function checkDomainStatus(domain) {
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;

    try {
        const response = await fetch(rdapUrl, {
            headers: { 'Accept': 'application/rdap+json' },
        });

        if (response.status === 404) {
            return { status: 'available', registered: false };
        }

        if (!response.ok) {
            return { status: 'unknown', registered: null };
        }

        const data = await response.json();

        // Extract useful info
        const events = data.events || [];
        const registrationDate = events.find(e => e.eventAction === 'registration')?.eventDate;
        const expirationDate = events.find(e => e.eventAction === 'expiration')?.eventDate;
        const lastChanged = events.find(e => e.eventAction === 'last changed')?.eventDate;

        // Check status
        const statuses = data.status || [];
        const isActive = statuses.some(s =>
            ['active', 'ok'].includes(s.toLowerCase())
        );

        // Calculate domain age in years
        let ageYears = null;
        if (registrationDate) {
            const regDate = new Date(registrationDate);
            ageYears = Math.round((Date.now() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
        }

        // Check if expired
        let isExpired = false;
        if (expirationDate) {
            isExpired = new Date(expirationDate) < new Date();
        }

        return {
            status: isExpired ? 'expired' : (isActive ? 'registered' : 'unknown'),
            registered: !isExpired,
            registrationDate,
            expirationDate,
            lastChanged,
            ageYears,
            isExpired,
            registrar: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || null,
        };
    } catch {
        return { status: 'error', registered: null };
    }
}

/**
 * Check Wayback Machine for historical snapshots (indicates the site had traffic).
 * More snapshots = more likely it had real content and backlinks.
 */
async function getWaybackInfo(domain) {
    const url = `https://web.archive.org/wayback/available?url=${encodeURIComponent(domain)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        const snapshot = data.archived_snapshots?.closest;

        return {
            hasSnapshots: !!snapshot,
            latestSnapshot: snapshot?.url || null,
            snapshotDate: snapshot?.timestamp || null,
            available: snapshot?.available || false,
        };
    } catch {
        return null;
    }
}

/**
 * Estimate domain value based on collected signals.
 *
 * Scoring factors:
 * - PageRank (0-10 scale, weight: 40%)
 * - Domain age (older = more valuable, weight: 20%)
 * - TLD (.com > .io > others, weight: 15%)
 * - Domain length (shorter = more valuable, weight: 10%)
 * - Wayback snapshots (had real content, weight: 15%)
 */
function calculateScore(domain, pageRank, domainStatus, wayback) {
    let score = 0;
    const breakdown = {};

    // PageRank score (0-40 points)
    const pr = pageRank?.pageRankDecimal || 0;
    breakdown.pageRank = Math.min(40, pr * 4);
    score += breakdown.pageRank;

    // Domain age (0-20 points)
    const age = domainStatus?.ageYears || 0;
    breakdown.age = Math.min(20, age * 2);
    score += breakdown.age;

    // TLD score (0-15 points)
    const tld = domain.split('.').pop().toLowerCase();
    const tldScores = {
        'com': 15, 'io': 12, 'co': 11, 'ai': 13, 'app': 10,
        'dev': 9, 'net': 8, 'org': 7, 'store': 6, 'shop': 6,
        'tech': 5, 'digital': 4, 'online': 3, 'site': 2, 'xyz': 1,
    };
    breakdown.tld = tldScores[tld] || 3;
    score += breakdown.tld;

    // Domain length (0-10 points, shorter = better)
    const nameLength = domain.split('.')[0].length;
    breakdown.length = Math.max(0, 10 - Math.max(0, nameLength - 4));
    score += breakdown.length;

    // Wayback presence (0-15 points)
    breakdown.wayback = wayback?.hasSnapshots ? 15 : 0;
    score += breakdown.wayback;

    // Estimated value range based on score
    let estimatedValue = { low: 0, high: 0 };
    if (score >= 80) {
        estimatedValue = { low: 5000, high: 50000 };
    } else if (score >= 60) {
        estimatedValue = { low: 1000, high: 5000 };
    } else if (score >= 40) {
        estimatedValue = { low: 200, high: 1000 };
    } else if (score >= 20) {
        estimatedValue = { low: 50, high: 200 };
    } else {
        estimatedValue = { low: 10, high: 50 };
    }

    // Availability bonus
    const isAvailable = domainStatus?.isExpired || domainStatus?.status === 'available';

    return {
        totalScore: Math.round(score),
        maxScore: 100,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
        breakdown,
        estimatedValue,
        isAvailable,
        recommendation: isAvailable && score >= 40 ? 'BUY' :
                        isAvailable && score >= 20 ? 'CONSIDER' :
                        !isAvailable && score >= 60 ? 'WATCH' :
                        'SKIP',
    };
}

/**
 * Rate limiter — don't hammer free APIs
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const args = parseCliArgs();

    const inputPath = join(__dirname, '..', args.input);
    if (!existsSync(inputPath)) {
        console.error(`Input file not found: ${args.input}`);
        console.error('Run the PACER scraper first: node src/pacer-scraper.js');
        process.exit(1);
    }

    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const domains = data.domains || [];

    if (domains.length === 0) {
        console.log('No domains found in input file. Run the scraper first.');
        process.exit(0);
    }

    console.log('='.repeat(60));
    console.log('DOMAIN SNIPER — Authority Scorer');
    console.log('='.repeat(60));
    console.log(`Scoring ${domains.length} domains...\n`);

    const scoredDomains = [];
    const uniqueDomains = [...new Map(domains.map(d => [d.domain, d])).values()];

    for (let i = 0; i < uniqueDomains.length; i++) {
        const entry = uniqueDomains[i];
        const domain = entry.domain;

        console.log(`[${i + 1}/${uniqueDomains.length}] Scoring: ${domain}`);

        // Fetch all signals in parallel
        const [pageRank, domainStatus, wayback] = await Promise.all([
            getPageRank(domain),
            checkDomainStatus(domain),
            getWaybackInfo(domain),
        ]);

        const score = calculateScore(domain, pageRank, domainStatus, wayback);

        const result = {
            domain,
            caseTitle: entry.caseTitle,
            dateFiled: entry.dateFiled,
            court: entry.court,
            link: entry.link,
            pageRank,
            domainStatus,
            wayback,
            score,
        };

        scoredDomains.push(result);

        // Print inline result
        const statusIcon = score.recommendation === 'BUY' ? '***' :
                          score.recommendation === 'CONSIDER' ? '**' :
                          score.recommendation === 'WATCH' ? '*' : '';
        console.log(`  Score: ${score.totalScore}/100 (${score.grade}) | ${score.recommendation} ${statusIcon}`);
        console.log(`  Available: ${score.isAvailable ? 'YES' : 'No'} | Est. value: $${score.estimatedValue.low}-$${score.estimatedValue.high}`);

        // Rate limit: 1 second between domains
        if (i < uniqueDomains.length - 1) {
            await sleep(1000);
        }
    }

    // Sort by score descending
    scoredDomains.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // Save results
    const output = {
        generated: new Date().toISOString(),
        summary: {
            totalScored: scoredDomains.length,
            buyRecommendations: scoredDomains.filter(d => d.score.recommendation === 'BUY').length,
            considerRecommendations: scoredDomains.filter(d => d.score.recommendation === 'CONSIDER').length,
            watchRecommendations: scoredDomains.filter(d => d.score.recommendation === 'WATCH').length,
            averageScore: Math.round(scoredDomains.reduce((s, d) => s + d.score.totalScore, 0) / scoredDomains.length),
        },
        domains: scoredDomains,
    };

    const outputPath = join(__dirname, '..', args.output);
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total scored: ${output.summary.totalScored}`);
    console.log(`Average score: ${output.summary.averageScore}/100`);
    console.log(`BUY: ${output.summary.buyRecommendations}`);
    console.log(`CONSIDER: ${output.summary.considerRecommendations}`);
    console.log(`WATCH: ${output.summary.watchRecommendations}`);

    // Top picks
    const topPicks = scoredDomains.filter(d => ['BUY', 'CONSIDER'].includes(d.score.recommendation));
    if (topPicks.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('TOP PICKS');
        console.log('='.repeat(60));
        for (const pick of topPicks.slice(0, 10)) {
            console.log(`\n  ${pick.domain}`);
            console.log(`    Score: ${pick.score.totalScore}/100 (${pick.score.grade}) — ${pick.score.recommendation}`);
            console.log(`    Est. value: $${pick.score.estimatedValue.low}-$${pick.score.estimatedValue.high}`);
            console.log(`    PageRank: ${pick.pageRank?.pageRankDecimal || 'N/A'}`);
            console.log(`    Age: ${pick.domainStatus?.ageYears || 'N/A'} years`);
            console.log(`    Available: ${pick.score.isAvailable ? 'YES' : 'No'}`);
            console.log(`    Wayback: ${pick.wayback?.hasSnapshots ? 'Has history' : 'No history'}`);
            console.log(`    Case: ${pick.caseTitle || 'N/A'}`);
        }
    }

    console.log(`\nFull results saved to: ${args.output}`);
    console.log('\nNext step: Run the daily digest for a formatted report.');
    console.log('  node src/daily-digest.js');
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

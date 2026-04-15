#!/usr/bin/env node
/**
 * PACER Bankruptcy Scraper
 *
 * Searches PACER Case Locator for Chapter 7 bankruptcy filings
 * involving e-commerce, tech, and digital businesses.
 *
 * PACER API: https://pcl.uscourts.gov
 * Cost: $0.10/page, free if under $30/quarter
 *
 * Usage:
 *   node src/pacer-scraper.js
 *   node src/pacer-scraper.js --days 30 --output data/filings.json
 */

import { parseArgs } from 'node:util';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// PACER Case Locator API endpoints
const PACER_BASE = 'https://pcl.uscourts.gov/pcl-public-api/rest';
const PACER_SEARCH = `${PACER_BASE}/cases/find`;

// E-commerce / tech / digital business indicators
const BUSINESS_KEYWORDS = [
    'e-commerce', 'ecommerce', 'online store', 'digital', 'software',
    'saas', 'platform', 'marketplace', 'app', 'website', 'web services',
    'tech', 'internet', 'media', 'marketing', 'agency', 'solutions',
    'commerce', 'retail online', 'dropship', 'shopify', 'stripe',
    '.com', '.io', '.co', '.ai', '.app', '.dev', '.net', '.org'
];

function parseCliArgs() {
    const options = {
        days: { type: 'string', short: 'd', default: '30' },
        output: { type: 'string', short: 'o', default: 'data/filings.json' },
        limit: { type: 'string', short: 'l', default: '100' },
        help: { type: 'boolean', short: 'h' },
    };

    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
PACER Bankruptcy Scraper — Find Chapter 7 e-commerce liquidations

Usage:
  node src/pacer-scraper.js [options]

Options:
  --days, -d     Look back N days (default: 30)
  --output, -o   Output file path (default: data/filings.json)
  --limit, -l    Max results (default: 100)
  --help, -h     Show this help
`);
        process.exit(0);
    }

    return {
        days: parseInt(values.days, 10) || 30,
        output: values.output,
        limit: parseInt(values.limit, 10) || 100,
    };
}

/**
 * Search PACER Case Locator for Chapter 7 bankruptcy filings.
 *
 * Note: PACER requires authentication via PACER account credentials.
 * The API uses session-based auth — login first, then search.
 */
async function loginToPacer(username, password) {
    const loginUrl = `${PACER_BASE}/login`;

    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            loginId: username,
            password: password,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`PACER login failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.loginResult?.nextGenCSO || data.token || null;
}

async function searchBankruptcyFilings(token, { days, limit }) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const formatDate = (d) => d.toISOString().split('T')[0];

    const searchParams = {
        caseTypeId: 'bk',           // Bankruptcy cases
        caseChapterId: '7',          // Chapter 7 liquidation
        dateFiledFrom: formatDate(startDate),
        dateFiledTo: formatDate(endDate),
        caseStatus: 'open',
        numberOfCases: limit,
        sortBy: 'dateFiled',
        sortOrder: 'desc',
    };

    const url = new URL(PACER_SEARCH);
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString(), {
        headers: {
            'X-NEXT-GEN-CSO': token,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`PACER search failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.content || data.receipt?.content || [];
}

/**
 * Filter filings for likely e-commerce/tech/digital businesses.
 * Looks for keywords in the debtor name and case title.
 */
function filterForDigitalBusinesses(filings) {
    return filings.filter(filing => {
        const searchText = [
            filing.caseTitle || '',
            filing.debtorName || '',
            filing.partyName || '',
            filing.courtName || '',
        ].join(' ').toLowerCase();

        return BUSINESS_KEYWORDS.some(keyword =>
            searchText.includes(keyword.toLowerCase())
        );
    }).map(filing => ({
        caseId: filing.caseId || filing.caseNumberFull,
        caseTitle: filing.caseTitle,
        debtorName: filing.debtorName || filing.partyName,
        court: filing.courtName || filing.courtId,
        dateFiled: filing.dateFiled,
        chapter: filing.caseChapterId || '7',
        status: filing.caseStatus,
        url: filing.caseLink || `https://www.pacer.gov/`,
        matchedKeywords: BUSINESS_KEYWORDS.filter(kw =>
            [filing.caseTitle, filing.debtorName, filing.partyName]
                .join(' ').toLowerCase().includes(kw.toLowerCase())
        ),
    }));
}

/**
 * Alternative: Search via PACER RSS feeds (free, no auth required).
 * Many bankruptcy courts publish RSS feeds of new filings.
 */
async function searchViaRSS() {
    // Major bankruptcy court RSS feeds
    const feeds = [
        // Delaware (most corporate bankruptcies)
        'https://ecf.deb.uscourts.gov/cgi-bin/rss_outside.pl',
        // Southern District of New York
        'https://ecf.nysb.uscourts.gov/cgi-bin/rss_outside.pl',
        // District of New Jersey
        'https://ecf.njb.uscourts.gov/cgi-bin/rss_outside.pl',
        // Northern District of California (Silicon Valley)
        'https://ecf.canb.uscourts.gov/cgi-bin/rss_outside.pl',
        // Central District of California (LA)
        'https://ecf.cacb.uscourts.gov/cgi-bin/rss_outside.pl',
        // Southern District of Texas (Houston)
        'https://ecf.txsb.uscourts.gov/cgi-bin/rss_outside.pl',
    ];

    const results = [];

    for (const feedUrl of feeds) {
        try {
            const response = await fetch(feedUrl, {
                headers: { 'User-Agent': 'domain-sniper/0.1.0' },
            });

            if (!response.ok) continue;

            const xml = await response.text();
            const items = parseRSSItems(xml);
            results.push(...items);
        } catch (err) {
            // RSS feed may not be available — skip silently
            continue;
        }
    }

    return results;
}

/**
 * Simple XML/RSS parser for bankruptcy court feeds.
 */
function parseRSSItems(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const description = extractTag(itemXml, 'description');
        const pubDate = extractTag(itemXml, 'pubDate');

        if (title) {
            items.push({
                title,
                link,
                description,
                pubDate,
                source: 'rss',
            });
        }
    }

    return items;
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '').trim() : null;
}

/**
 * Extract potential domain names from filing text.
 */
function extractDomains(text) {
    if (!text) return [];
    const domainRegex = /\b([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|io|co|ai|app|dev|net|org|store|shop|tech|digital|online|site|xyz))\b/gi;
    const matches = text.match(domainRegex) || [];
    return [...new Set(matches.map(d => d.toLowerCase()))];
}

/**
 * Main execution
 */
async function main() {
    const args = parseCliArgs();

    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('='.repeat(60));
    console.log('DOMAIN SNIPER — PACER Bankruptcy Scraper');
    console.log('='.repeat(60));
    console.log(`Looking back: ${args.days} days`);
    console.log(`Max results: ${args.limit}`);
    console.log();

    // Check for PACER credentials
    const pacerUser = process.env.PACER_USERNAME;
    const pacerPass = process.env.PACER_PASSWORD;

    let filings = [];
    let source = '';

    if (pacerUser && pacerPass) {
        // Use authenticated PACER API
        console.log('Authenticating with PACER...');
        try {
            const token = await loginToPacer(pacerUser, pacerPass);
            console.log('Logged in. Searching Chapter 7 filings...');
            const rawFilings = await searchBankruptcyFilings(token, args);
            filings = filterForDigitalBusinesses(rawFilings);
            source = 'pacer-api';
            console.log(`Found ${rawFilings.length} total filings, ${filings.length} match digital/e-commerce.`);
        } catch (err) {
            console.error(`PACER API error: ${err.message}`);
            console.log('Falling back to RSS feeds...');
            filings = await searchViaRSS();
            source = 'rss-fallback';
        }
    } else {
        // Use free RSS feeds
        console.log('No PACER credentials found. Using free RSS feeds...');
        console.log('(Set PACER_USERNAME and PACER_PASSWORD in .env for full API access)');
        console.log();
        const rssResults = await searchViaRSS();
        source = 'rss';

        // Filter RSS results for digital businesses and extract domains
        filings = rssResults
            .filter(item => {
                const text = `${item.title} ${item.description}`.toLowerCase();
                return BUSINESS_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
            })
            .map(item => ({
                caseTitle: item.title,
                description: item.description,
                link: item.link,
                dateFiled: item.pubDate,
                source: 'rss',
                domains: extractDomains(`${item.title} ${item.description}`),
            }));

        console.log(`Found ${rssResults.length} RSS items, ${filings.length} match digital/e-commerce keywords.`);
    }

    // Extract domains from all filings
    const allDomains = [];
    for (const filing of filings) {
        const domains = filing.domains || extractDomains(
            `${filing.caseTitle || ''} ${filing.debtorName || ''} ${filing.description || ''}`
        );
        if (domains.length > 0) {
            allDomains.push(...domains.map(d => ({
                domain: d,
                caseTitle: filing.caseTitle,
                dateFiled: filing.dateFiled,
                court: filing.court,
                link: filing.link || filing.url,
            })));
        }
    }

    console.log(`\nExtracted ${allDomains.length} potential domains from filings.`);

    // Save results
    const output = {
        generated: new Date().toISOString(),
        source,
        params: { days: args.days, limit: args.limit },
        summary: {
            totalFilings: filings.length,
            domainsFound: allDomains.length,
        },
        filings,
        domains: allDomains,
    };

    const outputPath = join(__dirname, '..', args.output);
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nSaved to: ${args.output}`);

    // Print summary
    if (allDomains.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('DOMAINS FOUND');
        console.log('='.repeat(60));
        for (const d of allDomains.slice(0, 20)) {
            console.log(`  ${d.domain} — ${d.caseTitle || 'N/A'} (${d.dateFiled || 'N/A'})`);
        }
        if (allDomains.length > 20) {
            console.log(`  ... and ${allDomains.length - 20} more (see ${args.output})`);
        }
    }

    console.log('\nNext step: Run the domain scorer to check authority and value.');
    console.log('  node src/domain-scorer.js');
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

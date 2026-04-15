#!/usr/bin/env node
/**
 * Web Scraper — Alternative domain source using public bankruptcy data.
 *
 * Sources:
 *   1. Manual seed list (domains you find from court records, news, etc.)
 *   2. Expired domain lists from public aggregators
 *   3. Apify actors for scraping bankruptcy auction sites
 *
 * Usage:
 *   node src/web-scraper.js
 *   node src/web-scraper.js --seed data/seed-domains.txt
 */

import { parseArgs } from 'node:util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Known expired domain aggregator APIs (free tiers)
const EXPIRED_DOMAIN_SOURCES = [
    {
        name: 'ExpiredDomains.net RSS',
        url: 'https://member.expireddomains.net/export/expiredcom/?export=textfile',
        requiresAuth: true,
    },
];

// Public bankruptcy auction / asset sale sites to check
const AUCTION_SITES = [
    'https://www.govdeals.com',
    'https://www.bid4assets.com',
    'https://www.equitynet.com',
];

function parseCliArgs() {
    const options = {
        seed: { type: 'string', short: 's' },
        output: { type: 'string', short: 'o', default: 'data/filings.json' },
        help: { type: 'boolean', short: 'h' },
    };

    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
Web Scraper — Find domains from alternative public sources

Usage:
  node src/web-scraper.js
  node src/web-scraper.js --seed data/seed-domains.txt

Options:
  --seed, -s    Path to a text file with one domain per line
  --output, -o  Output file (default: data/filings.json)
  --help, -h    Show this help

Seed file format (one domain per line):
  quickclick.com
  shopdrop.io
  buymore.co

You can find domains to seed from:
  - PACER web interface: https://pcl.uscourts.gov/pcl/pages/search/findCase.jsf
  - CourtListener: https://www.courtlistener.com
  - Bankruptcy auction sites: govdeals.com, bid4assets.com
  - News about startup closures: TechCrunch, The Information
  - Startup cemeteries: failory.com, startupgraveyard.io
`);
        process.exit(0);
    }

    return { seed: values.seed, output: values.output };
}

/**
 * Load domains from a seed file (one per line).
 */
function loadSeedDomains(seedPath) {
    if (!existsSync(seedPath)) {
        console.error(`Seed file not found: ${seedPath}`);
        return [];
    }

    const content = readFileSync(seedPath, 'utf-8');
    return content
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line && !line.startsWith('#') && line.includes('.'));
}

/**
 * Fetch recently dead startups from known sources.
 * These are public lists of companies that shut down.
 */
async function fetchDeadStartups() {
    const sources = [
        {
            name: 'Failory',
            url: 'https://www.failory.com/cemetery',
        },
        {
            name: 'Startup Graveyard',
            url: 'https://startupgraveyard.io/',
        },
    ];

    const domains = [];

    for (const source of sources) {
        try {
            const response = await fetch(source.url, {
                headers: { 'User-Agent': 'domain-sniper/0.1.0' },
            });

            if (!response.ok) continue;

            const html = await response.text();

            // Extract domains from HTML
            const domainRegex = /\b([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|io|co|ai|app|dev|net|org|store|shop|tech))\b/gi;
            const matches = html.match(domainRegex) || [];
            const uniqueDomains = [...new Set(matches.map(d => d.toLowerCase()))];

            // Filter out obvious non-startup domains
            const skipDomains = ['google.com', 'facebook.com', 'twitter.com', 'github.com',
                'linkedin.com', 'medium.com', 'youtube.com', 'apple.com', 'amazon.com',
                'wordpress.com', 'w3.org', 'schema.org', 'cloudflare.com', 'jsdelivr.net'];

            const filtered = uniqueDomains.filter(d => !skipDomains.includes(d));

            domains.push(...filtered.map(d => ({
                domain: d,
                source: source.name,
                caseTitle: `Dead startup from ${source.name}`,
                dateFiled: new Date().toISOString().split('T')[0],
            })));

            console.log(`  ${source.name}: Found ${filtered.length} domains`);
        } catch (err) {
            console.log(`  ${source.name}: Failed (${err.message})`);
        }
    }

    return domains;
}

/**
 * Generate a curated seed list of known recent startup failures
 * with likely valuable domains. These are from public news sources.
 */
function getKnownDeadStartups() {
    // Curated list of notable startup closures with potentially valuable domains
    // Source: TechCrunch, The Information, public announcements
    return [
        // E-commerce / retail
        { domain: 'fab.com', category: 'e-commerce', note: 'Design marketplace, raised $336M' },
        { domain: 'jet.com', category: 'e-commerce', note: 'Acquired by Walmart, shut down' },
        { domain: 'brandless.com', category: 'e-commerce', note: 'DTC brand, raised $292M' },
        { domain: 'wish.com', category: 'e-commerce', note: 'Marketplace, massively declined' },
        { domain: 'zulily.com', category: 'e-commerce', note: 'Flash sales, shut down 2023' },
        { domain: 'pier1.com', category: 'retail', note: 'Home decor, bankrupt 2020' },
        // Tech / SaaS
        { domain: 'theranos.com', category: 'health-tech', note: 'Fraud, dissolved' },
        { domain: 'quibi.com', category: 'streaming', note: 'Short-form video, raised $1.75B' },
        { domain: 'vine.co', category: 'social', note: 'Short video pioneer, shut down' },
        { domain: 'katerra.com', category: 'construction-tech', note: 'Raised $2B, bankrupt 2021' },
        { domain: 'mixpanel.com', category: 'analytics', note: 'Still active but domain value ref' },
        // Recent closures (2024-2026)
        { domain: 'olive.ai', category: 'health-tech', note: 'Healthcare AI, shut down 2023' },
        { domain: 'convoy.com', category: 'logistics', note: 'Digital freight, shut down 2023' },
        { domain: 'veev.com', category: 'construction', note: 'Modular homes, bankrupt 2024' },
        { domain: 'bird.co', category: 'mobility', note: 'Scooters, bankrupt 2023' },
        { domain: 'hopin.com', category: 'events', note: 'Virtual events, sold for parts' },
        { domain: 'plastiq.com', category: 'fintech', note: 'Bill pay, bankrupt 2023' },
        { domain: 'argo.ai', category: 'self-driving', note: 'Autonomous vehicles, shut down 2022' },
        { domain: 'gopuff.com', category: 'delivery', note: 'Instant delivery, major decline' },
        { domain: 'faze.com', category: 'esports', note: 'FaZe Clan, bankrupt 2024' },
    ].map(s => ({
        domain: s.domain,
        caseTitle: `${s.note} (${s.category})`,
        dateFiled: 'curated',
        source: 'known-failures',
        category: s.category,
    }));
}

async function main() {
    const args = parseCliArgs();

    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('='.repeat(60));
    console.log('DOMAIN SNIPER — Web Scraper (Alternative Sources)');
    console.log('='.repeat(60));
    console.log();

    let allDomains = [];

    // Source 1: Seed file
    if (args.seed) {
        console.log(`Loading seed domains from: ${args.seed}`);
        const seedDomains = loadSeedDomains(join(__dirname, '..', args.seed));
        allDomains.push(...seedDomains.map(d => ({
            domain: d,
            caseTitle: 'Manual seed',
            dateFiled: new Date().toISOString().split('T')[0],
            source: 'seed-file',
        })));
        console.log(`  Loaded ${seedDomains.length} domains from seed file.\n`);
    }

    // Source 2: Known dead startups (curated)
    console.log('Loading curated dead startup domains...');
    const knownDead = getKnownDeadStartups();
    allDomains.push(...knownDead);
    console.log(`  Loaded ${knownDead.length} known failures.\n`);

    // Source 3: Web scraping (if network available)
    console.log('Scraping dead startup directories...');
    try {
        const scraped = await fetchDeadStartups();
        allDomains.push(...scraped);
        console.log(`  Total from web: ${scraped.length}\n`);
    } catch (err) {
        console.log(`  Web scraping unavailable: ${err.message}\n`);
    }

    // Dedupe
    const seen = new Set();
    allDomains = allDomains.filter(d => {
        if (seen.has(d.domain)) return false;
        seen.add(d.domain);
        return true;
    });

    console.log(`Total unique domains: ${allDomains.length}\n`);

    // Save in same format as PACER scraper
    const output = {
        generated: new Date().toISOString(),
        source: 'web-scraper',
        summary: {
            totalFilings: allDomains.length,
            domainsFound: allDomains.length,
        },
        filings: [],
        domains: allDomains,
    };

    const outputPath = join(__dirname, '..', args.output);
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Saved to: ${args.output}`);

    // Print domains
    console.log('\n' + '='.repeat(60));
    console.log('DOMAINS TO SCORE');
    console.log('='.repeat(60));
    for (const d of allDomains.slice(0, 25)) {
        console.log(`  ${d.domain} — ${d.caseTitle}`);
    }
    if (allDomains.length > 25) {
        console.log(`  ... and ${allDomains.length - 25} more`);
    }

    console.log('\nNext step: Score these domains for authority and value.');
    console.log('  node src/domain-scorer.js');
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

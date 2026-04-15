#!/usr/bin/env node
/**
 * Domain Sniper — Full Pipeline
 *
 * Runs the complete pipeline:
 *   1. Scrape PACER for Chapter 7 e-commerce bankruptcies
 *   2. Score extracted domains by authority and value
 *   3. Generate a daily digest report
 *
 * Usage:
 *   npm run snipe
 *   node src/index.js
 *   node src/index.js --days 30
 */

import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseCliArgs() {
    const options = {
        days: { type: 'string', short: 'd', default: '30' },
        help: { type: 'boolean', short: 'h' },
    };

    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
Domain Sniper — Full Pipeline

Scrapes PACER → Scores domains → Generates daily digest

Usage:
  npm run snipe
  node src/index.js [--days 30]

Options:
  --days, -d    Look back N days (default: 30)
  --help, -h    Show this help

Environment variables (set in .env):
  PACER_USERNAME    PACER account username (optional — falls back to RSS)
  PACER_PASSWORD    PACER account password (optional — falls back to RSS)
  OPENPAGERANK_KEY  Open PageRank API key (optional — works without)

Setup:
  1. Create a free PACER account at https://pacer.uscourts.gov
  2. Get a free Open PageRank key at https://www.domcop.com/openpagerank/
  3. Add credentials to .env file
  4. Run: npm run snipe
`);
        process.exit(0);
    }

    return { days: values.days };
}

function run(cmd) {
    try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

async function main() {
    const args = parseCliArgs();

    const banner = `
╔══════════════════════════════════════════════════════════╗
║              DOMAIN SNIPER v0.1.0                       ║
║     AI-Powered Bankruptcy Domain Finder                 ║
╚══════════════════════════════════════════════════════════╝
`;
    console.log(banner);

    // Step 1: Scrape PACER
    console.log('STEP 1/3: Scraping PACER for Chapter 7 filings...\n');
    run(`node src/pacer-scraper.js --days ${args.days}`);

    console.log('\n');

    // Step 2: Score domains
    console.log('STEP 2/3: Scoring domain authority and value...\n');
    run('node src/domain-scorer.js');

    console.log('\n');

    // Step 3: Generate digest
    console.log('STEP 3/3: Generating daily digest...\n');
    run('node src/daily-digest.js');

    console.log('\n');
    console.log('='.repeat(60));
    console.log('PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log('Check reports/ directory for your daily digest.');
    console.log('Run again tomorrow for fresh opportunities: npm run snipe');
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

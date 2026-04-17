#!/usr/bin/env node
/**
 * Daily Digest — Formatted report of best domain opportunities.
 *
 * Reads scored domains and generates a markdown report.
 *
 * Usage:
 *   node src/daily-digest.js
 *   node src/daily-digest.js --input data/scored.json --output reports/digest-2026-04-14.md
 */

import { parseArgs } from 'node:util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseCliArgs() {
    const today = new Date().toISOString().split('T')[0];
    const options = {
        input: { type: 'string', short: 'i', default: 'data/scored.json' },
        output: { type: 'string', short: 'o', default: `reports/digest-${today}.md` },
        help: { type: 'boolean', short: 'h' },
    };

    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
Daily Digest — Generate a formatted domain opportunity report

Usage:
  node src/daily-digest.js [options]

Options:
  --input, -i    Scored domains JSON (default: data/scored.json)
  --output, -o   Output markdown report (default: reports/digest-YYYY-MM-DD.md)
  --help, -h     Show this help
`);
        process.exit(0);
    }

    return { input: values.input, output: values.output };
}

function generateDigest(data) {
    const today = new Date().toISOString().split('T')[0];
    const domains = data.domains || [];
    const summary = data.summary || {};

    const buys = domains.filter(d => d.score.recommendation === 'BUY');
    const considers = domains.filter(d => d.score.recommendation === 'CONSIDER');
    const watches = domains.filter(d => d.score.recommendation === 'WATCH');

    let md = `# Domain Sniper Daily Digest — ${today}\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Domains scanned | ${summary.totalScored || domains.length} |\n`;
    md += `| Average score | ${summary.averageScore || 'N/A'}/100 |\n`;
    md += `| BUY recommendations | ${buys.length} |\n`;
    md += `| CONSIDER recommendations | ${considers.length} |\n`;
    md += `| WATCH list | ${watches.length} |\n\n`;

    // Top picks — BUY
    if (buys.length > 0) {
        md += `## BUY — High-Value Available Domains\n\n`;
        md += `These domains are expired/available AND have strong authority. Act fast.\n\n`;
        for (const d of buys) {
            md += `### ${d.domain}\n`;
            md += `- **Score:** ${d.score.totalScore}/100 (${d.score.grade})\n`;
            md += `- **Est. value:** $${d.score.estimatedValue.low}-$${d.score.estimatedValue.high}\n`;
            md += `- **PageRank:** ${d.pageRank?.pageRankDecimal || 'N/A'}\n`;
            md += `- **Age:** ${d.domainStatus?.ageYears || 'N/A'} years\n`;
            md += `- **Wayback:** ${d.wayback?.hasSnapshots ? `[View history](${d.wayback.latestSnapshot})` : 'No snapshots'}\n`;
            md += `- **Bankruptcy case:** ${d.caseTitle || 'N/A'}\n`;
            md += `- **Action:** Register immediately at your preferred registrar\n\n`;
        }
    }

    // CONSIDER
    if (considers.length > 0) {
        md += `## CONSIDER — Worth a Closer Look\n\n`;
        md += `Available domains with moderate authority. May be worth the registration fee.\n\n`;
        md += `| Domain | Score | Est. Value | PageRank | Age | Available |\n`;
        md += `|--------|-------|-----------|----------|-----|-----------|\n`;
        for (const d of considers) {
            md += `| ${d.domain} | ${d.score.totalScore}/100 | $${d.score.estimatedValue.low}-$${d.score.estimatedValue.high} | ${d.pageRank?.pageRankDecimal || 'N/A'} | ${d.domainStatus?.ageYears || '?'}yr | ${d.score.isAvailable ? 'YES' : 'No'} |\n`;
        }
        md += `\n`;
    }

    // WATCH
    if (watches.length > 0) {
        md += `## WATCH — Not Available Yet, But Worth Monitoring\n\n`;
        md += `These domains have strong authority but are still registered. Watch for expiration.\n\n`;
        md += `| Domain | Score | Est. Value | Expires | PageRank |\n`;
        md += `|--------|-------|-----------|---------|----------|\n`;
        for (const d of watches.slice(0, 15)) {
            const expires = d.domainStatus?.expirationDate
                ? new Date(d.domainStatus.expirationDate).toISOString().split('T')[0]
                : 'Unknown';
            md += `| ${d.domain} | ${d.score.totalScore}/100 | $${d.score.estimatedValue.low}-$${d.score.estimatedValue.high} | ${expires} | ${d.pageRank?.pageRankDecimal || 'N/A'} |\n`;
        }
        md += `\n`;
    }

    // Next steps
    md += `## Next Steps\n\n`;
    md += `1. **BUY domains:** Register immediately at Namecheap, GoDaddy, or Porkbun\n`;
    md += `2. **Set up 301 redirects:** Point to your money site or affiliate offers\n`;
    md += `3. **Check backlink profiles:** Use Ahrefs free backlink checker to verify link quality\n`;
    md += `4. **Monitor WATCH list:** Set calendar reminders for expiration dates\n`;
    md += `5. **Run again tomorrow:** \`npm run snipe\` for fresh filings\n\n`;

    md += `---\n*Generated by Domain Sniper — ${new Date().toISOString()}*\n`;

    return md;
}

async function main() {
    const args = parseCliArgs();

    const inputPath = join(__dirname, '..', args.input);
    if (!existsSync(inputPath)) {
        console.error(`Input file not found: ${args.input}`);
        console.error('Run the scorer first: node src/domain-scorer.js');
        process.exit(1);
    }

    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const digest = generateDigest(data);

    const outputPath = join(__dirname, '..', args.output);
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(outputPath, digest);

    console.log('='.repeat(60));
    console.log('DOMAIN SNIPER — Daily Digest');
    console.log('='.repeat(60));
    console.log(`Report saved to: ${args.output}`);
    console.log();
    console.log(digest);
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

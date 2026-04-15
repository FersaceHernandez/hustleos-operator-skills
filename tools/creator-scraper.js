#!/usr/bin/env node
/**
 * Creator Scraper — Scrape Facebook creators for monetizable content ideas.
 *
 * Run locally (not in sandbox) with full internet access.
 *
 * Usage:
 *   node tools/creator-scraper.js
 *   node --env-file=.env tools/creator-scraper.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
    console.error('Error: APIFY_TOKEN not found. Set it in .env or environment.');
    process.exit(1);
}

// Creators to scrape
const TARGETS = [
    {
        name: 'Tipper fb',
        platform: 'facebook',
        url: 'https://www.facebook.com/Tipperfb',
        actor: 'apify/facebook-posts-scraper',
        input: {
            startUrls: [{ url: 'https://www.facebook.com/Tipperfb' }],
            resultsLimit: 50,
        },
    },
    {
        name: 'Mrstickmantkk',
        platform: 'facebook',
        url: 'https://www.facebook.com/Mrstickmantkk',
        actor: 'apify/facebook-posts-scraper',
        input: {
            startUrls: [{ url: 'https://www.facebook.com/Mrstickmantkk' }],
            resultsLimit: 50,
        },
    },
    {
        name: 'Mrstickmantkk (IG)',
        platform: 'instagram',
        url: 'https://www.instagram.com/mrstickmantkk',
        actor: 'apify/instagram-post-scraper',
        input: {
            directUrls: ['https://www.instagram.com/mrstickmantkk/'],
            resultsLimit: 50,
        },
    },
];

const USER_AGENT = 'creator-scraper/1.0';

async function startActor(target) {
    const apiActorId = target.actor.replace('/', '~');
    const url = `https://api.apify.com/v2/acts/${apiActorId}/runs?token=${encodeURIComponent(APIFY_TOKEN)}`;

    console.log(`\nStarting scrape: ${target.name} (${target.platform})`);
    console.log(`  Actor: ${target.actor}`);
    console.log(`  URL: ${target.url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        },
        body: JSON.stringify(target.input),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`  FAILED (${response.status}): ${text.slice(0, 200)}`);
        return null;
    }

    const result = await response.json();
    console.log(`  Run ID: ${result.data.id}`);
    return {
        name: target.name,
        runId: result.data.id,
        datasetId: result.data.defaultDatasetId,
    };
}

async function pollRun(run) {
    const url = `https://api.apify.com/v2/actor-runs/${run.runId}?token=${encodeURIComponent(APIFY_TOKEN)}`;
    let status = 'RUNNING';
    let lastStatus = '';

    while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        await new Promise(r => setTimeout(r, 5000));
        const resp = await fetch(url);
        const data = await resp.json();
        status = data.data.status;
        if (status !== lastStatus) {
            console.log(`  ${run.name}: ${status}`);
            lastStatus = status;
        }
    }

    return status;
}

async function getResults(run) {
    const url = `https://api.apify.com/v2/datasets/${run.datasetId}/items?token=${encodeURIComponent(APIFY_TOKEN)}&format=json`;
    const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!resp.ok) return [];
    return resp.json();
}

function analyzeContent(posts, creatorName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CONTENT ANALYSIS: ${creatorName}`);
    console.log('='.repeat(60));
    console.log(`Total posts scraped: ${posts.length}\n`);

    // Sort by engagement
    const sorted = posts
        .map(p => ({
            text: (p.text || p.message || p.caption || '').slice(0, 300),
            likes: p.likes || p.likesCount || p.likeCount || 0,
            comments: p.comments || p.commentsCount || p.commentCount || 0,
            shares: p.shares || p.sharesCount || p.shareCount || 0,
            url: p.url || p.postUrl || p.shortCode || '',
            date: p.time || p.date || p.timestamp || '',
            type: p.type || p.mediaType || 'unknown',
            engagement: (p.likes || p.likesCount || p.likeCount || 0) +
                       (p.comments || p.commentsCount || p.commentCount || 0) +
                       (p.shares || p.sharesCount || p.shareCount || 0),
        }))
        .sort((a, b) => b.engagement - a.engagement);

    // Top posts
    console.log('TOP 20 POSTS BY ENGAGEMENT:');
    console.log('-'.repeat(60));
    for (let i = 0; i < Math.min(20, sorted.length); i++) {
        const p = sorted[i];
        console.log(`\n#${i + 1} — Engagement: ${p.engagement.toLocaleString()} (${p.likes.toLocaleString()} likes, ${p.comments.toLocaleString()} comments, ${p.shares.toLocaleString()} shares)`);
        console.log(`  Type: ${p.type} | Date: ${p.date}`);
        console.log(`  Text: ${p.text || '[no text]'}`);
        if (p.url) console.log(`  URL: ${p.url}`);
    }

    // Extract topics/themes
    const allText = sorted.map(p => p.text.toLowerCase()).join(' ');
    const topicKeywords = {
        'TCPA / Spam Calls': ['tcpa', 'spam call', 'robocall', 'telemarket'],
        'Domain Flipping / SEO': ['domain', 'seo', '301', 'redirect', 'backlink', 'authority'],
        'Bankruptcy / Liquidation': ['bankruptcy', 'chapter 7', 'liquidat', 'pacer', 'auction'],
        'Credit / FCRA': ['credit report', 'credit score', 'fcra', 'credit bureau'],
        'Debt Collection / FDCPA': ['debt collect', 'fdcpa', 'collection agency'],
        'Legal Loopholes': ['legal', 'loophole', 'lawsuit', 'sue', 'settlement', 'court'],
        'Real Estate': ['real estate', 'property', 'rental', 'mortgage', 'landlord'],
        'E-commerce': ['ecommerce', 'e-commerce', 'shopify', 'dropship', 'amazon fba'],
        'Affiliate Marketing': ['affiliate', 'commission', 'referral'],
        'Crypto / Web3': ['crypto', 'bitcoin', 'nft', 'blockchain', 'web3'],
        'AI / Automation': ['ai', 'artificial intelligence', 'automat', 'chatgpt', 'claude'],
        'Freelancing / Services': ['freelanc', 'client', 'agency', 'service'],
        'Investing': ['invest', 'stock', 'dividend', 'portfolio', 'etf'],
        'Tax Strategies': ['tax', 'deduct', 'write-off', 'irs', 'llc'],
        'Insurance': ['insurance', 'claim', 'premium', 'policy'],
        'Government Programs': ['government', 'grant', 'sba', 'subsid', 'program'],
        'Unclaimed Money': ['unclaimed', 'uncashed', 'forgotten', 'owed'],
        'Reselling / Flipping': ['resell', 'flip', 'thrift', 'arbitrage', 'wholesale'],
        'Content Creation': ['content', 'youtube', 'tiktok', 'creator', 'monetiz'],
        'Side Hustles': ['side hustle', 'passive income', 'extra money', 'gig'],
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log('TOPICS DETECTED');
    console.log('='.repeat(60));

    const detectedTopics = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const count = keywords.reduce((sum, kw) => {
            return sum + (allText.split(kw).length - 1);
        }, 0);
        if (count > 0) {
            detectedTopics.push({ topic, mentions: count });
        }
    }

    detectedTopics.sort((a, b) => b.mentions - a.mentions);
    for (const t of detectedTopics) {
        console.log(`  ${t.topic}: ${t.mentions} mentions`);
    }

    // Avg engagement
    const avgEngagement = Math.round(sorted.reduce((s, p) => s + p.engagement, 0) / sorted.length);
    console.log(`\nAverage engagement per post: ${avgEngagement.toLocaleString()}`);

    return { sorted, detectedTopics, avgEngagement };
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         CREATOR SCRAPER — Content Intelligence          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    // Ensure output dir
    if (!existsSync('data')) mkdirSync('data', { recursive: true });
    if (!existsSync('reports')) mkdirSync('reports', { recursive: true });

    // Start all scrapes
    const runs = [];
    for (const target of TARGETS) {
        const run = await startActor(target);
        if (run) runs.push(run);
    }

    if (runs.length === 0) {
        console.error('\nNo scrapes started. Check your APIFY_TOKEN.');
        process.exit(1);
    }

    // Poll all runs
    console.log('\nWaiting for scrapes to complete...');
    const allResults = {};

    for (const run of runs) {
        const status = await pollRun(run);
        if (status === 'SUCCEEDED') {
            const posts = await getResults(run);
            allResults[run.name] = posts;

            // Save raw data
            writeFileSync(`data/${run.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-posts.json`,
                JSON.stringify(posts, null, 2));
            console.log(`  Saved ${posts.length} posts for ${run.name}`);
        } else {
            console.log(`  ${run.name}: ${status} — no data`);
        }
    }

    // Analyze each creator
    const analyses = {};
    for (const [name, posts] of Object.entries(allResults)) {
        if (posts.length > 0) {
            analyses[name] = analyzeContent(posts, name);
        }
    }

    // Generate combined report
    let report = `# Creator Content Intelligence Report\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const [name, analysis] of Object.entries(analyses)) {
        report += `## ${name}\n\n`;
        report += `- Posts analyzed: ${analysis.sorted.length}\n`;
        report += `- Avg engagement: ${analysis.avgEngagement.toLocaleString()}\n\n`;

        report += `### Topics Covered\n\n`;
        report += `| Topic | Mentions |\n|---|---|\n`;
        for (const t of analysis.detectedTopics) {
            report += `| ${t.topic} | ${t.mentions} |\n`;
        }

        report += `\n### Top 10 Posts\n\n`;
        for (let i = 0; i < Math.min(10, analysis.sorted.length); i++) {
            const p = analysis.sorted[i];
            report += `${i + 1}. **${p.engagement.toLocaleString()} engagement** — ${p.text.slice(0, 150)}...\n`;
        }
        report += `\n---\n\n`;
    }

    report += `## Monetizable Ideas to Explore\n\n`;
    report += `[Review the topics above and the top posts. The highest-engagement topics\n`;
    report += `with the most shares are the most monetizable — shares = people sending\n`;
    report += `it to friends = viral potential = audience growth = money.]\n`;

    writeFileSync('reports/creator-intel.md', report);
    console.log(`\n${'='.repeat(60)}`);
    console.log('REPORT SAVED: reports/creator-intel.md');
    console.log('='.repeat(60));
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

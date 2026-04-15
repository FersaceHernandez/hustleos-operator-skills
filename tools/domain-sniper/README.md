# Domain Sniper

AI-powered tool that monitors U.S. Bankruptcy Court (PACER) for Chapter 7 liquidations of e-commerce and tech companies, extracts their domain names, scores them by SEO authority, and tells you which ones to buy.

## Why This Works

When e-commerce companies go bankrupt, their domains often have:
- Years of built-up SEO authority
- Thousands of backlinks from real sites
- Established domain age (Google trusts older domains)

These domains sell for $50-500 at bankruptcy auctions. The SEO authority they carry can be worth $10,000-$100,000+.

**The play:** Buy the domain → set up 301 redirect → transfer all that authority to your site or affiliate offers.

## Quick Start

```bash
# Run the full pipeline
npm run snipe

# Or run steps individually
npm run scrape    # 1. Scrape PACER for filings
npm run score     # 2. Score domains by authority
npm run digest    # 3. Generate daily report
```

## Setup

1. **Create a PACER account** (free): https://pacer.uscourts.gov
   - $0.10/page, but free if under $30/quarter

2. **Get an Open PageRank API key** (free): https://www.domcop.com/openpagerank/

3. **Add credentials to your `.env`:**
```
PACER_USERNAME=your_username
PACER_PASSWORD=your_password
OPENPAGERANK_KEY=your_key
```

4. **Run it:**
```bash
npm run snipe
```

Without PACER credentials, the tool falls back to free RSS feeds from major bankruptcy courts (Delaware, SDNY, NJ, NorCal, SoCal, Southern TX).

## How It Works

### Step 1: PACER Scraper (`npm run scrape`)
- Searches Chapter 7 bankruptcy filings
- Filters for e-commerce, tech, and digital businesses
- Extracts domain names from filings
- Falls back to free court RSS feeds if no PACER account

### Step 2: Domain Scorer (`npm run score`)
- Checks domain authority via Open PageRank (free)
- Checks registration status via RDAP (free)
- Checks Wayback Machine for historical content (free)
- Scores each domain on a 100-point scale
- Estimates dollar value
- Labels: BUY / CONSIDER / WATCH / SKIP

### Step 3: Daily Digest (`npm run digest`)
- Generates a markdown report with all findings
- Ranked by score, grouped by recommendation
- Includes next steps and action items

## Scoring

| Factor | Weight | Source |
|--------|--------|--------|
| PageRank | 40% | Open PageRank API |
| Domain age | 20% | RDAP/WHOIS |
| TLD quality | 15% | .com > .io > .ai > others |
| Domain length | 10% | Shorter = more valuable |
| Wayback history | 15% | Internet Archive |

### Grades
- **A (80-100):** High authority, strong backlinks, premium TLD
- **B (60-79):** Good authority, worth the registration fee
- **C (40-59):** Moderate, could be worth it for niche plays
- **D (20-39):** Low authority, only if the name itself is good
- **F (0-19):** Skip

## Output

```
tools/domain-sniper/
├── data/
│   ├── filings.json     # Raw PACER data
│   └── scored.json      # Scored domains
└── reports/
    └── digest-YYYY-MM-DD.md   # Daily report
```

## Cost

| Service | Cost |
|---------|------|
| PACER | $0.10/page, free under $30/quarter |
| Open PageRank | Free |
| RDAP (domain status) | Free |
| Wayback Machine | Free |
| Domain registration | $8-15/year per domain |

Total to run: essentially free.

## What to Do With Domains You Buy

1. **301 redirect** — Point to your money site, inherit SEO authority
2. **Flip** — Sell on Afternic, Sedo, or GoDaddy Auctions for 10-100x
3. **Build** — Put up a site and monetize the existing backlink traffic
4. **Affiliate** — Redirect to affiliate offers in the domain's original niche
5. **Park** — Use a domain parking service for passive ad revenue while you decide

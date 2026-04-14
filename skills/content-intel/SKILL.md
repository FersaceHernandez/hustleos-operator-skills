---
name: content-intel
description: Use when analyzing social media performance, researching what's going viral, scraping competitor accounts, tracking engagement trends, or identifying content opportunities. Connects to Apify MCP server to pull live data from Instagram, TikTok, Twitter/X, YouTube, LinkedIn, and more.
---

# Content Intelligence

Scrape social media accounts, analyze what's going viral, spot trends, and find content opportunities — all powered by live data from Apify.

## Trigger on requests like

- what's going viral in my niche
- analyze my Instagram engagement
- scrape my competitor's posts
- what content is performing best on [platform]
- find trending topics in [niche]
- show me what's working on TikTok right now
- analyze [handle]'s content strategy
- what hashtags are trending
- compare my engagement to competitors
- pull my latest post metrics

## Prerequisites

- Apify MCP server connected (via `https://mcp.apify.com` or local)
- Apify API token (set as `APIFY_TOKEN` in `.env`)
- User's social handles and competitor handles

## Setup: Apify MCP Server

Add to your Claude Code MCP config (`~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "apify": {
      "url": "https://mcp.apify.com",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

Or local stdio:
```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["@apify/actors-mcp-server"],
      "env": {
        "APIFY_TOKEN": "your-apify-token"
      }
    }
  }
}
```

## Workflow

### Step 1: Define the Intelligence Target

Collect from the user:

| Parameter | Example |
|-----------|---------|
| Your handles | @fersace on IG, @fersace on TikTok, etc. |
| Competitor handles | 3-5 accounts in same niche |
| Niche/industry | AI, SaaS, fitness, real estate, etc. |
| Platforms to track | Instagram, TikTok, Twitter/X, YouTube, LinkedIn |
| Timeframe | Last 7 days, 30 days, 90 days |

Store in a `content-profile.md`:

```markdown
# Content Profile

## My Accounts
- Instagram: @handle
- TikTok: @handle
- Twitter/X: @handle
- YouTube: @channel
- LinkedIn: /in/handle

## Competitors
1. @competitor1 — [why they're relevant]
2. @competitor2
3. @competitor3
4. @competitor4
5. @competitor5

## Niche
[primary niche] — [sub-niches]

## Content Goals
- [grow followers / drive leads / build authority / sell product]
```

### Step 2: Scrape Your Accounts

Pull your own performance data using Apify Actors:

**Instagram:**
```
Actor: apify/instagram-profile-scraper → Profile stats
Actor: apify/instagram-post-scraper → Post-level engagement
Actor: apify/instagram-reel-scraper → Reels performance
Actor: apify/instagram-comment-scraper → Comment sentiment
```

**TikTok:**
```
Actor: clockworks/tiktok-profile-scraper → Profile stats
Actor: clockworks/tiktok-video-scraper → Video metrics
Actor: clockworks/tiktok-comments-scraper → Comment analysis
```

**Twitter/X:**
```
Actor: apify/twitter-scraper → Tweets and engagement
```

**YouTube:**
```
Actor: streamers/youtube-channel-scraper → Channel stats
Actor: streamers/youtube-scraper → Video metrics
Actor: streamers/youtube-comments-scraper → Comment analysis
```

**LinkedIn:**
```
Actor: apify/linkedin-profile-scraper → Profile data
Actor: apify/linkedin-post-scraper → Post engagement
```

For each account, extract:
- Follower count and growth trend
- Post frequency
- Average engagement rate (likes + comments + shares / followers)
- Top performing posts (by engagement)
- Worst performing posts
- Posting times and days
- Hashtags used
- Content format breakdown (reels vs. static vs. carousel vs. stories)

### Step 3: Scrape Competitors

Run the same scrapers on competitor accounts. For each competitor, build a profile:

```
COMPETITOR: @handle
━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform: [platform]
Followers: [count]
Avg engagement rate: [%]
Post frequency: [posts/week]
Top content type: [reels/carousels/threads/etc.]
Top 5 posts (by engagement):
  1. [description] — [likes] likes, [comments] comments
  2. ...
Hashtag strategy: [top hashtags used]
Posting schedule: [days/times]
Content themes: [list of recurring topics]
Hook patterns: [how they open posts]
CTA patterns: [how they close posts]
```

### Step 4: Trend Detection

Identify what's going viral right now:

**Platform-specific trending:**
```
Actor: apify/instagram-hashtag-scraper → Trending hashtags
Actor: clockworks/tiktok-trends-scraper → TikTok trending
Actor: clockworks/tiktok-hashtag-scraper → Hashtag trends
Actor: apify/google-trends-scraper → Google Trends for topic validation
```

**Analyze viral patterns across collected data:**

| Metric | How to Identify Viral |
|--------|----------------------|
| Engagement rate | >3x the account's average |
| Share/save ratio | High saves = evergreen, high shares = viral |
| Comment velocity | Fast comment accumulation in first hours |
| View-to-like ratio | TikTok: >10% is strong |
| Follower gain per post | Posts that drive follows, not just likes |

**For each viral post found, extract:**
- Hook (first line / first 3 seconds)
- Format (reel, carousel, thread, static)
- Topic/angle
- Hashtags used
- Posting time
- Engagement breakdown (likes, comments, shares, saves)
- What made it work (pattern analysis)

### Step 5: Content Gap Analysis

Compare your performance to competitors and trends:

```
CONTENT GAP ANALYSIS
━━━━━━━━━━━━━━━━━━━

Topics competitors cover that you don't:
  - [topic 1] — avg engagement: [X]
  - [topic 2] — avg engagement: [X]

Formats competitors use that you don't:
  - [format] — [competitor] gets [X] avg engagement

Trending topics in your niche you haven't posted about:
  - [trend 1] — [volume/velocity]
  - [trend 2]

Your best-performing content types:
  - [type] — [avg engagement] (double down on this)

Your worst-performing content types:
  - [type] — [avg engagement] (stop or fix this)

Optimal posting times (from your data):
  - [day] at [time] — highest engagement
  - [day] at [time] — second highest

Hashtag opportunities:
  - [hashtag] — [volume] posts, [avg engagement] — you're not using this
```

### Step 6: Generate Report

Save findings to `content-intel-report.md`:

```markdown
# Content Intelligence Report
Generated: [date]

## Your Performance Summary
[stats table]

## Competitor Benchmarks
[comparison table]

## What's Going Viral Right Now
[top 10 viral posts in niche with analysis]

## Content Gaps & Opportunities
[gap analysis]

## Recommended Actions
1. [specific action with data backing]
2. [specific action]
3. [specific action]

## Raw Data
[links to saved datasets]
```

## Scheduling

Run this analysis:
- **Weekly**: Quick scan of your metrics + competitor top posts
- **Monthly**: Full deep dive with trend analysis and strategy adjustments
- **On-demand**: Before planning a content batch

## Output

- Content profile with all account data
- Competitor analysis profiles
- Trending content report
- Content gap analysis
- Actionable recommendations with data backing
- Raw datasets saved for dashboard

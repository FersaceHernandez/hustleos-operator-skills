# SEO/GEO Audit Checklist

## P0 — Critical (blocks indexing)
- [ ] robots.txt allows important pages
- [ ] Site accessible (no 5xx errors)
- [ ] HTTPS enabled
- [ ] Mobile-responsive
- [ ] No critical pages blocked by noindex
- [ ] Indexed in Google (site:domain.com)
- [ ] Unique title tag (50-60 chars) with primary keyword
- [ ] Single H1 per page with keyword

## P1 — Important (significant ranking impact)
- [ ] robots.txt allows AI bots (GPTBot, PerplexityBot, ClaudeBot)
- [ ] XML sitemap exists and submitted
- [ ] Indexed in Bing (for Copilot)
- [ ] Canonical tags set
- [ ] Page load < 3 seconds
- [ ] Meta description (150-160 chars) with keyword
- [ ] Organization schema on homepage
- [ ] FAQPage schema on FAQ sections (+40% AI visibility)
- [ ] Content includes authoritative citations (+40%)
- [ ] Statistics and data points included (+37%)
- [ ] NO keyword stuffing (-10%)

## P2 — Recommended (improves visibility)
- [ ] OG tags (title, description, image, url)
- [ ] Twitter card tags
- [ ] Images have alt text
- [ ] Internal links to related content
- [ ] Authoritative tone (+25%)
- [ ] Easy-to-understand language (+20%)
- [ ] Technical terminology where appropriate (+18%)
- [ ] Diverse vocabulary (+15%)
- [ ] High fluency and readability (+15-30%)
- [ ] Answer-first content structure

## AI Bot robots.txt
```
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
Sitemap: https://example.com/sitemap.xml
```

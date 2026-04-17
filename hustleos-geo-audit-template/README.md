# HustleOS GEO Audit — How to Run

## Quick Start

```bash
cd hustleos-operator-skills
claude
```

Then say:
> Run a full SEO/GEO audit on [client-url] using the seo-geo skill. Generate a client-ready report.

Claude loads the seo-geo skill automatically and follows the workflow.

## Manual Steps

### 1. Technical SEO Audit
```bash
python3 skills/seo-geo/scripts/seo_audit.py "https://client-site.com"
curl -sL "https://client-site.com" | grep -E "<title>|<meta|ld\+json" | head -20
curl -s "https://client-site.com/robots.txt"
curl -s "https://client-site.com/sitemap.xml" | head -50
```

### 2. GEO Score
Score the site against the 9 Princeton methods (see `audit-checklist.md`).

### 3. Generate Report
Use `report-template.md` as the base. Fill in findings, scores, and recommendations.

### 4. Deliver
Export as PDF. Send to client. Upsell implementation at $2-5K.

## Pricing for Clients

| Deliverable | Price |
|---|---|
| GEO Audit Report (PDF) | $500-1,000 |
| Audit + Implementation | $2,000-5,000 |
| Monthly GEO Retainer | $1,000-2,500/mo |
| Full SEO + GEO Package | $3,000-7,500 |

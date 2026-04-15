# CashMoney.bot

AI-powered tools that find you money.

## Tools

1. **TCPA Claim Generator** — Log spam calls, generate FCC complaints ($500-$1,500 per violation)
2. **Domain Sniper** — Find expired e-commerce domains from bankruptcy courts
3. **Credit Dispute AI** — Auto-generate credit report dispute letters ($1,000 per error under FCRA)
4. **ADA Site Scanner** — Scan websites for accessibility violations ($3-10K settlements)
5. **Demand Letter Writer** — AI-drafted legal demand letters in 30 seconds

## Deploy to Cloudflare Pages

1. Connect this repo in Cloudflare Pages dashboard
2. Build command: (leave blank)
3. Output directory: `public`
4. Deploy

## On Your Machine

```bash
# Copy this folder into the cashmoney.bot repo
cp -r cashmoney-bot/* /path/to/cashmoney.bot/
cd /path/to/cashmoney.bot
git add -A
git commit -m "Initial landing page"
git push origin main
```

Then connect to Cloudflare Pages and point to `public/`.

## Pricing

- Free: Limited access to all tools
- Pro ($29/mo): Unlimited everything
- Agency ($99/mo): Bulk processing + API + white-label

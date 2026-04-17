# JSON-LD Schema Templates

## FAQPage (+40% AI Visibility)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [topic]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "According to [source], [answer with statistics]."
    }
  }]
}
```

## SoftwareApplication (for tools/apps)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[App Name]",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

## Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Name]",
  "url": "https://example.com",
  "sameAs": ["https://twitter.com/handle", "https://instagram.com/handle"]
}
```

## Combined (recommended for landing pages)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", ... },
    { "@type": "SoftwareApplication", ... },
    { "@type": "FAQPage", ... },
    { "@type": "Organization", ... }
  ]
}
```

See full templates with all fields in the OPC Skills repo.

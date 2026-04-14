---
name: doc-generator
description: Use when generating polished documents — PDFs, Excel spreadsheets, PowerPoint decks, or Word docs. Leverages Claude's built-in document skills (xlsx, pptx, pdf, docx) for ATS-optimized resumes, proposals, reports, pitch decks, invoices, and any professional document.
---

# Document Generator

Use this skill to generate professional documents using Claude's built-in document generation skills. Outputs real files — not just text.

## Trigger on requests like

- generate a PDF resume
- create a pitch deck
- make a spreadsheet for [data]
- build a proposal document
- export this as a PDF
- create an invoice
- make a PowerPoint presentation
- generate a report in Word format

## Available Document Types

| Skill ID | Format | Best For |
|----------|--------|----------|
| `pdf` | PDF | Resumes, reports, proposals, invoices, contracts |
| `xlsx` | Excel | Financial models, trackers, dashboards, data analysis |
| `pptx` | PowerPoint | Pitch decks, presentations, slide reports |
| `docx` | Word | Proposals, SOWs, long-form documents, contracts |

## Workflow

### Step 1: Determine Document Type

Based on the user's request, select the right skill:

- **Resume / CV** → `pdf` (ATS-optimized, clean formatting)
- **Pitch deck / presentation** → `pptx`
- **Financial model / tracker** → `xlsx`
- **Proposal / contract / SOW** → `docx`
- **Invoice / receipt** → `pdf`
- **Report with charts** → `xlsx` (data) + `pptx` (presentation)

### Step 2: Gather Content

Collect all content needed for the document:

**For resumes:**
- Contact info, summary, experience, skills, education
- Target role (for tailoring)
- Style preference (modern, classic, minimal)

**For pitch decks:**
- Problem, solution, market, traction, team, ask
- Company branding (colors, logo)
- Slide count preference

**For spreadsheets:**
- Data to include
- Calculations needed
- Chart types
- Sheet organization

**For proposals:**
- Client name, project scope, deliverables
- Timeline, pricing, terms
- Company branding

### Step 3: Generate via Claude Skills API

Use the Claude API with built-in skills:

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "pdf", "version": "latest"}
        ]
    },
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    messages=[{"role": "user", "content": prompt}],
    betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"],
)
```

### Step 4: Download the File

Extract and download generated files:

```python
from utils.file_utils import download_all_files, print_download_summary

results = download_all_files(client, response, output_dir="output")
print_download_summary(results)
```

### Step 5: Review and Iterate

Present the document to the user:
- Confirm formatting looks correct
- Check for content accuracy
- Offer to regenerate with adjustments

## Document Templates

### Resume PDF
- Clean, single-column layout (ATS-friendly)
- Standard sections: Contact, Summary, Experience, Skills, Education
- Consistent fonts and spacing
- No graphics, tables, or multi-column layouts (for ATS parsing)

### Pitch Deck
- Title slide with company name and tagline
- Problem → Solution → Market → Product → Traction → Team → Ask
- Max 12 slides, max 6 bullets per slide
- Consistent branding throughout

### Financial Spreadsheet
- Clear headers with formatting
- Formulas for calculations
- Charts for visual data
- Multiple sheets for different views

### Proposal Document
- Cover page with branding
- Executive summary
- Scope and deliverables
- Timeline and milestones
- Pricing table
- Terms and conditions

## Requirements

- `anthropic` Python SDK >= 0.71.0
- API key with access to beta features
- Beta headers: `code-execution-2025-08-25`, `files-api-2025-04-14`, `skills-2025-10-02`

## Output

- Generated document file (PDF, XLSX, PPTX, or DOCX)
- Download confirmation with file path and size
- Revision suggestions if needed

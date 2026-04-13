---
name: apify-generate-output-schema
description: Generate output schemas (dataset_schema.json, output_schema.json, key_value_store_schema.json) for an Apify Actor by analyzing its source code. Use when creating or updating Actor output schemas.
---

# Generate Actor Output Schema

You are generating output schema files for an Apify Actor. The output schema tells Apify Console how to display run results. You will analyze the Actor's source code, create `dataset_schema.json`, `output_schema.json`, and `key_value_store_schema.json` (if the Actor uses key-value store), and update `actor.json`.

## Core Principles

- **Analyze code first**: Read the Actor's source to understand what data it actually pushes to the dataset — never guess
- **Every field is nullable**: APIs and websites are unpredictable — always set `"nullable": true`
- **Anonymize examples**: Never use real user IDs, usernames, or personal data in examples
- **Verify against code**: If TypeScript types exist, cross-check the schema against both the type definition AND the code that produces the values
- **Reuse existing patterns**: Before generating schemas, check if other Actors in the same repository already have output schemas — match their structure, naming conventions, description style, and formatting
- **Don't reinvent the wheel**: Reuse existing type definitions, interfaces, and utilities from the codebase instead of creating duplicate definitions

---

## Phase 1: Discover Actor Structure

**Goal**: Locate the Actor and understand its output

Initial request: $ARGUMENTS

**Actions**:
1. Create todo list with all phases
2. Find the `.actor/` directory containing `actor.json`
3. Read `actor.json` to understand the Actor's configuration
4. Check if `dataset_schema.json`, `output_schema.json`, and `key_value_store_schema.json` already exist
5. **Search for existing schemas in the repository**: Look for other `.actor/` directories or schema files to learn the repo's conventions — match their description style, field naming, example formatting, and overall structure
6. Find all places where data is pushed to the dataset:
   - **JavaScript/TypeScript**: Search for `Actor.pushData(`, `dataset.pushData(`, `Dataset.pushData(`
   - **Python**: Search for `Actor.push_data(`, `dataset.push_data(`, `Dataset.push_data(`
7. Find all places where data is stored in the key-value store:
   - **JavaScript/TypeScript**: Search for `Actor.setValue(`, `keyValueStore.setValue(`, `KeyValueStore.setValue(`
   - **Python**: Search for `Actor.set_value(`, `key_value_store.set_value(`, `KeyValueStore.set_value(`
8. Find output type definitions — **reuse them directly** instead of recreating from scratch
9. Check for existing shared schema utilities or helper functions in the codebase
10. If inline `storages.dataset` or `storages.keyValueStore` config exists in `actor.json`, note it for migration

Present findings to user: list all discovered dataset output fields, key-value store keys, their types, and where they come from.

---

## Phase 2: Generate `dataset_schema.json`

**Goal**: Create a complete dataset schema with field definitions and display views

### File structure

```json
{
    "actorSpecification": 1,
    "fields": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            // ALL output fields here
        },
        "required": [],
        "additionalProperties": true
    },
    "views": {
        "overview": {
            "title": "Overview",
            "description": "Most important fields at a glance",
            "transformation": {
                "fields": [
                    // 8-12 most important field names
                ]
            },
            "display": {
                "component": "table",
                "properties": {
                    // Display config for each overview field
                }
            }
        }
    }
}
```

### Hard rules (no exceptions)

| Rule | Detail |
|------|--------|
| **All fields in `properties`** | The `fields.properties` object must contain **every** field the Actor can output |
| `"nullable": true` | On **every** field — APIs are unpredictable |
| `"additionalProperties": true` | On the **top-level `fields` object** AND on **every nested object** |
| `"required": []` | Always empty array — on both levels |
| Anonymized examples | No real user IDs, usernames, or content |
| `"type"` required with `"nullable"` | AJV rejects `nullable` without a `type` |

### Field type patterns

**String field:**
```json
"title": {
    "type": "string",
    "description": "Title of the scraped item",
    "nullable": true,
    "example": "Example Item Title"
}
```

**Number field:**
```json
"viewCount": {
    "type": "number",
    "description": "Number of views",
    "nullable": true,
    "example": 15000
}
```

**Boolean field:**
```json
"isVerified": {
    "type": "boolean",
    "description": "Whether the account is verified",
    "nullable": true,
    "example": true
}
```

**Array field:**
```json
"hashtags": {
    "type": "array",
    "description": "Hashtags associated with the item",
    "items": { "type": "string" },
    "nullable": true,
    "example": ["#example", "#demo"]
}
```

**Nested object field:**
```json
"authorInfo": {
    "type": "object",
    "description": "Information about the author",
    "properties": {
        "name": { "type": "string", "nullable": true },
        "url": { "type": "string", "nullable": true }
    },
    "required": [],
    "additionalProperties": true,
    "nullable": true,
    "example": { "name": "Example Author", "url": "https://example.com/author" }
}
```

### Views section

- `transformation.fields`: List 8-12 most important field names (order = column order in UI)
- `display.properties`: One entry per overview field with `label` and `format`
- Available formats: `"text"`, `"number"`, `"date"`, `"link"`, `"boolean"`, `"image"`, `"array"`, `"object"`

---

## Phase 3: Generate `key_value_store_schema.json` (if applicable)

> **Skip this phase** if no `Actor.setValue()` / `Actor.set_value()` calls were found beyond the default `INPUT` key.

### File structure

```json
{
    "actorKeyValueStoreSchemaVersion": 1,
    "title": "<Descriptive title>",
    "description": "<One sentence describing the stored data>",
    "collections": {
        "<collectionName>": {
            "title": "<Human-readable title>",
            "description": "<What this collection contains>",
            "keyPrefix": "<prefix->"
        }
    }
}
```

Group discovered `setValue` / `set_value` calls by key pattern:
1. **Fixed keys** (e.g., `"RESULTS"`) — use `"key"` (exact match)
2. **Dynamic keys with a prefix** (e.g., `"screenshot-${id}"`) — use `"keyPrefix"`

---

## Phase 4: Generate `output_schema.json`

For most Actors that push data to a dataset:

```json
{
    "actorOutputSchemaVersion": 1,
    "title": "<Descriptive title>",
    "description": "<One sentence describing the output data>",
    "properties": {
        "dataset": {
            "type": "string",
            "title": "Results",
            "description": "Dataset containing all scraped data",
            "template": "{{links.apiDefaultDatasetUrl}}/items"
        }
    }
}
```

> **Critical**: Each property entry **must** include `"type": "string"`.

If `key_value_store_schema.json` was generated, add a second property for files.

---

## Phase 5: Update `actor.json`

Wire the schema files into the Actor configuration:

```json
"storages": {
    "dataset": "./dataset_schema.json",
    "keyValueStore": "./key_value_store_schema.json"
},
"output": "./output_schema.json"
```

---

## Phase 6: Review and Validate

**Checklist**:
- [ ] Every output field from source code is in `dataset_schema.json`
- [ ] Every field has `"nullable": true`
- [ ] Top-level `fields` object has `"additionalProperties": true` and `"required": []`
- [ ] Every nested object also has `"additionalProperties": true` and `"required": []`
- [ ] Every field has a `"description"` and an `"example"`
- [ ] All example values are anonymized
- [ ] `"type"` is present on every field that has `"nullable"`
- [ ] Views list 8-12 most useful fields with correct display formats
- [ ] `output_schema.json` has `"type": "string"` on every property
- [ ] `actor.json` references all generated schema files
- [ ] Schema field names match actual keys in the code

---

## Phase 7: Summary

Report:
- Files created or updated
- Number of fields in the dataset schema
- Number of collections in the key-value store schema (if generated)
- Fields selected for the overview view
- Any fields that need user clarification
- Suggested next steps (test locally with `apify run`, verify output tab in Console)

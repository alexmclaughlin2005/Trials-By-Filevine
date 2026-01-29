# Development Scripts

This directory contains utility scripts for development, testing, and data management.

## Scripts

### `add-test-document.ts`
**Purpose:** Add a document to the database for local testing without requiring Vercel Blob storage.

**Usage:**
```bash
npx tsx scripts/add-test-document.ts <caseId> <filePath> [argumentId] [notes]
```

**Example:**
```bash
# Add a PDF to a case
npx tsx scripts/add-test-document.ts abc-123-def ./test-document.pdf

# Add a PDF and attach it to an argument
npx tsx scripts/add-test-document.ts abc-123-def ./test-document.pdf xyz-789-ghi "Test document for focus group"
```

**What it does:**
1. Creates a document record in the database
2. Extracts text from PDF/Word documents
3. Stores extracted text in a local temp file
4. Updates document with extraction status and text URL
5. Optionally attaches document to an argument

**Requirements:**
- Case must exist
- File must be accessible (relative or absolute path)
- PDF or Word documents will have text extracted automatically

### `check-document-attachments.ts`
**Purpose:** Check document attachments and list arguments in a case.

**Usage:**
```bash
npx tsx scripts/check-document-attachments.ts
```

**What it does:**
- Finds documents by filename
- Shows document extraction status
- Lists all attachments to arguments
- Lists all arguments in the case

### Other Scripts
- `convert-markdown-to-json.ts` - Convert persona markdown to JSON
- `convert-markdown-to-json-v2.ts` - Convert V2 persona markdown to JSON
- `import-personas.ts` - Import personas into database
- `import-personas-v2.ts` - Import V2 personas into database
- `verify-personas-v2.ts` - Verify V2 persona data integrity
- `test-persona-fields-v2.ts` - Test V2 persona field access
- `test-persona-api-v2.ts` - Test persona API endpoints
- `list-personas.ts` - List all personas in database

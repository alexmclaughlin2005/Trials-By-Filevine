# PDF Generation Library

Professional PDF generation system for Juries by Filevine using React-PDF.

## Overview

This library provides a complete infrastructure for generating branded, professional PDF documents from focus group outputs and other application data.

## Directory Structure

```
lib/pdf/
├── README.md                    # This file
├── index.ts                     # Main entry point
├── types.ts                     # TypeScript type definitions
│
├── styles/
│   └── pdfStyles.ts            # Shared styles and color system
│
├── components/                  # Reusable PDF components
│   ├── PDFHeader.tsx           # Document header with branding
│   ├── PDFFooter.tsx           # Page numbers and timestamps
│   ├── PDFSection.tsx          # Section containers
│   ├── SeverityBadge.tsx       # Severity indicators
│   ├── PriorityBadge.tsx       # Priority indicators
│   └── PersonaBadge.tsx        # Persona/archetype badges
│
├── templates/                   # PDF document templates (to be created)
│   ├── TakeawaysPDFDocument.tsx    # Key takeaways report
│   ├── PersonaSummaryPDF.tsx       # Persona journey report
│   └── TranscriptPDF.tsx           # Full conversation transcript
│
└── utils/                       # Utility functions
    ├── formatters.ts           # Date, text, and data formatters
    └── generatePDF.ts          # Core PDF generation logic
```

## Core Components

### PDFHeader
Reusable header component with Juries by Filevine branding.

```tsx
import { PDFHeader } from '@/lib/pdf';

<PDFHeader
  title="Focus Group Report"
  subtitle="Case Name"
/>
```

### PDFFooter
Page numbers and generation timestamp.

```tsx
import { PDFFooter } from '@/lib/pdf';

<PDFFooter generatedAt={new Date()} />
```

### PDFSection
Styled section container with color variants.

```tsx
import { PDFSection } from '@/lib/pdf';

<PDFSection
  title="What Landed"
  variant="success"
  icon="✓"
>
  {/* Content */}
</PDFSection>
```

### Badge Components
Visual indicators for severity, priority, and personas.

```tsx
import { SeverityBadge, PriorityBadge, PersonaBadge } from '@/lib/pdf';

<SeverityBadge severity="HIGH" />
<PriorityBadge priority="MEDIUM" />
<PersonaBadge name="The Bootstrapper" variant="archetype" />
```

## Styling System

The `pdfStyles.ts` file provides:

- **Colors**: Filevine brand colors matching the web UI
- **Typography**: Consistent font sizes (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- **Spacing**: Standard spacing scale (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)
- **Base Styles**: Pre-defined styles for headers, body text, sections, cards, lists, tables
- **Semantic Styles**: Success, warning, danger, and info sections
- **Badge Styles**: Severity, priority, position, and influence level styles

### Example Usage

```tsx
import { baseStyles, colors, fontSize } from '@/lib/pdf/styles/pdfStyles';

const styles = StyleSheet.create({
  customSection: {
    ...baseStyles.section,
    backgroundColor: colors.blue[50],
    fontSize: fontSize.lg,
  }
});
```

## Utilities

### Formatters

```typescript
import {
  formatDate,
  formatDateTime,
  formatNameList,
  formatConfidence,
  formatPositionShift,
  getSentimentSymbol
} from '@/lib/pdf/utils/formatters';

formatDate(new Date());                    // "January 27, 2026"
formatNameList(['Alice', 'Bob', 'Charlie']); // "Alice, Bob, and Charlie"
formatConfidence(0.87);                    // "87%"
formatPositionShift('neutral', 'favorable'); // "Neutral → Favorable"
getSentimentSymbol('plaintiff_leaning');   // "↑"
```

### PDF Generation

```typescript
import {
  generatePDFBuffer,
  generatePDFFilename,
  getPDFContentDisposition
} from '@/lib/pdf/utils/generatePDF';

// Generate PDF buffer
const buffer = await generatePDFBuffer(document);

// Generate filename
const filename = generatePDFFilename('takeaways', 'Smith-v-Jones');
// => "takeaways-smith-v-jones-2026-01-27.pdf"

// Get content-disposition header
const disposition = getPDFContentDisposition(filename);
```

## Creating a PDF Document

### Basic Structure

```tsx
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
  baseStyles,
  PDFHeader,
  PDFFooter,
  PDFSection
} from '@/lib/pdf';

export const MyPDFDocument = ({ data }) => (
  <Document>
    {/* Cover Page */}
    <Page size="LETTER" style={baseStyles.page}>
      <View style={baseStyles.coverPage}>
        <Text style={baseStyles.coverTitle}>
          Report Title
        </Text>
        <Text style={baseStyles.coverSubtitle}>
          {data.caseName}
        </Text>
        <Text style={baseStyles.coverMeta}>
          Generated: {formatDate(new Date())}
        </Text>
      </View>
    </Page>

    {/* Content Pages */}
    <Page size="LETTER" style={baseStyles.pageWithHeader}>
      <PDFHeader title="My Report" subtitle={data.caseName} />

      <PDFSection title="Section 1" variant="success">
        <Text style={baseStyles.body}>
          Content goes here...
        </Text>
      </PDFSection>

      <PDFFooter generatedAt={new Date()} />
    </Page>
  </Document>
);
```

## API Integration

### Example API Route

```typescript
// app/api/focus-groups/conversations/[conversationId]/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFBuffer, generatePDFFilename } from '@/lib/pdf';
import { TakeawaysPDFDocument } from '@/lib/pdf/templates/TakeawaysPDFDocument';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Fetch data
    const data = await fetchConversationData(params.conversationId);

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(
      <TakeawaysPDFDocument {...data} />
    );

    // Generate filename
    const filename = generatePDFFilename('takeaways', data.caseInfo.name);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

## Next Steps

1. **Create PDF Templates** (Phase 2):
   - `TakeawaysPDFDocument.tsx` - Key takeaways report
   - `PersonaSummaryPDF.tsx` - Individual persona journey
   - `TranscriptPDF.tsx` - Full conversation transcript

2. **Create API Routes** (Phase 2):
   - POST `/api/focus-groups/conversations/[id]/export/takeaways`
   - POST `/api/focus-groups/conversations/[id]/export/personas`
   - POST `/api/focus-groups/conversations/[id]/export/transcript`

3. **Add UI Integration** (Phase 3):
   - Export button in TakeawaysTab
   - Export dropdown in UnifiedConversationView
   - Export buttons in PersonaSummaryCard

## Best Practices

1. **Performance**: PDF generation is CPU-intensive. Consider caching generated PDFs or using background jobs for large reports.

2. **Error Handling**: Always use try-catch blocks and provide meaningful error messages.

3. **Styling**: Reuse base styles from `pdfStyles.ts` for consistency. Only create custom styles when necessary.

4. **Text Formatting**: Use the formatter utilities to ensure consistent date, number, and text formatting.

5. **Page Layout**: Use `baseStyles.pageWithHeader` for pages with headers/footers to ensure proper spacing.

6. **Testing**: Test PDFs with various data scenarios (empty data, long text, many items) to ensure proper rendering.

## Dependencies

- `@react-pdf/renderer`: ^3.4.0

## Resources

- [React-PDF Documentation](https://react-pdf.org/)
- [React-PDF API Reference](https://react-pdf.org/components)
- [Styling Guide](https://react-pdf.org/styling)

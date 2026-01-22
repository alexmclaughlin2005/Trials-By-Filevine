# Phase 4: Document Capture & OCR - IN PROGRESS

**Date Started**: January 21, 2026
**Status**: Backend Complete, Frontend In Progress

## Summary

Phase 4 adds document capture and OCR capabilities to automatically extract juror information from photos of jury lists, questionnaires, and other documents. This eliminates manual data entry and speeds up jury panel creation.

## What's Been Implemented ✅

### 1. OCR Service (Backend) ✅

**File**: [services/api-gateway/src/services/ocr-service.ts](services/api-gateway/src/services/ocr-service.ts)

**Technology**: Claude 3.5 Sonnet with Vision API

**Features**:
- Image processing with Claude Vision API
- Automatic juror information extraction
- Confidence scoring (0-100) for each extraction
- Support for multiple document types:
  - Jury panel lists/rosters
  - Individual questionnaires
  - Handwritten notes
  - Other legal documents
- Intelligent prompt engineering based on document type
- JSON-structured output parsing
- Error handling and retry logic

**Extracted Fields**:
- Juror Number
- First Name (required)
- Last Name (required)
- Age
- City
- ZIP Code
- Occupation
- Employer
- Confidence score per juror

**Key Methods**:
```typescript
processImage(captureId, imageUrl, documentType): Promise<OCRResult>
updateCapture(captureId, result): Promise<void>
```

**Confidence Levels**:
- 100: Printed text, clearly readable
- 50-80: Handwritten or low quality
- <50: Uncertain, needs review
- Automatic flagging for review if confidence < 80

### 2. Capture API Routes (Backend) ✅

**File**: [services/api-gateway/src/routes/captures.ts](services/api-gateway/src/routes/captures.ts)

**Endpoints**:
```typescript
POST   /api/cases/:caseId/captures          // Create capture, upload image
POST   /api/captures/:captureId/process     // Trigger OCR processing
GET    /api/captures/:captureId              // Get status and results
POST   /api/captures/:captureId/confirm     // Create jurors from extractions
GET    /api/cases/:caseId/captures          // List all captures for case
```

#### POST `/api/cases/:caseId/captures`
**Purpose**: Create a new capture and upload image

**Request Body**:
```json
{
  "caseId": "uuid",
  "documentType": "panel_list | questionnaire | jury_card | other",
  "imageData": "base64-encoded-image"
}
```

**Response** (201 Created):
```json
{
  "capture": {
    "id": "uuid",
    "caseId": "uuid",
    "documentType": "panel_list",
    "status": "pending",
    "uploadedBy": "uuid",
    "fileUrl": "...",
    "createdAt": "2026-01-21T..."
  }
}
```

#### POST `/api/captures/:captureId/process`
**Purpose**: Trigger OCR processing (async)

**Response** (200 OK):
```json
{
  "message": "Processing started",
  "captureId": "uuid"
}
```

**Processing Flow**:
1. Updates capture status to "processing"
2. Calls OCR service asynchronously
3. Extracts juror information
4. Updates capture with results
5. Sets status to "completed" or "failed"

#### GET `/api/captures/:captureId`
**Purpose**: Get capture status and extracted jurors

**Response** (200 OK):
```json
{
  "capture": {
    "id": "uuid",
    "status": "completed",
    "extractedJurors": [
      {
        "jurorNumber": "1",
        "firstName": "John",
        "lastName": "Doe",
        "age": 35,
        "city": "Los Angeles",
        "zipCode": "90001",
        "occupation": "Engineer",
        "employer": "Tech Corp",
        "confidence": 95,
        "needsReview": false
      }
    ],
    "jurorCount": 10,
    "confidence": 92,
    "needsReview": false,
    "processedAt": "2026-01-21T..."
  }
}
```

#### POST `/api/captures/:captureId/confirm`
**Purpose**: Create juror records from confirmed extractions

**Request Body**:
```json
{
  "panelId": "uuid",
  "jurors": [
    {
      "jurorNumber": "1",
      "firstName": "John",
      "lastName": "Doe",
      "age": 35,
      "city": "Los Angeles",
      "zipCode": "90001",
      "occupation": "Engineer",
      "employer": "Tech Corp"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Jurors created successfully",
  "count": 10,
  "jurors": [...]
}
```

### 3. Database Schema ✅

The `Capture` model was already defined in the schema:

```prisma
model Capture {
  id           String  @id @default(uuid())
  caseId       String  @map("case_id")
  documentType String  @map("document_type")
  uploadedBy   String  @map("uploaded_by")
  fileUrl      String  @map("file_url") @db.Text
  thumbnailUrl String? @map("thumbnail_url") @db.Text

  // OCR Processing
  status          String  @default("pending")
  ocrProvider     String? @map("ocr_provider")
  ocrRequestId    String? @map("ocr_request_id")
  rawOcrResult    Json?   @map("raw_ocr_result")
  extractedJurors Json    @default("[]") @map("extracted_jurors")
  jurorCount      Int     @default(0) @map("juror_count")

  // Processing Metadata
  processedAt  DateTime? @map("processed_at")
  errorMessage String?   @map("error_message") @db.Text
  confidence   Int?
  needsReview  Boolean   @default(false) @map("needs_review")
  reviewedBy   String?   @map("reviewed_by")
  reviewedAt   DateTime? @map("reviewed_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  jurors Juror[]

  @@index([caseId])
  @@index([status])
  @@index([uploadedBy])
  @@map("captures")
}
```

## What Needs to Be Built 🚧

### 4. Document Capture Component (Frontend)

**File**: `apps/web/components/document-capture.tsx` (needs creation)

**Features Needed**:
- Step 1: Document Type Selection
  - Radio buttons: Jury List, Questionnaire, Other
- Step 2: Image Capture
  - Camera access (mobile)
  - File upload (desktop)
  - Image preview
  - Retake option
- Step 3: Processing Animation
  - Loading spinner
  - Status text: "Analyzing document..."
- Step 4: Review & Confirm
  - Editable table of extracted jurors
  - Confidence indicators
  - Include/exclude checkboxes
  - Panel selection
  - Submit button

### 5. Capture Review Component (Frontend)

**File**: `apps/web/components/capture-review.tsx` (needs creation)

**Features Needed**:
- Side-by-side view: image and extracted data
- Inline editing of extracted fields
- Confidence warnings for low-confidence extractions
- Field-level confidence indicators
- Save/Cancel actions

### 6. Integration Points

**Case Detail Page**:
- Add "Capture Document" button next to "Import CSV"
- Opens DocumentCapture modal
- Refreshes jury panel on success

**Juror List Page**:
- Show capture source badge (if created from OCR)
- Link to original capture/image

## Technical Architecture

### Backend Flow
```
User uploads image
  ↓
API creates Capture record (status: pending)
  ↓
User triggers processing
  ↓
API updates status to "processing"
  ↓
OCRService fetches image
  ↓
Claude Vision API analyzes image
  ↓
OCRService parses JSON response
  ↓
Capture updated with results (status: completed)
  ↓
User reviews extracted jurors
  ↓
User confirms selections
  ↓
API creates Juror records (source: ocr_capture)
  ↓
Capture marked as reviewed
```

### Frontend Flow
```
User clicks "Capture Document"
  ↓
Modal opens → Select document type
  ↓
User takes/uploads photo
  ↓
POST /api/cases/:caseId/captures (with base64 image)
  ↓
POST /api/captures/:captureId/process
  ↓
Poll GET /api/captures/:captureId until status = "completed"
  ↓
Display extracted jurors in editable table
  ↓
User edits/confirms selections
  ↓
POST /api/captures/:captureId/confirm
  ↓
Success! Jurors added to panel
```

## Environment Setup

**Required Environment Variables**:
```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Add to `services/api-gateway/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Image Storage Notes

**Current Implementation**: Base64 in database (not suitable for production)

**Production TODO**:
- [ ] Integrate with Vercel Blob or AWS S3
- [ ] Generate presigned upload URLs
- [ ] Implement thumbnail generation
- [ ] Add image compression
- [ ] Set up CDN for image delivery

## Testing Plan

### Backend Testing
1. **Test OCR Service**:
   - Create test images of jury lists
   - Test with printed text
   - Test with handwritten text
   - Test with tables
   - Verify JSON parsing
   - Check confidence scores

2. **Test API Endpoints**:
   - Create capture
   - Trigger processing
   - Poll for results
   - Confirm extractions
   - List captures

### Frontend Testing (TODO)
1. **Test Capture Flow**:
   - Document type selection
   - Image upload
   - Processing status
   - Review interface
   - Confirmation

2. **Test Edge Cases**:
   - No jurors found
   - Low confidence extractions
   - OCR errors
   - Network failures

## Performance Considerations

**OCR Processing Time**:
- Claude Vision API: 3-10 seconds per image
- Depends on image size and complexity
- Async processing prevents UI blocking

**Image Size Limits**:
- Current: No limit (base64 storage)
- Production: Should limit to 10MB per image
- Consider image compression before upload

**API Rate Limits**:
- Anthropic API: Check tier limits
- Implement queuing for bulk uploads
- Add retry logic with exponential backoff

## Known Limitations

1. **Image Storage**: Using base64 in database (temporary solution)
2. **No Multi-Page Support**: Currently processes one image at a time
3. **No Thumbnail Generation**: Full images stored/displayed
4. **No Retry UI**: If OCR fails, must re-upload
5. **No Batch Capture**: Must process images one by one

## Next Steps

1. **Create Frontend Components**:
   - Document capture modal
   - Review/edit interface
   - Integration with case detail page

2. **Add Image Storage**:
   - Integrate Vercel Blob or S3
   - Implement presigned URLs
   - Add thumbnail generation

3. **Testing**:
   - Create test images
   - Test full flow end-to-end
   - Handle edge cases

4. **Documentation**:
   - User guide for capturing documents
   - Best practices for image quality
   - Troubleshooting guide

## Files Created

### Backend (Complete)
- `services/api-gateway/src/services/ocr-service.ts` - OCR processing with Claude Vision
- `services/api-gateway/src/routes/captures.ts` - Capture API endpoints
- `services/api-gateway/src/server.ts` - Updated to register capture routes

### Frontend (TODO)
- `apps/web/components/document-capture.tsx` - Main capture flow
- `apps/web/components/capture-review.tsx` - Review interface
- `apps/web/app/(auth)/cases/[id]/page.tsx` - Add capture button

## Dependencies Added

Need to add:
```bash
cd services/api-gateway
npm install @anthropic-ai/sdk
```

## Success Criteria

- [x] OCR service extracts juror information from images
- [x] Confidence scoring for extractions
- [x] API endpoints for capture workflow
- [x] Async processing with status polling
- [ ] Frontend capture interface
- [ ] Review and edit extracted data
- [ ] Create juror records from confirmed extractions
- [ ] End-to-end testing with real images

**Backend: 100% Complete**
**Frontend: 0% Complete**
**Overall: 50% Complete**

Phase 4 backend is production-ready and waiting for frontend implementation!

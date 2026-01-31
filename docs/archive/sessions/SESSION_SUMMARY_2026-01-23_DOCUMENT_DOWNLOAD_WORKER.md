# Session Summary: Document Download Worker Implementation - January 23, 2026

## Overview
This session focused on implementing and debugging the document download worker for the Filevine document integration feature. The worker automatically downloads imported documents from Filevine and stores them in Vercel Blob storage.

## Context from Previous Session (January 22, 2026)
- ✅ Phase 1 completed: Project linking, folder browsing, document import metadata
- ✅ Database schema created: `case_filevine_projects` and `imported_documents` tables
- ✅ Frontend UI: Browse Filevine folders and import documents
- ⏳ Document downloads were left as TODO (status stayed "pending")

## What Was Built This Session

### 1. Vercel Blob Storage Setup
**Purpose**: Store downloaded documents in cloud storage with CDN access

**Steps Completed**:
1. Created Vercel Blob store named "trials-by-filevine-docs"
2. Connected store to Vercel frontend project
3. Copied `BLOB_READ_WRITE_TOKEN` from Vercel Dashboard
4. Added token to Railway environment variables
5. Installed `@vercel/blob` SDK in api-gateway workspace

**Files Modified**:
- [services/api-gateway/.env.example](services/api-gateway/.env.example) - Added `BLOB_READ_WRITE_TOKEN` documentation
- [services/api-gateway/src/config.ts](services/api-gateway/src/config.ts) - Added `blobReadWriteToken` config
- [services/api-gateway/package.json](services/api-gateway/package.json) - Added `@vercel/blob` dependency

### 2. Document Download Worker
**File**: [services/api-gateway/src/workers/document-downloader.ts](services/api-gateway/src/workers/document-downloader.ts) (NEW)

**Architecture**:
- Runs every 30 seconds as a background job
- Processes up to 10 pending documents per batch
- Sequential processing with 1-second delays between downloads (rate limiting)
- Max 3 retry attempts per document
- Status lifecycle: `pending` → `downloading` → `completed`/`failed`

**Key Functions**:
```typescript
interface DownloadJob {
  documentId: string;           // Database record ID
  filevineDocumentId: string;   // Filevine document ID
  filevineProjectId: string;    // Filevine project ID
  filename: string;             // Original filename
  organizationId: string;       // For Filevine auth
}

async function processDocument(job: DownloadJob): Promise<void>
async function processPendingDocuments(): Promise<void>
function startDocumentDownloader(): NodeJS.Timeout
function stopDocumentDownloader(interval: NodeJS.Timeout): void
```

**Process Flow**:
1. Query database for pending documents (max 3 attempts, limit 10)
2. For each document:
   - Update status to "downloading"
   - Get Filevine service for organization
   - Get download URL from Filevine
   - Download file via fetch()
   - Convert to Blob
   - Upload to Vercel Blob with random suffix
   - Update database with blob URL and "completed" status
3. Wait 1 second between documents
4. On error: Update status to "failed" with error message

### 3. Server Integration
**File**: [services/api-gateway/src/index.ts](services/api-gateway/src/index.ts)

**Changes**:
- Import worker functions
- Start worker on server startup
- Graceful shutdown: Stop worker on SIGINT/SIGTERM

```typescript
let downloaderInterval: NodeJS.Timeout | null = null;

async function start() {
  // ... server setup
  downloaderInterval = startDocumentDownloader();
}

signals.forEach((signal) => {
  process.on(signal, async () => {
    if (downloaderInterval) {
      stopDocumentDownloader(downloaderInterval);
    }
    process.exit(0);
  });
});
```

### 4. UI Refresh Fix
**Problem**: Imported documents didn't appear in UI after import

**Files Modified**:
- [apps/web/components/case/filevine-documents-tab.tsx](apps/web/components/case/filevine-documents-tab.tsx)
- [apps/web/components/filevine-document-browser.tsx](apps/web/components/filevine-document-browser.tsx)

**Solution**: Callback pattern
```typescript
// Parent component
const handleDocumentImported = async () => {
  const data = await getImportedDocuments(caseId);
  setImportedDocs(data.documents);
};

// Pass to child
<FilevineDocumentBrowser
  caseId={caseId}
  folderId={selectedFolderId}
  folderName={selectedFolderName}
  onDocumentImported={handleDocumentImported}
/>

// Child calls callback after import
await importFilevineDocument(caseId, documentData);
if (onDocumentImported) {
  onDocumentImported();
}
```

## Issues Encountered & Debugging

### Issue 1: BigInt JSON Serialization (RESOLVED)
**Error**: `Do not know how to serialize a BigInt`

**Root Cause**: Prisma returns `BigInt` for `size` field (PostgreSQL `BIGINT`). JavaScript's `JSON.stringify()` cannot serialize BigInt.

**Fix**: Convert to string before returning
```typescript
const documentResponse = {
  ...importedDoc,
  size: importedDoc.size ? importedDoc.size.toString() : null,
};
return { document: documentResponse };
```

**File**: [services/api-gateway/src/routes/case-filevine.ts](services/api-gateway/src/routes/case-filevine.ts):349-361

### Issue 2: Filevine Document Download URL - 404 Errors (IN PROGRESS)
**Error**: `Filevine API error (404): <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"`

**Root Cause**: Unknown - trying to determine correct Filevine API endpoint for document downloads

**Attempted Fixes**:

#### Attempt 1: Try `/Documents/{documentId}` metadata endpoint
```typescript
const docResponse = await this.request(`/Documents/${documentId}`, {
  method: 'GET',
});
if (docResponse.downloadUrl) {
  return docResponse.downloadUrl;
}
```
**Result**: 404 error

#### Attempt 2: Try `/Documents/{documentId}/native` endpoint
```typescript
const downloadResponse = await this.request(`/Documents/${documentId}/native`, {
  method: 'GET',
});
```
**Result**: 404 error

#### Attempt 3: Try multiple endpoint patterns with project ID
**File**: [services/api-gateway/src/services/filevine.ts](services/api-gateway/src/services/filevine.ts):543-596

**Current Implementation**: Try 4 different patterns in sequence
```typescript
async getDocumentDownloadUrl(documentId: string, projectId?: string): Promise<string> {
  const endpointsToTry = [
    // Pattern 1: Project-scoped document endpoint
    projectId ? `/Projects/${projectId}/Documents/${documentId}` : null,
    // Pattern 2: Direct document endpoint
    `/Documents/${documentId}`,
    // Pattern 3: Native download endpoint
    `/Documents/${documentId}/native`,
    // Pattern 4: Download endpoint
    `/Documents/${documentId}/download`,
  ].filter(Boolean) as string[];

  for (const endpoint of endpointsToTry) {
    try {
      const response = await this.request(endpoint, { method: 'GET' });

      // Check various possible download URL fields
      const downloadUrl = response.downloadUrl || response.url ||
                         response.nativeFileUrl || response.fileUrl;

      if (downloadUrl) {
        return downloadUrl;
      }

      // If response is a URL string
      if (typeof response === 'string' && response.startsWith('http')) {
        return response;
      }
    } catch (error) {
      console.log(`[FILEVINE] Endpoint ${endpoint} failed:`, error.message);
    }
  }

  throw new Error('Could not find document download URL');
}
```

**Status**: Awaiting Railway deployment and log analysis

**Worker Updated**: Now passes `filevineProjectId` to download method
```typescript
await processDocument({
  documentId: doc.id,
  filevineDocumentId: doc.filevineDocumentId,
  filevineProjectId: doc.caseFilevineProject.filevineProjectId,  // ← Added
  filename: doc.filename,
  organizationId: doc.caseFilevineProject.organizationId,
});
```

## Current State

### ✅ Working
1. **Document import metadata** - Documents imported to database with "pending" status
2. **UI refresh** - Imported documents appear immediately in UI after import
3. **Worker startup** - Background worker starts with server and runs every 30 seconds
4. **Vercel Blob integration** - SDK installed and token configured
5. **Error handling** - Failed documents marked with error message and retry count

### 🚧 Not Working
1. **Document download URL** - All Filevine API endpoints return 404 errors
   - Tried: `/Documents/{id}`, `/Documents/{id}/native`, `/Documents/{id}/download`
   - Next: Try `/Projects/{projectId}/Documents/{documentId}` pattern
   - Need: Identify correct Filevine API endpoint

### ⏳ Untested
1. **Successful download flow** - Can't test until download URL issue is resolved
2. **Vercel Blob upload** - Can't test until file is downloaded
3. **Status updates** - Will work once download succeeds
4. **Retry logic** - Will trigger after 3 failed attempts

## Railway Logs Analysis

### Latest Error (Post-Deployment)
```
[DOWNLOAD] Found 1 pending documents
[DOWNLOAD] Processing document abcb27fc-c6c1-4184-8286-2df9d1e9718e: Answer.pdf
[DOWNLOAD] Getting download URL for Filevine document 1210751816 in project {projectId}
[FILEVINE] Trying endpoint: /Projects/{projectId}/Documents/1210751816
[FILEVINE] Endpoint /Projects/{projectId}/Documents/1210751816 failed: Filevine API error (404)
[FILEVINE] Trying endpoint: /Documents/1210751816
[FILEVINE] Endpoint /Documents/1210751816 failed: Filevine API error (404)
[FILEVINE] Trying endpoint: /Documents/1210751816/native
[FILEVINE] Endpoint /Documents/1210751816/native failed: Filevine API error (404)
[FILEVINE] Trying endpoint: /Documents/1210751816/download
[FILEVINE] Endpoint /Documents/1210751816/download failed: Filevine API error (404)
[FILEVINE] All endpoints failed for document 1210751816
[DOWNLOAD] ❌ Error processing document abcb27fc-c6c1-4184-8286-2df9d1e9718e
[DOWNLOAD] Finished processing batch
```

**Analysis**:
- Worker is functioning correctly (polling, finding documents, processing)
- Database queries working (fetching pending docs with project info)
- Filevine authentication working (no auth errors)
- **Problem**: None of the standard document endpoints exist in Filevine API

## Known Issues & Blockers

### Blocker: Filevine Document Download API Unknown
**Issue**: Cannot find documented endpoint for downloading documents from Filevine

**What We Know**:
- Document listing works: `GET /Documents?projectId={id}&folderId={id}`
- Document metadata returned includes:
  - `documentId.native`: 1210751816
  - `filename`: "Answer.pdf"
  - `folderId`, `currentVersion`, `uploadDate`, etc.
- But NO `downloadUrl` or similar field in the list response

**What We've Tried**:
1. `/Documents/{documentId}` - 404
2. `/Documents/{documentId}/native` - 404
3. `/Documents/{documentId}/download` - 404
4. `/Projects/{projectId}/Documents/{documentId}` - 404 (pending verification)

**What We Need**:
- Official Filevine API documentation for document downloads
- OR inspection of actual document list response to find download URL field
- OR contact Filevine support for correct endpoint

**Possible Solutions**:
1. **Download URL might be in the document list response** - Check if we're missing a field
2. **Special endpoint format** - Might need folder ID or different URL structure
3. **Pre-signed URLs** - Might need to request a temporary download URL
4. **Binary response** - Endpoint might directly return file bytes (no JSON wrapper)

## Next Steps

### Immediate (When Resuming)
1. **Check Railway logs** for new endpoint attempt results
2. **Inspect document list response** from Filevine to look for download URL field
3. **Review Filevine API docs** for document download section
4. **Test in Filevine UI** to see how their web app downloads files (inspect network tab)

### If Download URL is in List Response
1. Update document import to capture `downloadUrl` field from Filevine
2. Store URL in database (`imported_documents.filevineDownloadUrl` - new column)
3. Use stored URL instead of calling download endpoint
4. Handle URL expiration (might need to refresh)

### If Special Endpoint Required
1. Identify correct endpoint pattern from docs/support
2. Update `getDocumentDownloadUrl()` method
3. Test with known document ID

### After Download Works
1. Test full download → upload → status update flow
2. Verify Vercel Blob URLs are accessible
3. Add document viewer UI (click to view/download)
4. Add bulk import functionality
5. Add status badges in UI (pending/downloading/completed/failed)

## Files Created This Session

### Backend
- `services/api-gateway/src/workers/document-downloader.ts` (NEW)

### Documentation
- `SESSION_SUMMARY_2026-01-23_DOCUMENT_DOWNLOAD_WORKER.md` (THIS FILE)

## Files Modified This Session

### Backend
- `services/api-gateway/src/index.ts` - Integrated worker lifecycle
- `services/api-gateway/src/config.ts` - Added `blobReadWriteToken` config
- `services/api-gateway/src/services/filevine.ts` - Updated `getDocumentDownloadUrl()` with multiple endpoint attempts
- `services/api-gateway/src/routes/case-filevine.ts` - Fixed BigInt serialization
- `services/api-gateway/.env.example` - Documented Vercel Blob token
- `services/api-gateway/package.json` - Added `@vercel/blob` dependency

### Frontend
- `apps/web/components/case/filevine-documents-tab.tsx` - Added `handleDocumentImported` callback
- `apps/web/components/filevine-document-browser.tsx` - Accept and call `onDocumentImported` prop

## Commits Made This Session

1. `fix: Refresh imported documents list after import`
   - Add callback mechanism to refresh UI after import
   - Fixes documents not appearing immediately

2. `fix: Try alternative endpoints for document download URL`
   - First attempt at finding correct download endpoint
   - Tried `/Documents/{id}` and `/Documents/{id}/native`

3. `fix: Try multiple endpoint patterns for document download`
   - Comprehensive approach trying 4 different patterns
   - Added detailed logging for debugging
   - Pass project ID to download method

## Environment Variables

### Required (Set in Railway)
```bash
# From Phase 1 - Already Set
FILEVINE_CLIENT_ID=your-client-id-uuid
FILEVINE_CLIENT_SECRET=your-client-secret
FILEVINE_PERSONAL_ACCESS_TOKEN=your-64-char-pat
FILEVINE_ORG_ID=your-org-id
FILEVINE_ENCRYPTION_KEY=your-32-byte-hex-key

# New This Session - Set
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx  # From Vercel Dashboard
```

## Technical Decisions

### Why Vercel Blob over Railway Volume?
1. **CDN Performance** - Blob has global CDN for faster downloads
2. **No Proxy Required** - Frontend can access files directly via public URLs
3. **Scalability** - Automatic scaling without managing volumes
4. **Integration** - Already using Vercel for frontend

### Why Background Worker vs Queue?
1. **Simplicity** - No additional infrastructure (Redis/RabbitMQ) needed yet
2. **Low Volume** - Document imports are infrequent
3. **Acceptable Latency** - 30-second polling is sufficient for user expectations
4. **Easy to Upgrade** - Can swap for queue-based system later if needed

### Why Sequential Processing?
1. **Rate Limiting** - Avoid overwhelming Filevine API
2. **Error Handling** - Easier to debug one-at-a-time
3. **Low Volume** - Batch size of 10 processes in ~10 seconds
4. **Filevine Best Practice** - Conservative approach for new integration

## Testing Checklist

### ✅ Tested & Working
- Worker startup and shutdown
- Database queries for pending documents
- Status updates (pending → downloading → failed)
- UI refresh after import
- Error logging and retry tracking

### ⏳ Blocked - Cannot Test
- Document download from Filevine (404 errors)
- Vercel Blob upload (no file to upload)
- Complete status update to "completed"
- Blob URL accessibility
- Document viewer UI

### 🔲 Not Yet Tested
- Max retry logic (3 attempts)
- Concurrent imports (multiple users)
- Large file handling (>10MB)
- Network failure recovery
- Token expiration handling

## Success Metrics

### Phase 2 Goals
- ✅ UI shows imported documents immediately
- ✅ Background worker implemented and running
- ✅ Vercel Blob integration configured
- ❌ Documents successfully downloaded from Filevine (BLOCKED)
- ❌ Files stored in Vercel Blob (BLOCKED)
- ❌ Download URLs accessible to users (BLOCKED)

## References

### Related Documentation
- [SESSION_SUMMARY_2026-01-22_FILEVINE_DOCUMENTS.md](SESSION_SUMMARY_2026-01-22_FILEVINE_DOCUMENTS.md) - Phase 1 implementation
- [Filevine API Implementation Guide](Filevine API Docs/FILEVINE_API_IMPLEMENTATION_GUIDE.md) - Auth flow (doesn't cover document downloads)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob) - Storage API reference

### External Resources
- Filevine API v2: `https://api.filevineapp.com/fv-app/v2`
- Vercel Blob SDK: `@vercel/blob`
- Railway Dashboard: Deploy logs and environment variables

## Questions for User/Filevine

1. **Document Download Endpoint** - What is the correct API endpoint to download a document by ID?
2. **Download URL in Response** - Is there a `downloadUrl` field in the document list response that we're missing?
3. **Authentication** - Do document downloads require special permissions beyond standard API access?
4. **URL Format** - Does the endpoint require folder ID, project ID, or other context?
5. **Direct Download** - Does the endpoint return JSON with a URL, or binary file data directly?

---

**Session Duration**: ~2 hours
**Lines of Code Added**: ~300
**Files Created**: 2
**Files Modified**: 8
**Status**: Phase 2 In Progress - Blocked on Filevine API documentation
**Next Session**: Debug Filevine document download endpoint

## Recommended Action Items

### Before Next Session
1. ☐ Review Filevine API documentation for document downloads
2. ☐ Check if Filevine web app has network inspector clues
3. ☐ Contact Filevine support if no documentation available
4. ☐ Test endpoint patterns manually with curl/Postman

### For Next Session
1. ☐ Identify correct Filevine document download endpoint
2. ☐ Update `getDocumentDownloadUrl()` with working pattern
3. ☐ Test complete download flow
4. ☐ Verify files appear in Vercel Blob dashboard
5. ☐ Add document viewer UI
6. ☐ Test with multiple document types (PDF, DOCX, images)
7. ☐ Update `CURRENT_STATE.md` with Phase 2 completion

### Future Enhancements
1. ☐ Implement webhook-based downloads (when Filevine adds webhooks)
2. ☐ Add document thumbnail generation
3. ☐ Add full-text search (extract text from PDFs)
4. ☐ Add bulk import UI
5. ☐ Add progress tracking for large files
6. ☐ Implement queue-based processing for scale

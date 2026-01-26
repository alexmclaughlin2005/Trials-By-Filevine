'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '@/lib/filevine-client';

interface ManualDocumentUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: 'evidence', label: 'Evidence' },
  { value: 'pleading', label: 'Pleading' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'expert', label: 'Expert Report' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' },
];

export function ManualDocumentUpload({ caseId, onUploadComplete }: ManualDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const metadata = {
        documentCategory: category || undefined,
        notes: notes || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      };

      await uploadDocument(caseId, selectedFile, metadata);

      setUploadSuccess(true);
      setSelectedFile(null);
      setCategory('');
      setNotes('');
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">Document File</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="flex-1"
          />
          {selectedFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum file size: 10MB. Supported formats: PDF, DOC, DOCX, TXT, and more.
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <FileText className="h-5 w-5 text-blue-600" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category (Optional)</Label>
        <Select value={category} onValueChange={setCategory} disabled={uploading}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="discovery, motion, evidence (comma-separated)"
          disabled={uploading}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this document..."
          rows={3}
          disabled={uploading}
        />
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">Document uploaded successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}
    </div>
  );
}

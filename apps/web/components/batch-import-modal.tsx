'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { apiClient } from '@/lib/api-client';

interface BatchImportModalProps {
  panelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BatchImportModal({ panelId, isOpen, onClose, onSuccess }: BatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [autoSearch, setAutoSearch] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{
    status: string;
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Read file content
      const csvContent = await file.text();

      // Send to API using authenticated client
      const result = await apiClient.post(`/jurors/panel/${panelId}/batch`, {
        csvContent,
        fileName: file.name,
        autoSearch,
      });

      setProgress({
        status: 'completed',
        totalRows: result.totalRows,
        processedRows: result.totalRows,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
      });

      // Show success for 2 seconds then close
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setAutoSearch(true);
    setIsUploading(false);
    setProgress(null);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    // Create CSV template content
    const templateContent = `Juror Number,First Name,Last Name,Age,City,ZIP,Occupation,Employer
1,John,Doe,35,Los Angeles,90001,Engineer,Tech Corp
2,Jane,Smith,42,Pasadena,91101,Teacher,School District`;

    // Create blob and download
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'juror-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Jurors from CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!progress && (
          <>
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a CSV file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">CSV files only</p>
                </>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSearch"
                  checked={autoSearch}
                  onChange={(e) => setAutoSearch(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSearch" className="ml-2 block text-sm text-gray-900">
                  Automatically search public records for each juror
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-900">CSV Format Requirements:</h3>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                  >
                    Download Template
                  </button>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Required columns: First Name, Last Name</li>
                  <li>• Optional columns: Juror Number, Age, City, ZIP, Occupation, Employer</li>
                  <li>• First row must contain column headers</li>
                  <li>• Example: <code className="bg-white px-1 rounded">First Name,Last Name,Age,City</code></li>
                </ul>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? 'Importing...' : 'Import Jurors'}
              </Button>
            </div>
          </>
        )}

        {/* Progress View */}
        {progress && (
          <div className="space-y-6">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Import Complete!</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Rows:</span>
                <span className="font-medium">{progress.totalRows}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Successful:</span>
                <span className="font-medium text-green-600">{progress.successfulRows}</span>
              </div>
              {progress.failedRows > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{progress.failedRows}</span>
                </div>
              )}
            </div>

            {autoSearch && progress.successfulRows > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  🔍 Searches are running in the background. Results will appear as they complete.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

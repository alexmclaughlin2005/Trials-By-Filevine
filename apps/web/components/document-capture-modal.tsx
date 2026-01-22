'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { apiClient } from '@/lib/api-client';

interface DocumentCaptureModalProps {
  caseId: string;
  panelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DocumentType = 'panel_list' | 'questionnaire' | 'jury_card' | 'other';
type Step = 'select-type' | 'upload-image' | 'processing' | 'review';

interface ExtractedJuror {
  jurorNumber?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  city?: string;
  zipCode?: string;
  occupation?: string;
  employer?: string;
  confidence: number;
  needsReview: boolean;
  include: boolean; // For user selection
}

export function DocumentCaptureModal({
  caseId,
  panelId,
  isOpen,
  onClose,
  onSuccess,
}: DocumentCaptureModalProps) {
  const [step, setStep] = useState<Step>('select-type');
  const [documentType, setDocumentType] = useState<DocumentType>('panel_list');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [extractedJurors, setExtractedJurors] = useState<ExtractedJuror[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('Uploading image...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('select-type');
    setDocumentType('panel_list');
    setImageFile(null);
    setImagePreview(null);
    setCaptureId(null);
    setExtractedJurors([]);
    setError(null);
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNextFromType = () => {
    setStep('upload-image');
  };

  const handleProcessImage = async () => {
    if (!imageFile) return;

    setStep('processing');
    setError(null);
    setProcessingStatus('Uploading image...');

    try {
      // Convert image to base64
      const base64 = await fileToBase64(imageFile);
      const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

      // Create capture
      setProcessingStatus('Creating capture...');
      const createResponse = await apiClient.post<{ capture: { id: string } }>(`/cases/${caseId}/captures`, {
        caseId,
        documentType,
        imageData: base64Data,
      });

      const newCaptureId = createResponse.capture.id;
      setCaptureId(newCaptureId);

      // Trigger OCR processing
      setProcessingStatus('Analyzing document with AI...');
      await apiClient.post(`/captures/${newCaptureId}/process`, {});

      // Poll for results
      setProcessingStatus('Extracting juror information...');
      const results = await pollCaptureResults(newCaptureId);

      if (results.extractedJurors.length === 0) {
        setError('No jurors found in the image. Please try a different image or enter jurors manually.');
        setStep('upload-image');
        return;
      }

      // Set extracted jurors with include flag
      setExtractedJurors(
        results.extractedJurors.map((j: ExtractedJuror) => ({
          ...j,
          include: true, // Default to including all jurors
        }))
      );

      setStep('review');
    } catch (err) {
      console.error('Capture processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setStep('upload-image');
    }
  };

  const pollCaptureResults = async (captureId: string, maxAttempts = 30): Promise<{ extractedJurors: ExtractedJuror[] }> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const response = await apiClient.get<{ capture: { status: string; errorMessage?: string; extractedJurors: ExtractedJuror[] } }>(`/captures/${captureId}`);
      const capture = response.capture;

      if (capture.status === 'completed') {
        return capture;
      } else if (capture.status === 'failed') {
        throw new Error(capture.errorMessage || 'OCR processing failed');
      }

      // Update status message
      setProcessingStatus(`Analyzing document... (${i + 1}/${maxAttempts})`);
    }

    throw new Error('Processing timeout - please try again');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleJurorChange = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...extractedJurors];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedJurors(updated);
  };

  const handleToggleInclude = (index: number) => {
    const updated = [...extractedJurors];
    updated[index].include = !updated[index].include;
    setExtractedJurors(updated);
  };

  const handleConfirm = async () => {
    const jurorsToCreate = extractedJurors
      .filter((j) => j.include && j.firstName && j.lastName)
      .map((j) => ({
        jurorNumber: j.jurorNumber,
        firstName: j.firstName!,
        lastName: j.lastName!,
        age: j.age,
        city: j.city,
        zipCode: j.zipCode,
        occupation: j.occupation,
        employer: j.employer,
      }));

    if (jurorsToCreate.length === 0) {
      setError('Please include at least one juror with first and last name');
      return;
    }

    try {
      await apiClient.post(`/captures/${captureId}/confirm`, {
        panelId,
        jurors: jurorsToCreate,
      });

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create jurors');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Capture Document</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Document Type */}
          {step === 'select-type' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">What type of document are you capturing?</h3>
                <div className="space-y-3">
                  {[
                    { value: 'panel_list', label: 'Jury Panel List/Roster', description: 'A list of multiple jurors with their information' },
                    { value: 'questionnaire', label: 'Single Questionnaire', description: 'One juror&apos;s questionnaire form' },
                    { value: 'jury_card', label: 'Jury Card', description: 'Individual juror identification card' },
                    { value: 'other', label: 'Other Document', description: 'Any other document with juror information' },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        documentType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="documentType"
                        value={type.value}
                        checked={documentType === type.value}
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextFromType}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload Image */}
          {step === 'upload-image' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload or take a photo of the document</h3>

                {!imagePreview ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
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
                      Click to take a photo or upload an image
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, or HEIC up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Document preview"
                        className="w-full rounded-lg border"
                        width={800}
                        height={600}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Retake
                      </Button>
                      <Button onClick={handleProcessImage} className="flex-1">
                        Process Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure good lighting and avoid shadows</li>
                  <li>• Capture the entire document in frame</li>
                  <li>• Keep the camera steady and parallel to the document</li>
                  <li>• Higher resolution images work better</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-6 text-lg font-medium">{processingStatus}</p>
              <p className="mt-2 text-sm text-gray-600">This may take a few moments...</p>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Review Extracted Information ({extractedJurors.filter((j) => j.include).length} of {extractedJurors.length} selected)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and edit the extracted juror information. Uncheck any entries you don&apos;t want to import.
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {extractedJurors.map((juror, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        juror.include ? 'border-gray-300' : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={juror.include}
                          onChange={() => handleToggleInclude(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Juror Number
                            </label>
                            <input
                              type="text"
                              value={juror.jurorNumber || ''}
                              onChange={(e) => handleJurorChange(index, 'jurorNumber', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              First Name *
                              {juror.needsReview && (
                                <span className="ml-1 text-yellow-600">⚠️</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={juror.firstName || ''}
                              onChange={(e) => handleJurorChange(index, 'firstName', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              value={juror.lastName || ''}
                              onChange={(e) => handleJurorChange(index, 'lastName', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              value={juror.age || ''}
                              onChange={(e) => handleJurorChange(index, 'age', parseInt(e.target.value))}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={juror.city || ''}
                              onChange={(e) => handleJurorChange(index, 'city', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              value={juror.zipCode || ''}
                              onChange={(e) => handleJurorChange(index, 'zipCode', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Occupation
                            </label>
                            <input
                              type="text"
                              value={juror.occupation || ''}
                              onChange={(e) => handleJurorChange(index, 'occupation', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Employer
                            </label>
                            <input
                              type="text"
                              value={juror.employer || ''}
                              onChange={(e) => handleJurorChange(index, 'employer', e.target.value)}
                              className="w-full px-3 py-1 text-sm border rounded"
                              disabled={!juror.include}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600">Confidence</div>
                          <div
                            className={`text-sm font-bold ${
                              juror.confidence >= 80
                                ? 'text-green-600'
                                : juror.confidence >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {juror.confidence}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>
                  Create {extractedJurors.filter((j) => j.include).length} Jurors
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

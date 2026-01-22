'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function NewCasePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    caseNumber: '',
    caseType: 'civil',
    plaintiffName: '',
    defendantName: '',
    ourSide: 'plaintiff',
    jurisdiction: '',
    venue: '',
    trialDate: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<{ case: { id: string } }>('/cases', formData);
      router.push(`/cases/${response.case.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cases"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Link>
        <h1 className="text-3xl font-bold">Create New Case</h1>
        <p className="text-muted-foreground">
          Enter the details for your new trial case
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Case Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Johnson v. TechCorp Industries"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="caseNumber"
                  className="mb-2 block text-sm font-medium"
                >
                  Case Number *
                </label>
                <input
                  id="caseNumber"
                  name="caseNumber"
                  type="text"
                  required
                  value={formData.caseNumber}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="2024-CV-12345"
                />
              </div>

              <div>
                <label
                  htmlFor="caseType"
                  className="mb-2 block text-sm font-medium"
                >
                  Case Type *
                </label>
                <select
                  id="caseType"
                  name="caseType"
                  required
                  value={formData.caseType}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="civil">Civil</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Parties</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="plaintiffName"
                  className="mb-2 block text-sm font-medium"
                >
                  Plaintiff Name
                </label>
                <input
                  id="plaintiffName"
                  name="plaintiffName"
                  type="text"
                  value={formData.plaintiffName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="John Johnson"
                />
              </div>

              <div>
                <label
                  htmlFor="defendantName"
                  className="mb-2 block text-sm font-medium"
                >
                  Defendant Name
                </label>
                <input
                  id="defendantName"
                  name="defendantName"
                  type="text"
                  value={formData.defendantName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="TechCorp Industries"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ourSide"
                className="mb-2 block text-sm font-medium"
              >
                Our Client Is
              </label>
              <select
                id="ourSide"
                name="ourSide"
                value={formData.ourSide}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="plaintiff">Plaintiff</option>
                <option value="defendant">Defendant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trial Details */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Trial Details</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="jurisdiction"
                  className="mb-2 block text-sm font-medium"
                >
                  Jurisdiction
                </label>
                <input
                  id="jurisdiction"
                  name="jurisdiction"
                  type="text"
                  value={formData.jurisdiction}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Los Angeles County"
                />
              </div>

              <div>
                <label
                  htmlFor="venue"
                  className="mb-2 block text-sm font-medium"
                >
                  Venue
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={formData.venue}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Central District Courthouse"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="trialDate"
                className="mb-2 block text-sm font-medium"
              >
                Trial Date
              </label>
              <input
                id="trialDate"
                name="trialDate"
                type="date"
                value={formData.trialDate}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Case Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Brief summary of the case..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/cases">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  );
}

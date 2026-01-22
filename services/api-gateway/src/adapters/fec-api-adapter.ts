/**
 * FEC API Adapter - Tier 2 Data Source
 *
 * Queries the live FEC API for donation records when venue isn't pre-loaded.
 * Performance target: 1-3 seconds
 * Rate limit: 1000 requests/hour
 */

import { DataSourceAdapter, SearchParams } from './data-source-adapter';
import { DataSourceMatch } from '../services/confidence-scorer';

interface FECContribution {
  contributor_name: string;
  contributor_first_name?: string;
  contributor_last_name?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_zip?: string;
  contributor_employer?: string;
  contributor_occupation?: string;
  committee_name: string;
  committee_id: string;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
}

interface FECResponse {
  results: FECContribution[];
  pagination: {
    count: number;
    page: number;
    pages: number;
    per_page: number;
  };
}

export class FECAPIAdapter implements DataSourceAdapter {
  readonly name = 'fec_api';
  readonly tier = 2; // Medium speed, external API

  private apiKey: string;
  private baseUrl = 'https://api.open.fec.gov/v1';
  private requestCount = 0;
  private lastResetTime = Date.now();
  private maxRequestsPerHour = 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(params: SearchParams): Promise<DataSourceMatch[]> {
    // Check rate limit
    if (!this.canMakeRequest()) {
      console.warn('[FECAPIAdapter] Rate limit exceeded, skipping search');
      return [];
    }

    const startTime = Date.now();

    try {
      // Build FEC API query
      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        per_page: '100',
        sort: '-contribution_receipt_date',
      });

      // Name search
      if (params.lastName) {
        queryParams.append('contributor_name', params.lastName);
      } else if (params.fullName) {
        queryParams.append('contributor_name', params.fullName);
      }

      // Location filters
      if (params.city) {
        queryParams.append('contributor_city', params.city);
      }
      if (params.state) {
        queryParams.append('contributor_state', params.state);
      }
      if (params.zipCode) {
        queryParams.append('contributor_zip', params.zipCode.substring(0, 5));
      }

      // Occupation filter
      if (params.occupation) {
        queryParams.append('contributor_occupation', params.occupation);
      }

      const url = `${this.baseUrl}/schedules/schedule_a/?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      this.incrementRequestCount();

      if (!response.ok) {
        console.error(`[FECAPIAdapter] API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: FECResponse = await response.json();
      const elapsedMs = Date.now() - startTime;

      console.log(
        `[FECAPIAdapter] Found ${data.results.length} contributions in ${elapsedMs}ms`
      );

      // Group by donor (contributor_name + city + state)
      const donorMap = new Map<string, DataSourceMatch>();

      for (const contribution of data.results) {
        const donorKey = `${contribution.contributor_name}|${contribution.contributor_city}|${contribution.contributor_state}`;

        if (!donorMap.has(donorKey)) {
          donorMap.set(donorKey, {
            fullName: contribution.contributor_name,
            firstName: contribution.contributor_first_name || undefined,
            lastName: contribution.contributor_last_name || undefined,
            city: contribution.contributor_city || undefined,
            state: contribution.contributor_state || undefined,
            zipCode: contribution.contributor_zip || undefined,
            occupation: contribution.contributor_occupation || undefined,
            employer: contribution.contributor_employer || undefined,
            sourceType: 'fec_api',
            rawData: {
              donations: [
                {
                  recipient: contribution.committee_name,
                  recipientId: contribution.committee_id,
                  amount: contribution.contribution_receipt_amount,
                  date: contribution.contribution_receipt_date,
                },
              ],
              totalDonations: contribution.contribution_receipt_amount,
              donationCount: 1,
              parties: [],
            },
          });
        } else {
          const match = donorMap.get(donorKey)!;
          match.rawData.donations.push({
            recipient: contribution.committee_name,
            recipientId: contribution.committee_id,
            amount: contribution.contribution_receipt_amount,
            date: contribution.contribution_receipt_date,
          });
          match.rawData.totalDonations += contribution.contribution_receipt_amount;
          match.rawData.donationCount += 1;
        }
      }

      const matches = Array.from(donorMap.values()).slice(0, 25);
      console.log(`[FECAPIAdapter] Aggregated into ${matches.length} unique donors`);

      return matches;
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.error('[FECAPIAdapter] Request timeout after 5 seconds');
      } else {
        console.error('[FECAPIAdapter] Search error:', error);
      }
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    if (!this.apiKey || this.apiKey === 'your_key_here') {
      return false;
    }

    // Check rate limit
    return this.canMakeRequest();
  }

  /**
   * Check if we can make a request without exceeding rate limit
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;

    // Reset counter if an hour has passed
    if (now - this.lastResetTime > hourInMs) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    return this.requestCount < this.maxRequestsPerHour;
  }

  /**
   * Increment request counter
   */
  private incrementRequestCount(): void {
    this.requestCount += 1;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    requestsUsed: number;
    requestsRemaining: number;
    resetsAt: Date;
  } {
    const hourInMs = 60 * 60 * 1000;
    return {
      requestsUsed: this.requestCount,
      requestsRemaining: this.maxRequestsPerHour - this.requestCount,
      resetsAt: new Date(this.lastResetTime + hourInMs),
    };
  }
}

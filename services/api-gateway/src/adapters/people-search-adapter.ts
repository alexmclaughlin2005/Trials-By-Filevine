/**
 * People Search API Adapter - Tier 2 Data Source
 *
 * Queries people search APIs (Pipl, FullContact, Whitepages Pro) for comprehensive identity data.
 * Performance target: 1-3 seconds
 * Provides: addresses, phones, emails, social profiles, employment, education
 */

import { DataSourceAdapter, SearchParams } from './data-source-adapter';
import { DataSourceMatch } from '../services/confidence-scorer';

type PeopleSearchProvider = 'pipl' | 'fullcontact' | 'whitepages';

interface PeopleSearchConfig {
  provider: PeopleSearchProvider;
  apiKey: string;
  timeout?: number; // milliseconds
}

export class PeopleSearchAdapter implements DataSourceAdapter {
  readonly name: string;
  readonly tier = 2; // Medium speed, external API

  private config: PeopleSearchConfig;

  constructor(config: PeopleSearchConfig) {
    this.config = config;
    this.name = `people_search_${config.provider}`;
  }

  async search(params: SearchParams): Promise<DataSourceMatch[]> {
    const startTime = Date.now();

    try {
      switch (this.config.provider) {
        case 'pipl':
          return await this.searchPipl(params);
        case 'fullcontact':
          return await this.searchFullContact(params);
        case 'whitepages':
          return await this.searchWhitepages(params);
        default:
          console.error(`[PeopleSearchAdapter] Unknown provider: ${this.config.provider}`);
          return [];
      }
    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      console.error(`[PeopleSearchAdapter] Search error after ${elapsedMs}ms:`, error);
      return [];
    }
  }

  /**
   * Search using Pipl API
   * Docs: https://docs.pipl.com/reference/search-api
   */
  private async searchPipl(params: SearchParams): Promise<DataSourceMatch[]> {
    const queryParams = new URLSearchParams({
      key: this.config.apiKey,
    });

    // Name search
    if (params.firstName) queryParams.append('first_name', params.firstName);
    if (params.lastName) queryParams.append('last_name', params.lastName);

    // Location
    if (params.city) queryParams.append('city', params.city);
    if (params.state) queryParams.append('state', params.state);
    if (params.zipCode) queryParams.append('zipcode', params.zipCode);

    // Age
    if (params.age) {
      const birthYear = new Date().getFullYear() - params.age;
      queryParams.append('age', params.age.toString());
    }

    const url = `https://api.pipl.com/search/?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(this.config.timeout || 5000),
    });

    if (!response.ok) {
      console.error(`[PeopleSearchAdapter] Pipl API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as any;

    // Parse Pipl response
    const matches: DataSourceMatch[] = [];

    if (data.person) {
      const person = data.person as any;

      // Extract names
      const name = person.names?.[0] || {};
      const fullName = name.display || `${name.first || ''} ${name.last || ''}`.trim();

      // Extract addresses
      const address = person.addresses?.[0] || {};

      // Extract age
      const dob = person.dob;
      const age = dob?.age || undefined;
      const birthYear = dob?.date_range?.start
        ? new Date(dob.date_range.start).getFullYear()
        : undefined;

      // Extract employment
      const job = person.jobs?.[0] || {};

      // Extract emails
      const emails = person.emails?.map((e: any) => e.address) || [];

      // Extract phones
      const phones = person.phones?.map((p: any) => p.display_international || p.display) || [];

      // Extract social profiles
      const socialProfiles =
        person.urls?.map((u: any) => ({
          type: u.category,
          url: u.url,
        })) || [];

      // Extract photo
      const photoUrl = person.images?.[0]?.url;

      matches.push({
        fullName,
        firstName: name.first || undefined,
        lastName: name.last || undefined,
        age,
        birthYear,
        city: address.city || undefined,
        state: address.state || undefined,
        zipCode: address.zip_code || undefined,
        occupation: job.title || undefined,
        employer: job.organization || undefined,
        email: emails[0],
        phone: phones[0],
        sourceType: 'pipl',
        rawData: {
          emails,
          phones,
          addresses: person.addresses || [],
          jobs: person.jobs || [],
          education: person.educations || [],
          socialProfiles,
          photoUrl,
          languages: person.languages || [],
          ethnicity: person.ethnicity,
          gender: person.gender,
        },
      });
    }

    return matches;
  }

  /**
   * Search using FullContact API
   * Docs: https://docs.fullcontact.com/
   */
  private async searchFullContact(params: SearchParams): Promise<DataSourceMatch[]> {
    const body: any = {};

    // Name
    if (params.firstName || params.lastName) {
      body.name = {
        given: params.firstName,
        family: params.lastName,
      };
    } else if (params.fullName) {
      body.name = { full: params.fullName };
    }

    // Location
    if (params.city || params.state || params.zipCode) {
      body.location = {
        city: params.city,
        region: params.state,
        postalCode: params.zipCode,
      };
    }

    const url = 'https://api.fullcontact.com/v3/person.enrich';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 5000),
    });

    if (!response.ok) {
      console.error(`[PeopleSearchAdapter] FullContact API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as any;

    // Parse FullContact response
    const matches: DataSourceMatch[] = [];

    if (data.fullName) {
      const age = data.age ? Math.floor(data.age) : undefined;
      const location = data.location || {};
      const employment = data.employment?.[0] || {};

      matches.push({
        fullName: data.fullName,
        firstName: data.name?.given || undefined,
        lastName: data.name?.family || undefined,
        age,
        city: location.city || undefined,
        state: location.region || undefined,
        occupation: employment.title || undefined,
        employer: employment.name || undefined,
        email: data.emails?.[0]?.address,
        phone: data.phones?.[0]?.number,
        sourceType: 'fullcontact',
        rawData: {
          emails: data.emails || [],
          phones: data.phones || [],
          socialProfiles: data.socialProfiles || [],
          employment: data.employment || [],
          education: data.education || [],
          photoUrl: data.photos?.[0]?.url,
          bio: data.bio,
        },
      });
    }

    return matches;
  }

  /**
   * Search using Whitepages Pro API
   * Docs: https://pro.whitepages.com/developer/documentation/
   */
  private async searchWhitepages(params: SearchParams): Promise<DataSourceMatch[]> {
    const queryParams = new URLSearchParams({
      api_key: this.config.apiKey,
    });

    // Name
    if (params.firstName) queryParams.append('first_name', params.firstName);
    if (params.lastName) queryParams.append('last_name', params.lastName);

    // Location
    if (params.city) queryParams.append('city', params.city);
    if (params.state) queryParams.append('state', params.state);
    if (params.zipCode) queryParams.append('postal_code', params.zipCode);

    const url = `https://proapi.whitepages.com/3.0/person?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(this.config.timeout || 5000),
    });

    if (!response.ok) {
      console.error(`[PeopleSearchAdapter] Whitepages API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as any;

    // Parse Whitepages response
    const matches: DataSourceMatch[] = [];

    if (data.results) {
      for (const result of data.results.slice(0, 10)) {
        const person = result.person || {};
        const name = person.name || {};
        const age = person.age_range
          ? Math.floor((person.age_range.start + person.age_range.end) / 2)
          : undefined;

        const location = person.locations?.[0] || {};
        const phone = person.phones?.[0]?.line_type === 'Mobile' ? person.phones[0] : undefined;

        matches.push({
          fullName: name.full || `${name.first_name || ''} ${name.last_name || ''}`.trim(),
          firstName: name.first_name || undefined,
          lastName: name.last_name || undefined,
          age,
          city: location.city || undefined,
          state: location.state_code || undefined,
          zipCode: location.postal_code || undefined,
          phone: phone?.phone_number,
          sourceType: 'whitepages',
          rawData: {
            ageRange: person.age_range,
            locations: person.locations || [],
            phones: person.phones || [],
            associates: person.associated_people || [],
          },
        });
      }
    }

    return matches;
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    if (!this.config.apiKey || this.config.apiKey === 'your_key_here') {
      return false;
    }
    return true;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Make a minimal test request
      const testParams: SearchParams = {
        firstName: 'John',
        lastName: 'Smith',
        state: 'CA',
      };

      const results = await this.search(testParams);
      return true; // If no error thrown, connection works
    } catch (error) {
      console.error(`[PeopleSearchAdapter] Connection test failed:`, error);
      return false;
    }
  }
}

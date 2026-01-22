/**
 * Mock data source adapter for Phase 1 testing
 * Returns synthetic data for development and testing
 */

import { DataSourceAdapter, SearchParams } from './data-source-adapter';
import { DataSourceMatch } from '../services/confidence-scorer';

export class MockDataSourceAdapter implements DataSourceAdapter {
  readonly name = 'mock';
  readonly tier = 1; // Fast, local

  // Mock database of people
  private mockData: DataSourceMatch[] = [
    {
      fullName: 'ALEX MCLAUGHLIN',
      firstName: 'ALEX',
      lastName: 'MCLAUGHLIN',
      age: 34,
      birthYear: 1990,
      city: 'Akron',
      state: 'OH',
      zipCode: '44333',
      occupation: 'VP of Product',
      employer: 'Tech Startup Inc',
      email: 'alex.mclaughlin@example.com',
      phone: '555-0999',
      sourceType: 'mock',
      rawData: { party: 'Independent', votingHistory: [2016, 2018, 2020, 2022] },
    },
    {
      fullName: 'ALEX M MCLAUGHLIN',
      firstName: 'ALEX',
      lastName: 'MCLAUGHLIN',
      middleName: 'M',
      age: 35,
      birthYear: 1989,
      city: 'Akron',
      state: 'OH',
      zipCode: '44333',
      occupation: 'Product Manager',
      employer: 'Innovation Labs',
      email: 'a.mclaughlin@innovationlabs.com',
      phone: '555-0998',
      sourceType: 'mock',
      rawData: { party: 'Democrat', votingHistory: [2020, 2022] },
    },
    {
      fullName: 'JOHN SMITH',
      firstName: 'JOHN',
      lastName: 'SMITH',
      age: 42,
      birthYear: 1982,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90012',
      occupation: 'Software Engineer',
      employer: 'Tech Corp',
      email: 'john.smith@example.com',
      phone: '555-0101',
      sourceType: 'mock',
      rawData: { party: 'Independent', votingHistory: [2016, 2018, 2020, 2022] },
    },
    {
      fullName: 'JOHN A SMITH',
      firstName: 'JOHN',
      lastName: 'SMITH',
      middleName: 'A',
      age: 43,
      birthYear: 1981,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90013',
      occupation: 'Teacher',
      employer: 'LAUSD',
      sourceType: 'mock',
      rawData: { party: 'Democrat', votingHistory: [2016, 2020] },
    },
    {
      fullName: 'JON SMITH',
      firstName: 'JON',
      lastName: 'SMITH',
      age: 41,
      birthYear: 1983,
      city: 'Pasadena',
      state: 'CA',
      zipCode: '91101',
      occupation: 'Accountant',
      employer: 'Smith & Associates',
      email: 'jon@smithcpa.com',
      sourceType: 'mock',
      rawData: { party: 'Republican', votingHistory: [2018, 2020, 2022] },
    },
    {
      fullName: 'MARIA GARCIA',
      firstName: 'MARIA',
      lastName: 'GARCIA',
      age: 35,
      birthYear: 1989,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90012',
      occupation: 'Nurse',
      employer: 'LA County Hospital',
      phone: '555-0201',
      sourceType: 'mock',
      rawData: { party: 'Democrat', votingHistory: [2020, 2022] },
    },
    {
      fullName: 'MARIA L GARCIA',
      firstName: 'MARIA',
      lastName: 'GARCIA',
      middleName: 'L',
      age: 35,
      birthYear: 1989,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90015',
      occupation: 'Registered Nurse',
      employer: 'County Hospital',
      email: 'mgarcia@example.com',
      sourceType: 'mock',
      rawData: {
        donations: [
          { recipient: 'Biden for President', amount: 250, date: '2020-09-15' },
        ],
      },
    },
    {
      fullName: 'ROBERT JOHNSON',
      firstName: 'ROBERT',
      lastName: 'JOHNSON',
      age: 58,
      birthYear: 1966,
      city: 'Long Beach',
      state: 'CA',
      zipCode: '90802',
      occupation: 'Retired',
      employer: 'US Navy (Retired)',
      sourceType: 'mock',
      rawData: { party: 'Republican', votingHistory: [2016, 2018, 2020, 2022] },
    },
    {
      fullName: 'SARAH CHEN',
      firstName: 'SARAH',
      lastName: 'CHEN',
      age: 29,
      birthYear: 1995,
      city: 'Irvine',
      state: 'CA',
      zipCode: '92602',
      occupation: 'Data Scientist',
      employer: 'Google',
      email: 's.chen@gmail.com',
      phone: '555-0301',
      sourceType: 'mock',
      rawData: { party: 'Independent', votingHistory: [2020, 2022] },
    },
    {
      fullName: 'MICHAEL BROWN',
      firstName: 'MICHAEL',
      lastName: 'BROWN',
      age: 45,
      birthYear: 1979,
      city: 'Santa Monica',
      state: 'CA',
      zipCode: '90401',
      occupation: 'Attorney',
      employer: 'Brown & Partners LLP',
      email: 'mbrown@brownlaw.com',
      phone: '555-0401',
      sourceType: 'mock',
      rawData: {
        party: 'Democrat',
        votingHistory: [2016, 2018, 2020, 2022],
        donations: [
          { recipient: 'ACLU', amount: 500, date: '2021-03-10' },
          { recipient: 'Warren for President', amount: 1000, date: '2019-08-15' },
        ],
      },
    },
    {
      fullName: 'MICHAEL BROWN',
      firstName: 'MICHAEL',
      lastName: 'BROWN',
      age: 26,
      birthYear: 2000,  // Changed from 1998 to avoid birthYear match
      city: 'West Hollywood',
      state: 'CA',
      zipCode: '90069',
      occupation: 'Barista',
      employer: 'Blue Bottle Coffee',
      email: 'mike.brown@gmail.com',
      phone: '555-0426',
      sourceType: 'mock',
      rawData: {
        party: 'Independent',
        votingHistory: [2020, 2022],
      },
    },
    {
      fullName: 'JENNIFER MARTINEZ',
      firstName: 'JENNIFER',
      lastName: 'MARTINEZ',
      age: 38,
      birthYear: 1986,
      city: 'Burbank',
      state: 'CA',
      zipCode: '91501',
      occupation: 'Marketing Manager',
      employer: 'Disney',
      email: 'jmartinez@disney.com',
      sourceType: 'mock',
      rawData: { party: 'Independent', votingHistory: [2020, 2022] },
    },
    {
      fullName: 'DAVID LEE',
      firstName: 'DAVID',
      lastName: 'LEE',
      age: 52,
      birthYear: 1972,
      city: 'Glendale',
      state: 'CA',
      zipCode: '91201',
      occupation: 'Business Owner',
      employer: 'Lee Electronics',
      phone: '555-0501',
      sourceType: 'mock',
      rawData: {
        party: 'Republican',
        votingHistory: [2016, 2018, 2020, 2022],
        donations: [
          { recipient: 'Trump for President', amount: 2800, date: '2020-06-20' },
        ],
      },
    },
  ];

  async search(params: SearchParams): Promise<DataSourceMatch[]> {
    // Simulate network delay (50-150ms)
    await this.delay(50 + Math.random() * 100);

    const results: DataSourceMatch[] = [];

    for (const person of this.mockData) {
      let match = false;

      // Name matching
      if (params.lastName) {
        const queryLast = params.lastName.toUpperCase();
        if (person.lastName?.includes(queryLast) || queryLast.includes(person.lastName || '')) {
          match = true;
        }
      }

      if (params.firstName) {
        const queryFirst = params.firstName.toUpperCase();
        if (person.firstName?.includes(queryFirst) || queryFirst.includes(person.firstName || '')) {
          match = true;
        }
      }

      if (params.fullName && !params.firstName && !params.lastName) {
        const queryFull = params.fullName.toUpperCase();
        if (person.fullName.includes(queryFull) || queryFull.includes(person.fullName)) {
          match = true;
        }
      }

      // Location matching (if name matched) - Don't filter out, let confidence scorer handle it
      // The confidence scorer will give higher scores to location matches

      // Age matching (loose - within 10 years)
      if (match && params.age && person.age) {
        if (Math.abs(params.age - person.age) > 10) {
          match = false;
        }
      }

      if (match) {
        results.push(person);
      }
    }

    console.log(`[MockDataSource] Found ${results.length} matches`);
    return results;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Mock source is always available
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add custom mock data for testing (useful for unit tests)
   */
  addMockPerson(person: DataSourceMatch): void {
    this.mockData.push(person);
  }

  /**
   * Clear all mock data
   */
  clearMockData(): void {
    this.mockData = [];
  }

  /**
   * Reset to default mock data
   */
  resetToDefaults(): void {
    // Re-initialize with default data
    this.mockData = [];
    // (would re-add the default set here)
  }
}

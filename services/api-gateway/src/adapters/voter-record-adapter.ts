/**
 * Voter Record Adapter - Tier 1 Data Source
 *
 * Searches pre-loaded voter registration data from local database.
 * Performance target: <100ms (indexed phonetic search)
 */

import type { PrismaClient } from '@trialforge/database';
import { DataSourceAdapter, SearchParams } from './data-source-adapter';
import { DataSourceMatch } from '../services/confidence-scorer';
import { metaphone } from '@trialforge/utils';

export class VoterRecordAdapter implements DataSourceAdapter {
  readonly name = 'voter_record';
  readonly tier = 1; // Fast, local database

  constructor(private prisma: PrismaClient) {}

  async search(params: SearchParams): Promise<DataSourceMatch[]> {
    const startTime = Date.now();

    // Build search conditions
    const where: any = {};

    // Venue filtering (if specified)
    if (params.venueId) {
      where.venueId = params.venueId;
    }

    // Name matching - use phonetic index for fuzzy search
    const nameConditions: any[] = [];

    if (params.lastName) {
      const lastMetaphone = metaphone(params.lastName);
      nameConditions.push({
        nameMetaphone: {
          contains: lastMetaphone,
        },
      });
    }

    if (params.firstName && params.lastName) {
      // If both names provided, search for exact or phonetic matches
      nameConditions.push({
        AND: [
          { firstName: { contains: params.firstName, mode: 'insensitive' } },
          { lastName: { contains: params.lastName, mode: 'insensitive' } },
        ],
      });
    } else if (params.fullName) {
      // Full name search
      nameConditions.push({
        fullName: {
          contains: params.fullName,
          mode: 'insensitive',
        },
      });
    }

    if (nameConditions.length > 0) {
      where.OR = nameConditions;
    }

    // Age filtering (±5 years for broader matches)
    if (params.age) {
      where.age = {
        gte: params.age - 5,
        lte: params.age + 5,
      };
    }

    // Location filtering
    if (params.city) {
      where.city = {
        equals: params.city,
        mode: 'insensitive',
      };
    }

    if (params.zipCode) {
      // Match first 5 digits of ZIP
      where.zipCode = {
        startsWith: params.zipCode.substring(0, 5),
      };
    }

    try {
      // Execute database query
      const records = await this.prisma.voterRecord.findMany({
        where,
        take: 50, // Limit to top 50 results
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`[VoterRecordAdapter] Found ${records.length} matches in ${elapsedMs}ms`);

      // Convert to DataSourceMatch format
      return records.map((record) => ({
        fullName: record.fullName,
        firstName: record.firstName,
        lastName: record.lastName,
        middleName: record.middleName || undefined,
        age: record.age || undefined,
        birthYear: record.birthYear || undefined,
        city: record.city || undefined,
        state: 'CA', // TODO: add state field to VoterRecord model or get from venue
        zipCode: record.zipCode || undefined,
        sourceType: 'voter_record',
        rawData: {
          party: record.party || undefined,
          registrationDate: record.registrationDate?.toISOString().split('T')[0],
          votingHistory: record.votingHistory || [],
          address: record.address || undefined,
        },
      }));
    } catch (error) {
      console.error('[VoterRecordAdapter] Search error:', error);
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if voter_records table has data
      const count = await this.prisma.voterRecord.count();
      return count > 0;
    } catch (error) {
      console.error('[VoterRecordAdapter] Availability check failed:', error);
      return false;
    }
  }

  /**
   * Get statistics about loaded voter data
   */
  async getStats(): Promise<{
    totalRecords: number;
    venueCount: number;
  }> {
    const [totalRecords, venues] = await Promise.all([
      this.prisma.voterRecord.count(),
      this.prisma.voterRecord.groupBy({
        by: ['venueId'],
        _count: true,
      }),
    ]);

    return {
      totalRecords,
      venueCount: venues.length,
    };
  }
}

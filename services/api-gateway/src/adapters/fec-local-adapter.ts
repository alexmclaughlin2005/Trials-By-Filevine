/**
 * FEC Local Adapter - Tier 1 Data Source
 *
 * Searches pre-loaded Federal Election Commission donation records from local database.
 * Performance target: <100ms (indexed phonetic search)
 */

import type { PrismaClient } from '@juries/database';
import { DataSourceAdapter, SearchParams } from './data-source-adapter';
import { DataSourceMatch } from '../services/confidence-scorer';
import { metaphone } from '@juries/utils';

export class FECLocalAdapter implements DataSourceAdapter {
  readonly name = 'fec_local';
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

    // Name matching - use phonetic index
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
      nameConditions.push({
        AND: [
          { donorNameFirst: { contains: params.firstName, mode: 'insensitive' } },
          { donorNameLast: { contains: params.lastName, mode: 'insensitive' } },
        ],
      });
    } else if (params.fullName) {
      nameConditions.push({
        donorName: {
          contains: params.fullName,
          mode: 'insensitive',
        },
      });
    }

    if (nameConditions.length > 0) {
      where.OR = nameConditions;
    }

    // Location filtering (city + state is common in FEC data)
    if (params.city && params.state) {
      where.donorCity = { equals: params.city, mode: 'insensitive' };
      where.donorState = params.state;
    } else if (params.city) {
      where.donorCity = { equals: params.city, mode: 'insensitive' };
    } else if (params.zipCode) {
      where.donorZipCode = { startsWith: params.zipCode.substring(0, 5) };
    }

    try {
      // Execute database query - group by donor to get unique people
      const donations = await this.prisma.fECDonation.findMany({
        where,
        take: 100, // Get more donations to aggregate by person
        orderBy: [
          { donorNameLast: 'asc' },
          { donorNameFirst: 'asc' },
          { transactionDate: 'desc' },
        ],
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`[FECLocalAdapter] Found ${donations.length} donations in ${elapsedMs}ms`);

      // Group donations by person (based on name + city + state)
      const donorMap = new Map<string, DataSourceMatch>();

      for (const donation of donations) {
        const donorKey = `${donation.donorName}|${donation.donorCity}|${donation.donorState}`;

        if (!donorMap.has(donorKey)) {
          // First donation for this person - create match
          donorMap.set(donorKey, {
            fullName: donation.donorName,
            firstName: donation.donorNameFirst || undefined,
            lastName: donation.donorNameLast || undefined,
            city: donation.donorCity || undefined,
            state: donation.donorState || undefined,
            zipCode: donation.donorZipCode || undefined,
            occupation: donation.donorOccupation || undefined,
            employer: donation.donorEmployer || undefined,
            sourceType: 'fec_donation',
            rawData: {
              donations: [
                {
                  recipient: donation.recipientName,
                  recipientParty: donation.recipientParty || undefined,
                  recipientOffice: donation.recipientOffice || undefined,
                  amount: donation.amount,
                  date: donation.transactionDate.toISOString().split('T')[0],
                },
              ],
              totalDonations: donation.amount,
              donationCount: 1,
              parties: donation.recipientParty ? [donation.recipientParty] : [],
            },
          });
        } else {
          // Additional donation - aggregate
          const match = donorMap.get(donorKey)!;
          match.rawData.donations.push({
            recipient: donation.recipientName,
            recipientParty: donation.recipientParty || undefined,
            recipientOffice: donation.recipientOffice || undefined,
            amount: donation.amount,
            date: donation.transactionDate.toISOString().split('T')[0],
          });
          match.rawData.totalDonations += donation.amount;
          match.rawData.donationCount += 1;

          // Track unique parties donated to
          if (
            donation.recipientParty &&
            !match.rawData.parties.includes(donation.recipientParty)
          ) {
            match.rawData.parties.push(donation.recipientParty);
          }
        }
      }

      // Convert to array and limit results
      const matches = Array.from(donorMap.values()).slice(0, 25);

      console.log(`[FECLocalAdapter] Aggregated into ${matches.length} unique donors`);

      return matches;
    } catch (error) {
      console.error('[FECLocalAdapter] Search error:', error);
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if fec_donations table has data
      const count = await this.prisma.fECDonation.count();
      return count > 0;
    } catch (error) {
      console.error('[FECLocalAdapter] Availability check failed:', error);
      return false;
    }
  }

  /**
   * Get statistics about loaded FEC data
   */
  async getStats(): Promise<{
    totalDonations: number;
    uniqueDonors: number;
    totalAmount: number;
    venueCount: number;
  }> {
    const [totalDonations, aggregatedSum, venues] = await Promise.all([
      this.prisma.fECDonation.count(),
      this.prisma.fECDonation.aggregate({
        _sum: {
          amount: true,
        },
      }),
      this.prisma.fECDonation.groupBy({
        by: ['venueId'],
        _count: true,
      }),
    ]);

    // Get unique donor count (approximate using distinct donor names)
    const uniqueDonors = await this.prisma.fECDonation.groupBy({
      by: ['donorName', 'city', 'state'] as any,
      _count: true,
    });

    return {
      totalDonations,
      uniqueDonors: uniqueDonors.length,
      totalAmount: aggregatedSum._sum.amount || 0,
      venueCount: venues.filter((v) => v.venueId).length,
    };
  }
}

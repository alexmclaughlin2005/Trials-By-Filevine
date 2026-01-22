/**
 * Search Orchestrator Service
 * Coordinates searches across multiple data sources and performs entity linking
 */

import { PrismaClient } from '@juries/database';
import { DataSourceAdapter } from '../adapters/data-source-adapter';
import {
  scoreCandidate,
  calculateCorroborationBonus,
  JurorSearchQuery,
  DataSourceMatch,
  ScoredCandidate
} from './confidence-scorer';

const prisma = new PrismaClient();

export interface SearchResult {
  jurorId: string;
  searchJobId: string;
  candidates: ScoredCandidate[];
  totalCandidates: number;
  sourcesSearched: string[];
  searchDurationMs: number;
}

export interface EntityCluster {
  candidates: ScoredCandidate[];
  primaryCandidate: ScoredCandidate;
  aggregatedScore: number;
  sourceCount: number;
}

export class SearchOrchestrator {
  private dataSources: DataSourceAdapter[] = [];

  constructor(dataSources: DataSourceAdapter[]) {
    this.dataSources = dataSources;
  }

  /**
   * Execute a search for a juror across all available data sources
   */
  async searchJuror(jurorId: string, query: JurorSearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    // Create search job record
    const searchJob = await prisma.searchJob.create({
      data: {
        jurorId,
        status: 'running',
        searchQuery: query as any,
        sourcesSearched: [],
        startedAt: new Date(),
      },
    });

    try {
      // Update juror search timestamps
      await prisma.juror.update({
        where: { id: jurorId },
        data: { searchStartedAt: new Date() },
      });

      // Search all data sources in parallel
      const searchPromises = this.dataSources.map(async (source) => {
        try {
          const matches = await source.search({
            firstName: query.firstName,
            lastName: query.lastName,
            fullName: query.fullName,
            age: query.age,
            city: query.city,
            zipCode: query.zipCode,
            occupation: query.occupation,
          });
          return { source: source.name, matches };
        } catch (error) {
          console.error(`Error searching ${source.name}:`, error);
          return { source: source.name, matches: [] };
        }
      });

      const sourceResults = await Promise.all(searchPromises);
      const sourcesSearched = sourceResults.map((r) => r.source);

      // Flatten all matches and score them
      const allMatches = sourceResults.flatMap((r) => r.matches);
      const scoredMatches = allMatches.map((match) => scoreCandidate(query, match));

      // Perform entity linking (cluster matches that refer to the same person)
      const clusters = this.clusterMatches(scoredMatches);

      // Apply corroboration bonus to clustered matches
      const enhancedCandidates = this.applyCorroborationBonus(clusters);

      // Sort by confidence score (highest first)
      enhancedCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

      // Filter out low-confidence matches (below 30)
      const filteredCandidates = enhancedCandidates.filter((c) => c.confidenceScore >= 30);

      // Save candidates to database
      await this.saveCandidates(jurorId, filteredCandidates);

      // Fetch saved candidates from database to get their IDs
      const savedCandidates = await prisma.candidate.findMany({
        where: { jurorId },
        orderBy: { confidenceScore: 'desc' },
      });

      // Update search job
      const searchDurationMs = Date.now() - startTime;
      await prisma.searchJob.update({
        where: { id: searchJob.id },
        data: {
          status: 'completed',
          sourcesSearched,
          candidateCount: filteredCandidates.length,
          completedAt: new Date(),
        },
      });

      // Update juror
      await prisma.juror.update({
        where: { id: jurorId },
        data: { searchCompletedAt: new Date() },
      });

      return {
        jurorId,
        searchJobId: searchJob.id,
        candidates: savedCandidates as any as ScoredCandidate[],
        totalCandidates: savedCandidates.length,
        sourcesSearched,
        searchDurationMs,
      };
    } catch (error) {
      // Mark search as failed
      await prisma.searchJob.update({
        where: { id: searchJob.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Cluster matches that likely refer to the same person (entity linking)
   * Uses Union-Find algorithm with link strength calculation
   */
  private clusterMatches(matches: ScoredCandidate[]): EntityCluster[] {
    if (matches.length === 0) return [];

    // Initialize Union-Find structure
    const parent: number[] = Array.from({ length: matches.length }, (_, i) => i);
    const rank: number[] = Array(matches.length).fill(0);

    const find = (i: number): number => {
      if (parent[i] !== i) {
        parent[i] = find(parent[i]); // Path compression
      }
      return parent[i];
    };

    const union = (i: number, j: number): void => {
      const rootI = find(i);
      const rootJ = find(j);

      if (rootI !== rootJ) {
        // Union by rank
        if (rank[rootI] < rank[rootJ]) {
          parent[rootI] = rootJ;
        } else if (rank[rootI] > rank[rootJ]) {
          parent[rootJ] = rootI;
        } else {
          parent[rootJ] = rootI;
          rank[rootI]++;
        }
      }
    };

    // Calculate link strength between all pairs
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const linkStrength = this.calculateLinkStrength(matches[i], matches[j]);
        console.log(`[EntityLinking] ${matches[i].fullName} (${matches[i].sourceType}) <-> ${matches[j].fullName} (${matches[j].sourceType}): strength = ${linkStrength}`);

        // Link if strength >= 5 (out of 10)
        if (linkStrength >= 5) {
          console.log(`[EntityLinking] ✓ Clustering together (strength >= 5)`);
          union(i, j);
        }
      }
    }

    // Group matches by their root
    const clusters = new Map<number, ScoredCandidate[]>();
    for (let i = 0; i < matches.length; i++) {
      const root = find(i);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(matches[i]);
    }

    // Convert to EntityCluster format
    return Array.from(clusters.values()).map((clusterMatches) => {
      // Choose primary candidate (highest confidence score)
      clusterMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);
      const primaryCandidate = clusterMatches[0];

      // Calculate aggregated score (weighted average, favoring primary)
      const aggregatedScore = this.calculateAggregatedScore(clusterMatches);

      return {
        candidates: clusterMatches,
        primaryCandidate,
        aggregatedScore,
        sourceCount: clusterMatches.length,
      };
    });
  }

  /**
   * Calculate link strength between two candidates (0-10 scale)
   */
  private calculateLinkStrength(a: ScoredCandidate, b: ScoredCandidate): number {
    let strength = 0;

    // Strong links (worth 5 points each)
    if (a.email && b.email && a.email === b.email) {
      strength += 5; // Same email = very strong link
    }
    if (a.phone && b.phone && a.phone === b.phone) {
      strength += 5; // Same phone = very strong link
    }
    if (
      a.birthYear && b.birthYear && a.birthYear === b.birthYear &&
      a.lastName && b.lastName && a.lastName === b.lastName
    ) {
      strength += 5; // Same DOB + last name = very strong
    }

    // Moderate links (need multiple to reach threshold)
    let moderateLinks = 0;

    // Same full name
    if (
      a.firstName && b.firstName && a.firstName === b.firstName &&
      a.lastName && b.lastName && a.lastName === b.lastName
    ) {
      moderateLinks += 3;
    }

    // Similar age (within 2 years)
    if (a.age && b.age && Math.abs(a.age - b.age) <= 2) {
      moderateLinks += 1;
    }

    // Same city
    if (a.city && b.city && a.city.toUpperCase() === b.city.toUpperCase()) {
      moderateLinks += 2;
    }

    // Same ZIP code
    if (a.zipCode && b.zipCode && a.zipCode.substring(0, 5) === b.zipCode.substring(0, 5)) {
      moderateLinks += 2;
    }

    // Same address
    if (a.address && b.address && a.address.toUpperCase() === b.address.toUpperCase()) {
      moderateLinks += 3;
    }

    // Same employer
    if (a.employer && b.employer && a.employer.toUpperCase() === b.employer.toUpperCase()) {
      moderateLinks += 2;
    }

    strength += moderateLinks;

    return Math.min(10, strength);
  }

  /**
   * Calculate aggregated confidence score for a cluster
   */
  private calculateAggregatedScore(candidates: ScoredCandidate[]): number {
    if (candidates.length === 1) {
      return candidates[0].confidenceScore;
    }

    // Weighted average: primary gets 60% weight, others share 40%
    const primary = candidates[0];
    const others = candidates.slice(1);

    const primaryWeight = 0.6;
    const othersWeight = 0.4 / others.length;

    let aggregated = primary.confidenceScore * primaryWeight;
    for (const candidate of others) {
      aggregated += candidate.confidenceScore * othersWeight;
    }

    return Math.round(aggregated);
  }

  /**
   * Apply corroboration bonus to clustered candidates
   */
  private applyCorroborationBonus(clusters: EntityCluster[]): ScoredCandidate[] {
    const results: ScoredCandidate[] = [];

    for (const cluster of clusters) {
      const bonus = calculateCorroborationBonus(cluster.sourceCount);

      // Apply bonus to primary candidate
      const enhanced = {
        ...cluster.primaryCandidate,
        confidenceScore: Math.min(100, cluster.aggregatedScore + bonus),
        scoreFactors: {
          ...cluster.primaryCandidate.scoreFactors,
          corroborationScore: bonus,
          corroborationReason:
            cluster.sourceCount > 1
              ? `Confirmed by ${cluster.sourceCount} sources`
              : 'Single source',
          totalScore: Math.min(100, cluster.aggregatedScore + bonus),
        },
      };

      // If multiple sources, merge profile data
      if (cluster.sourceCount > 1) {
        enhanced.rawData = {
          ...enhanced.rawData,
          linkedSources: cluster.candidates.map((c) => ({
            sourceType: c.sourceType,
            data: c.rawData,
          })),
        };
      }

      results.push(enhanced);
    }

    return results;
  }

  /**
   * Save candidates to database
   */
  private async saveCandidates(
    jurorId: string,
    candidates: ScoredCandidate[]
  ): Promise<void> {
    // Delete existing candidates for this juror
    await prisma.candidate.deleteMany({
      where: { jurorId },
    });

    // Create new candidates
    for (const candidate of candidates) {
      await prisma.candidate.create({
        data: {
          jurorId,
          sourceType: candidate.sourceType,
          fullName: candidate.fullName,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          middleName: candidate.middleName,
          age: candidate.age,
          birthYear: candidate.birthYear,
          occupation: candidate.occupation,
          employer: candidate.employer,
          city: candidate.city,
          state: candidate.state,
          zipCode: candidate.zipCode,
          phone: candidate.phone,
          email: candidate.email,
          address: candidate.address,
          confidenceScore: candidate.confidenceScore,
          scoreFactors: candidate.scoreFactors as any,
          profile: candidate.rawData as any,
        },
      });
    }
  }

  /**
   * Confirm a candidate match
   */
  async confirmCandidate(
    candidateId: string,
    confirmedBy: string
  ): Promise<void> {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        isConfirmed: true,
        confirmedBy,
        confirmedAt: new Date(),
      },
    });
  }

  /**
   * Reject a candidate match
   */
  async rejectCandidate(
    candidateId: string,
    rejectedBy: string
  ): Promise<void> {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        isRejected: true,
        rejectedBy,
        rejectedAt: new Date(),
      },
    });
  }
}

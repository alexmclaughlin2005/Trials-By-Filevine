/**
 * Batch Import Service
 *
 * Handles CSV import of juror lists with:
 * - CSV parsing and validation
 * - Column mapping
 * - Batch juror creation (transactional)
 * - Optional automatic search trigger
 * - Progress tracking
 */

import { PrismaClient } from '@juries/database';
import { parse } from 'csv-parse/sync';
import { SearchOrchestrator } from './search-orchestrator';

export interface BatchImportConfig {
  panelId: string;
  uploadedBy: string;
  fileName: string;
  csvContent: string;
  autoSearch?: boolean;
  venueId?: string;
  columnMapping?: Record<string, string>;
}

export interface BatchImportResult {
  batchId: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  importedJurorIds: string[];
}

export interface CSVRow {
  [key: string]: string;
}

export class BatchImportService {
  constructor(
    private prisma: PrismaClient,
    private searchOrchestrator?: SearchOrchestrator
  ) {}

  /**
   * Parse CSV content and validate headers
   */
  private parseCSV(csvContent: string): CSVRow[] {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CSVRow[];
      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map CSV columns to juror fields using column mapping
   */
  private mapRow(row: CSVRow, columnMapping?: Record<string, string>): Record<string, any> {
    // Default column mapping
    const defaultMapping: Record<string, string> = {
      'Juror Number': 'jurorNumber',
      'juror_number': 'jurorNumber',
      'number': 'jurorNumber',
      'First Name': 'firstName',
      'first_name': 'firstName',
      'firstname': 'firstName',
      'Last Name': 'lastName',
      'last_name': 'lastName',
      'lastname': 'lastName',
      'Age': 'age',
      'age': 'age',
      'Occupation': 'occupation',
      'occupation': 'occupation',
      'job': 'occupation',
      'Employer': 'employer',
      'employer': 'employer',
      'company': 'employer',
      'City': 'city',
      'city': 'city',
      'ZIP': 'zipCode',
      'zip': 'zipCode',
      'zipcode': 'zipCode',
      'zip_code': 'zipCode',
      'Zip Code': 'zipCode',
    };

    const mapping = columnMapping || defaultMapping;
    const mappedData: any = {};

    for (const [csvColumn, value] of Object.entries(row)) {
      const jurorField = mapping[csvColumn] || mapping[csvColumn.toLowerCase()];
      if (jurorField) {
        // Type conversion
        if (jurorField === 'age') {
          mappedData[jurorField] = value ? parseInt(value, 10) : null;
        } else {
          mappedData[jurorField] = value || null;
        }
      }
    }

    return mappedData;
  }

  /**
   * Validate a mapped juror row
   */
  private validateRow(row: Record<string, any>, rowIndex: number): string | null {
    // Required fields
    if (!row.firstName || !row.lastName) {
      return `Row ${rowIndex + 1}: Missing required fields (firstName, lastName)`;
    }

    // Age validation
    if (row.age && (row.age < 18 || row.age > 120)) {
      return `Row ${rowIndex + 1}: Invalid age (${row.age})`;
    }

    return null;
  }

  /**
   * Import jurors from CSV
   */
  async importFromCSV(config: BatchImportConfig): Promise<BatchImportResult> {
    const startTime = Date.now();
    console.log(`[BatchImport] Starting import: ${config.fileName}`);

    // Create batch import record
    const batchImport = await this.prisma.batchImport.create({
      data: {
        panelId: config.panelId,
        uploadedBy: config.uploadedBy,
        fileName: config.fileName,
        autoSearch: config.autoSearch || false,
        venueId: config.venueId,
        columnMapping: config.columnMapping || {},
        status: 'processing',
        startedAt: new Date(),
      },
    });

    console.log(`[BatchImport] Created batch record: ${batchImport.id}`);

    try {
      // Parse CSV
      const rows = this.parseCSV(config.csvContent);
      const totalRows = rows.length;

      console.log(`[BatchImport] Parsed ${totalRows} rows`);

      // Update total rows count
      await this.prisma.batchImport.update({
        where: { id: batchImport.id },
        data: { totalRows },
      });

      const errors: Array<{ row: number; error: string }> = [];
      const importedJurorIds: string[] = [];
      let successfulRows = 0;
      let failedRows = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          // Map CSV columns to juror fields
          const mappedData = this.mapRow(row, config.columnMapping);

          // Validate row
          const validationError = this.validateRow(mappedData, i);
          if (validationError) {
            errors.push({ row: i + 1, error: validationError });
            failedRows++;
            continue;
          }

          // Create juror
          const juror = await this.prisma.juror.create({
            data: {
              panelId: config.panelId,
              jurorNumber: mappedData.jurorNumber,
              firstName: mappedData.firstName,
              lastName: mappedData.lastName,
              age: mappedData.age,
              occupation: mappedData.occupation,
              employer: mappedData.employer,
              city: mappedData.city,
              zipCode: mappedData.zipCode,
              venueId: config.venueId,
              source: 'csv_import',
              status: 'available',
            },
          });

          importedJurorIds.push(juror.id);
          successfulRows++;

          console.log(`[BatchImport] Created juror ${i + 1}/${totalRows}: ${juror.firstName} ${juror.lastName}`);

          // Trigger search if autoSearch is enabled
          if (config.autoSearch && this.searchOrchestrator) {
            console.log(`[BatchImport] Triggering search for juror: ${juror.id}`);

            // Create search job
            const searchJob = await this.prisma.searchJob.create({
              data: {
                jurorId: juror.id,
                status: 'queued',
                searchQuery: {
                  firstName: juror.firstName,
                  lastName: juror.lastName,
                  age: juror.age,
                  city: juror.city,
                  zipCode: juror.zipCode,
                  occupation: juror.occupation,
                  employer: juror.employer,
                  venueId: config.venueId,
                },
                sourcesSearched: [],
              },
            });

            // Execute search asynchronously (don't await to avoid blocking)
            this.executeSearch(juror.id, searchJob.id).catch((error) => {
              console.error(`[BatchImport] Search failed for juror ${juror.id}:`, error);
            });
          }

          // Update progress
          await this.prisma.batchImport.update({
            where: { id: batchImport.id },
            data: {
              processedRows: i + 1,
              successfulRows,
              failedRows,
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ row: i + 1, error: errorMessage });
          failedRows++;
          console.error(`[BatchImport] Error processing row ${i + 1}:`, error);
        }
      }

      // Mark batch as completed
      await this.prisma.batchImport.update({
        where: { id: batchImport.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          importedJurors: importedJurorIds,
          errors,
          processedRows: totalRows,
          successfulRows,
          failedRows,
        },
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`[BatchImport] Completed in ${elapsedMs}ms: ${successfulRows} successful, ${failedRows} failed`);

      return {
        batchId: batchImport.id,
        totalRows,
        successfulRows,
        failedRows,
        errors,
        importedJurorIds,
      };
    } catch (error) {
      // Mark batch as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.batchImport.update({
        where: { id: batchImport.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage,
        },
      });

      console.error(`[BatchImport] Failed:`, error);
      throw error;
    }
  }

  /**
   * Execute search for a juror (called asynchronously)
   */
  private async executeSearch(jurorId: string, searchJobId: string): Promise<void> {
    if (!this.searchOrchestrator) {
      throw new Error('Search orchestrator not configured');
    }

    try {
      // Update search job status
      await this.prisma.searchJob.update({
        where: { id: searchJobId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      });

      // Get juror data
      const juror = await this.prisma.juror.findUnique({
        where: { id: jurorId },
      });

      if (!juror) {
        throw new Error('Juror not found');
      }

      // Execute search
      const result = await this.searchOrchestrator.searchJuror(juror.id, {
        firstName: juror.firstName,
        lastName: juror.lastName,
        age: juror.age || undefined,
        city: juror.city || undefined,
        zipCode: juror.zipCode || undefined,
        occupation: juror.occupation || undefined,
      });

      const candidates = result.candidates;

      // Update search job
      await this.prisma.searchJob.update({
        where: { id: searchJobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          candidateCount: candidates.length,
          sourcesSearched: result.sourcesSearched,
        },
      });

      console.log(`[BatchImport] Search completed for juror ${jurorId}: ${candidates.length} candidates found`);
    } catch (error) {
      // Update search job as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.searchJob.update({
        where: { id: searchJobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage,
        },
      });

      throw error;
    }
  }

  /**
   * Get batch import status
   */
  async getBatchStatus(batchId: string) {
    return this.prisma.batchImport.findUnique({
      where: { id: batchId },
      include: {
        panel: {
          select: {
            id: true,
            caseId: true,
            panelDate: true,
          },
        },
      },
    });
  }

  /**
   * Get all batch imports for a panel
   */
  async getBatchImportsForPanel(panelId: string) {
    return this.prisma.batchImport.findMany({
      where: { panelId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

/**
 * Base interface for all data source adapters
 */

import { DataSourceMatch } from '../services/confidence-scorer';

export interface SearchParams {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  age?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  occupation?: string;
}

export interface DataSourceAdapter {
  readonly name: string;
  readonly tier: number; // 1 = <100ms, 2 = 1-3s, 3 = 2-5s, 4 = 5-30s

  /**
   * Search for potential matches
   */
  search(params: SearchParams): Promise<DataSourceMatch[]>;

  /**
   * Health check for the data source
   */
  isAvailable(): Promise<boolean>;
}

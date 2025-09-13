/**
 * Utility functions for options data processing
 */

import { promises as fs } from 'fs';
import {
  RawOptionContract,
  ProcessedOptionContract,
  ValidationResult,
  ProcessingError,
  CallPutType,
  ProcessedCallPutType,
  CONFIG,
  MemoryUsage,
  PerformanceMetrics,
} from './types';

/**
 * Normalize call/put type to consistent format
 */
export function normalizeCallPutType(type: CallPutType): ProcessedCallPutType {
  const normalized = type.toLowerCase().trim();
  if (normalized === 'c' || normalized === 'call') return 'call';
  if (normalized === 'p' || normalized === 'put') return 'put';
  throw new Error(`Invalid call/put type: ${type}`);
}

/**
 * Validate and clean a single option contract
 */
export function validateContract(raw: RawOptionContract): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical fields
  if (!raw.act_symbol?.trim() || !raw.date || !raw.expiration) {
    errors.push('Missing critical fields: symbol, date, or expiration');
    return { isValid: false, errors, warnings };
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate data types and ranges
  const strike = Number(raw.strike);
  const bid = Number(raw.bid);
  const ask = Number(raw.ask);

  if (isNaN(strike) || strike <= 0) {
    errors.push(`Invalid strike price: ${raw.strike}`);
  }

  if (isNaN(bid) || bid < 0) {
    errors.push(`Invalid bid: ${raw.bid}`);
  }

  if (isNaN(ask) || ask < 0) {
    errors.push(`Invalid ask: ${raw.ask}`);
  }

  // Check bid/ask spread reasonableness
  if (bid > 0 && ask > 0 && bid >= ask) {
    warnings.push(`Bid (${bid}) >= Ask (${ask}), unusual spread`);
  }

  // Check if contract meets minimum criteria
  if (bid === 0 && ask === 0) {
    errors.push(`Contract has no bid or ask price`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate date format
  if (!isValidDate(raw.date) || !isValidDate(raw.expiration)) {
    errors.push('Invalid date format');
    return { isValid: false, errors, warnings };
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  let type: ProcessedCallPutType;
  try {
    type = normalizeCallPutType(raw.call_put as CallPutType);
  } catch {
    errors.push(`Invalid call/put type: ${raw.call_put}`);
    return { isValid: false, errors, warnings };
  }

  const DECIMAL_MULTIPLIER = 10 ** CONFIG.DECIMAL_PRECISION;

  // Create cleaned contract
  const cleanedData: ProcessedOptionContract = {
    date: raw.date.trim(),
    symbol: raw.act_symbol.trim().toUpperCase(),
    expiration: raw.expiration.trim(),
    strike: Math.round(strike * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    type,
    bid: Math.round(bid * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    ask: Math.round(ask * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    volume: Math.max(0, Number(raw.vol) || 0),
    delta: Math.round((Number(raw.delta) || 0) * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    gamma: Math.round((Number(raw.gamma) || 0) * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    theta: Math.round((Number(raw.theta) || 0) * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    vega: Math.round((Number(raw.vega) || 0) * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
    rho: Math.round((Number(raw.rho) || 0) * DECIMAL_MULTIPLIER) / DECIMAL_MULTIPLIER,
  };

  return { isValid: true, errors, warnings, cleanedData };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return false;
  }

  const year = +parts[0]!;
  const month = +parts[1]!;
  const day = +parts[2]!;

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Write JSON file with error handling
 */
export async function writeJsonFile(
  filePath: string,
  buffer: Buffer<ArrayBuffer>
): Promise<{ size: number }> {
  // Check file size limit
  if (buffer.length > CONFIG.MAX_FILE_SIZE) {
    throw new Error(`File too large: ${buffer.length} bytes > ${CONFIG.MAX_FILE_SIZE} bytes`);
  }

  try {
    await fs.writeFile(filePath, buffer);
    return { size: buffer.length };
  } catch (error) {
    throw new Error(
      `Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Read and parse CSV file
 */
export async function readCsvFile(filePath: string): Promise<RawOptionContract[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseCsv(content);
  } catch (error) {
    throw new Error(
      `Failed to read CSV file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Simple CSV parser for options data
 */
export function parseCsv(content: string): RawOptionContract[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const headers = lines[0]!.split(',').map(h => h.trim().replace(/"/g, ''));
  const data: RawOptionContract[] = [];

  const numericHeaders = new Set([
    'strike',
    'bid',
    'ask',
    'vol',
    'delta',
    'gamma',
    'theta',
    'vega',
    'rho',
  ]);

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(',').map(v => v.trim().replace(/"/g, ''));

    if (values.length !== headers.length) {
      console.warn(
        `Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`
      );
      continue;
    }

    const row = {} as RawOptionContract;
    headers.forEach((header, index) => {
      const value = values[index];
      const key = header as keyof RawOptionContract;

      // Convert numeric fields
      if (numericHeaders.has(header)) {
        (row[key] as number) = value === '' ? 0 : Number(value);
      } else {
        (row[key] as string) = value + '';
      }
    });

    data.push(row as RawOptionContract);
  }

  return data;
}

/**
 * Group contracts by symbol
 */
export function groupBySymbol(
  contracts: ProcessedOptionContract[]
): Map<string, ProcessedOptionContract[]> {
  const grouped = new Map<string, ProcessedOptionContract[]>();

  // First pass: group without sorting
  for (const contract of contracts) {
    const symbol = contract.symbol;
    let symbolContracts = grouped.get(symbol);

    if (!symbolContracts) {
      symbolContracts = [];
      grouped.set(symbol, symbolContracts);
    }

    symbolContracts.push(contract);
  }

  // Second pass: sort each group (only when needed)
  for (const contracts of grouped.values()) {
    // Only sort if more than one contract
    if (contracts.length > 1) {
      contracts.sort(compareContracts);
    }
  }

  return grouped;
}

function compareContracts(a: ProcessedOptionContract, b: ProcessedOptionContract): number {
  // Primary: expiration date
  if (a.expiration !== b.expiration) {
    return a.expiration < b.expiration ? -1 : 1;
  }

  // Secondary: type (calls before puts)
  if (a.type !== b.type) {
    return a.type === 'call' ? -1 : 1;
  }

  // Tertiary: strike price
  return a.strike - b.strike;
}

/**
 * Create processing error
 */
export function createError(
  type: ProcessingError['type'],
  message: string,
  context?: unknown,
  row?: number,
  symbol?: string
): ProcessingError {
  return {
    type,
    message,
    context,
    timestamp: new Date().toISOString(),
    row,
    symbol,
  };
}

/**
 * Convert JSON to Stringified Buffer for I/O operations
 */
export function convertJsonToBuffer(data: unknown): Buffer<ArrayBuffer> {
  const jsonString = JSON.stringify(data);
  return Buffer.from(jsonString, 'utf8');
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemoryUsage {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
  };
}

/**
 * Get unique values from array
 */
export function getUniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Get strike price range
 */
export function getStrikeRange(contracts: ProcessedOptionContract[]): {
  min: number;
  max: number;
} {
  if (contracts.length === 0) return { min: 0, max: 0 };

  let min = Infinity;
  let max = -Infinity;

  for (const contract of contracts) {
    if (contract.strike < min) min = contract.strike;
    if (contract.strike > max) max = contract.strike;
  }

  return { min, max };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  const memoryFreed = metrics.memoryBefore.heapUsed - metrics.memoryAfter.heapUsed;
  const memoryFreedFormatted = formatFileSize(Math.abs(memoryFreed));

  let memoryStatus = 'Freed';
  if (memoryFreed < 0) {
    memoryStatus = 'Gained';
  }

  console.log('🚀 Performance Metrics:');
  console.log(`   Processing Time: ${metrics.processingTime}ms`);
  console.log(`   File Write Time: ${metrics.fileWriteTime}ms`);
  console.log(`   Validation Time: ${metrics.validationTime}ms`);
  console.log(`   Peak Memory: ${formatFileSize(metrics.peakMemory)}`);
  console.log(`   Memory Used: ${formatFileSize(metrics.memoryAfter.heapUsed)}`);
  console.log(`   Memory ${memoryStatus}: ${memoryFreedFormatted}`);
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): {
  dataInputPath: string;
  apiOutputPath: string;
} {
  const dataInputPath = process.env.DATA_INPUT_PATH;
  const apiOutputPath = process.env.API_OUTPUT_PATH;

  if (!dataInputPath) {
    throw new Error('DATA_INPUT_PATH environment variable is required');
  }

  if (!apiOutputPath) {
    throw new Error('API_OUTPUT_PATH environment variable is required');
  }

  return { dataInputPath, apiOutputPath };
}

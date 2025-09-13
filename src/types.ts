/**
 * Core data types for options chain processing
 */

export interface RawOptionContract {
  date: string;
  act_symbol: string;
  expiration: string;
  strike: number;
  call_put: string;
  bid: number;
  ask: number;
  vol: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface ProcessedOptionContract {
  date: string;
  symbol: string;
  expiration: string;
  strike: number;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  volume: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface SymbolData {
  symbol: string;
  contracts: ProcessedOptionContract[];
  contractCount: number;
  expirations: string[];
  strikeRange: {
    min: number;
    max: number;
  };
  lastUpdated: string;
}

export interface ApiMetadata {
  dataDate: string;
  lastUpdated: string;
  symbolCount: number;
  totalContracts: number;
  processing: {
    startTime: string;
    endTime: string;
    duration: number; // milliseconds
    errors: string[];
    warnings: string[];
  };
  coverage: {
    calls: number;
    puts: number;
    symbolsWithData: number;
  };
}

export interface ProcessingConfig {
  dataInputPath: string;
  apiOutputPath: string;
  minBidAsk?: number;
  maxFileSize?: number; // bytes
  parallel?: boolean;
  maxConcurrency?: number;
}

export interface ProcessingStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uniqueSymbols: number;
  processingTime: number;
  filesSaved: number;
  errors: ProcessingError[];
  warnings: string[];
}

export interface ProcessingError {
  type: 'validation' | 'file_read' | 'file_write' | 'data_parse' | 'memory' | 'unknown';
  message: string;
  context?: unknown;
  timestamp: string;
  row?: number | undefined;
  symbol?: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: ProcessedOptionContract;
}

export interface SymbolProcessingResult {
  symbol: string;
  success: boolean;
  contractCount: number;
  fileSize: number;
  filePath: string;
  error?: string;
  processingTime: number;
}

// Configuration constants
export const CONFIG = {
  MIN_BID_ASK: 0, // Only process contracts with bid > 0 OR ask > 0
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per symbol file
  MAX_CONCURRENCY: Math.min(16, require('os').cpus().length), // CPU-aware concurrency
  DATE_FORMAT: 'YYYY-MM-DD',
  DECIMAL_PRECISION: 4,
  OUTPUT_FILES: {
    SYMBOLS: 'symbols.json',
    METADATA: 'metadata.json',
    SYMBOLS_DIR: 'symbols',
  },
  BATCH_SIZE: 5000,
} as const;

// Utility types
export type CallPutType = 'C' | 'P' | 'call' | 'put' | 'Call' | 'Put';
export type ProcessedCallPutType = 'call' | 'put';

export interface MemoryUsage {
  rss: number; // Resident Set Size
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface PerformanceMetrics {
  memoryBefore: MemoryUsage;
  memoryAfter: MemoryUsage;
  peakMemory: number;
  gcCollections: number;
  processingTime: number;
  fileWriteTime: number;
  validationTime: number;
}

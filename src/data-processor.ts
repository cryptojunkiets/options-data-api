/**
 * Main data processor for options chain data
 */

import { join, dirname } from 'path';
import {
  RawOptionContract,
  ProcessedOptionContract,
  SymbolData,
  ApiMetadata,
  ProcessingStats,
  SymbolProcessingResult,
  CONFIG,
  PerformanceMetrics,
} from './types';
import {
  readCsvFile,
  validateContract,
  groupBySymbol,
  writeJsonFile,
  ensureDir,
  createError,
  convertJsonToBuffer,
  getMemoryUsage,
  getUniqueValues,
  getStrikeRange,
  logPerformanceMetrics,
  validateEnvironment,
  retry,
} from './utils';

export class OptionsDataProcessor {
  private dataInputPath: string;
  private apiOutputPath: string;
  private stats: ProcessingStats;
  private startTime: number;

  constructor() {
    const env = validateEnvironment();
    this.dataInputPath = env.dataInputPath;
    this.apiOutputPath = env.apiOutputPath;

    this.stats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      uniqueSymbols: 0,
      processingTime: 0,
      filesSaved: 0,
      errors: [],
      warnings: [],
    };

    this.startTime = Date.now();
  }

  /**
   * Main processing entry point
   */
  async process(): Promise<void> {
    console.log('🚀 Starting options data processing...');
    console.log(`📁 Input: ${this.dataInputPath}`);
    console.log(`📤 Output: ${this.apiOutputPath}`);

    const performanceStart = Date.now();
    const memoryBefore = getMemoryUsage();

    try {
      // Step 1: Read and validate data
      console.log('\n📖 Reading CSV data...');
      const rawData = await this.readInputData();

      // Step 2: Validate and clean contracts
      console.log('\n🔍 Validating contracts...');
      const validationStart = Date.now();
      const validContracts = await this.validateData(rawData);
      const validationTime = Date.now() - validationStart;

      // Step 3: Group by symbol and process
      console.log('\n📊 Processing symbols...');
      const symbolGroups = groupBySymbol(validContracts);
      this.stats.uniqueSymbols = symbolGroups.size;

      // Step 4: Ensure output directory exists
      await ensureDir(this.apiOutputPath);
      await ensureDir(join(this.apiOutputPath, CONFIG.OUTPUT_FILES.SYMBOLS_DIR));

      // Step 5: Process symbols (parallel or sequential)
      const processingResults = await this.processSymbols(symbolGroups);

      // Step 6: Generate API files
      console.log('\n📝 Generating API files...');
      const fileWriteStart = Date.now();
      await this.generateApiFiles(symbolGroups, processingResults);
      const fileWriteTime = Date.now() - fileWriteStart;

      // Step 7: Final statistics and cleanup
      this.stats.processingTime = Date.now() - this.startTime;
      const memoryAfter = getMemoryUsage();

      const performanceMetrics: PerformanceMetrics = {
        memoryBefore,
        memoryAfter,
        peakMemory: Math.max(memoryBefore.heapUsed, memoryAfter.heapUsed),
        gcCollections: 0, // Would need gc-stats for this
        processingTime: Date.now() - performanceStart,
        fileWriteTime,
        validationTime,
      };

      this.logResults(performanceMetrics);

      if (this.stats.errors.length > 0) {
        console.warn(`⚠️  Processing completed with ${this.stats.errors.length} errors`);
        this.stats.errors.slice(0, 5).forEach(error => {
          console.warn(`   ${error.type}: ${error.message}`);
        });
        if (this.stats.errors.length > 5) {
          console.warn(`   ... and ${this.stats.errors.length - 5} more errors`);
        }
      } else {
        console.log('✅ Processing completed successfully!');
      }
    } catch (error) {
      const processingError = createError(
        'unknown',
        `Fatal processing error: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
      this.stats.errors.push(processingError);
      console.error('❌ Processing failed:', processingError.message);
      throw error;
    }
  }

  /**
   * Read and parse input CSV data
   */
  private async readInputData(): Promise<RawOptionContract[]> {
    try {
      const rawData = await readCsvFile(this.dataInputPath);
      this.stats.totalRows = rawData.length;
      console.log(`📊 Loaded ${rawData.length} rows from CSV`);
      return rawData;
    } catch (error) {
      const processingError = createError(
        'file_read',
        `Failed to read input data: ${error instanceof Error ? error.message : String(error)}`,
        { filePath: this.dataInputPath }
      );
      this.stats.errors.push(processingError);
      throw error;
    }
  }

  /**
   * Validate raw data and return clean contracts
   */
  private async validateData(rawData: RawOptionContract[]): Promise<ProcessedOptionContract[]> {
    const validContracts: ProcessedOptionContract[] = [];
    const batchSize = CONFIG.BATCH_SIZE;
    const totalRows = rawData.length;

    const updateThreshold = batchSize * 4;
    const gcThreshold = batchSize * 8;

    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);
      const batchResults: ProcessedOptionContract[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowInfo = i + j + 1;

        if (row === undefined) {
          this.stats.invalidRows++;
          this.stats.errors.push(
            createError('validation', 'Row is undefined', null, rowInfo, 'N/A')
          );
          continue; // Skip to the next iteration
        }

        const result = validateContract(row);

        if (result.warnings.length > 0) {
          this.stats.warnings.push(...result.warnings.map(w => `Row ${rowInfo}: ${w}`));
        }

        if (result.isValid && result.cleanedData) {
          this.stats.validRows++;
          batchResults.push(result.cleanedData);
        } else {
          this.stats.invalidRows++;
          result.errors.forEach(error => {
            this.stats.errors.push(createError('validation', error, row, rowInfo, row.act_symbol));
          });
        }
      }

      validContracts.push(...batchResults);

      // Progress update for large datasets
      if (i % updateThreshold === 0) {
        console.log(`   Validated ${Math.min(i + batchSize, totalRows)} / ${totalRows} rows`);
      }

      // Periodic garbage collection hint
      if (i % gcThreshold === 0 && global.gc) {
        global.gc();
      }
    }

    console.log(
      `✅ Validation complete: ${validContracts.length} valid contracts from ${totalRows} rows`
    );
    console.log(`   Invalid rows: ${this.stats.invalidRows}`);
    console.log(`   Warnings: ${this.stats.warnings.length}`);

    return validContracts;
  }

  /**
   * Process symbols in parallel or sequential batches
   */
  private async processSymbols(
    symbolGroups: Map<string, ProcessedOptionContract[]>
  ): Promise<SymbolProcessingResult[]> {
    const symbols = Array.from(symbolGroups.keys());
    const results: SymbolProcessingResult[] = [];
    const concurrency = Math.min(CONFIG.MAX_CONCURRENCY, symbols.length);
    const updateThreshold = concurrency * 25;

    console.log(`📈 Processing ${symbols.length} symbols with concurrency: ${concurrency}`);

    // Process in batches to control memory usage
    for (let i = 0; i < symbols.length; i += concurrency) {
      // Progress update
      if (i % updateThreshold === 0 && i > 0) {
        console.log(`   Processed ${Math.min(i, symbols.length)} / ${symbols.length} symbols`);
      }

      const batch = symbols.slice(i, i + concurrency);
      const batchPromises = batch.map(symbol =>
        this.processSymbol(symbol, symbolGroups.get(symbol)!)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const symbol = batch[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const error = createError(
            'file_write',
            `Failed to process symbol ${symbol}: ${result.reason}`,
            result.reason,
            undefined,
            symbol
          );
          this.stats.errors.push(error);

          // Add a failed result for tracking
          results.push({
            symbol: symbol!,
            success: false,
            contractCount: 0,
            fileSize: 0,
            filePath: '',
            error: error.message,
            processingTime: 0,
          });
        }
      });

      // Force garbage collection between batches if available
      if (global.gc) {
        global.gc();
      }
    }

    const successfulResults = results.filter(r => r.success);
    console.log(
      `✅ Symbol processing complete: ${successfulResults.length} / ${results.length} successful`
    );

    return results;
  }

  /**
   * Process a single symbol
   */
  private async processSymbol(
    symbol: string,
    contracts: ProcessedOptionContract[]
  ): Promise<SymbolProcessingResult> {
    const startTime = Date.now();

    try {
      // Create symbol data structure
      const symbolData: SymbolData = {
        symbol,
        contracts,
        contractCount: contracts.length,
        expirations: getUniqueValues(contracts.map(c => c.expiration)).sort(),
        strikeRange: getStrikeRange(contracts),
        lastUpdated: new Date().toISOString(),
      };

      // Write symbol file
      const filePath = join(this.apiOutputPath, CONFIG.OUTPUT_FILES.SYMBOLS_DIR, `${symbol}.json`);
      await ensureDir(dirname(filePath));

      // Convert JSON to buffer
      const fileBuffer = convertJsonToBuffer(symbolData);
      const writeResult = await retry(async () => {
        return await writeJsonFile(filePath, fileBuffer);
      });

      this.stats.filesSaved++;

      return {
        symbol,
        success: true,
        contractCount: contracts.length,
        fileSize: writeResult.size,
        filePath,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(
        `Symbol ${symbol} processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate API index files
   */
  private async generateApiFiles(
    symbolGroups: Map<string, ProcessedOptionContract[]>,
    processingResults: SymbolProcessingResult[]
  ): Promise<void> {
    const successfulResults = processingResults.filter(r => r.success);

    // Generate symbols.json
    const symbols = Array.from(symbolGroups.keys()).sort();
    const symbolsPath = join(this.apiOutputPath, CONFIG.OUTPUT_FILES.SYMBOLS);
    await ensureDir(dirname(symbolsPath));
    const symbolFileBuffer = convertJsonToBuffer(symbols);
    await writeJsonFile(symbolsPath, symbolFileBuffer);
    this.stats.filesSaved++;

    // Generate metadata.json
    let totalContracts = 0;
    let calls = 0;
    let firstContract = null;

    for (const contracts of symbolGroups.values()) {
      totalContracts += contracts.length;

      for (const contract of contracts) {
        if (contract.type === 'call') {
          calls++;
        }

        if (firstContract === null && contracts.length > 0) {
          firstContract = contracts[0];
        }
      }
    }

    const puts = totalContracts - calls;

    // Get data date from first contract
    const dataDate = (firstContract?.date || new Date().toISOString().split('T')[0])!;

    const metadata: ApiMetadata = {
      dataDate,
      lastUpdated: new Date().toISOString(),
      symbolCount: successfulResults.length,
      totalContracts,
      processing: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        errors: this.stats.errors.map(e => e.message),
        warnings: this.stats.warnings.slice(0, 100), // Limit warnings to prevent large files
      },
      coverage: {
        calls,
        puts,
        symbolsWithData: successfulResults.length,
      },
    };

    const metadataPath = join(this.apiOutputPath, CONFIG.OUTPUT_FILES.METADATA);
    await ensureDir(dirname(metadataPath));
    const metadataFileBuffer = convertJsonToBuffer(metadata);
    await writeJsonFile(metadataPath, metadataFileBuffer);
    this.stats.filesSaved++;

    console.log(`📊 Generated API files:`);
    console.log(`   ${CONFIG.OUTPUT_FILES.SYMBOLS}: ${symbols.length} symbols`);
    console.log(`   ${CONFIG.OUTPUT_FILES.METADATA}: Complete metadata`);
    console.log(`   ${CONFIG.OUTPUT_FILES.SYMBOLS_DIR}/: ${successfulResults.length} symbol files`);
  }

  /**
   * Log final results and statistics
   */
  private logResults(performanceMetrics: PerformanceMetrics): void {
    console.log('\n📈 Processing Results:');
    console.log(`   Total Rows Processed: ${this.stats.totalRows.toLocaleString()}`);
    console.log(`   Valid Contracts: ${this.stats.validRows.toLocaleString()}`);
    console.log(`   Invalid Rows: ${this.stats.invalidRows.toLocaleString()}`);
    console.log(`   Unique Symbols: ${this.stats.uniqueSymbols}`);
    console.log(`   Files Generated: ${this.stats.filesSaved}`);
    console.log(`   Processing Time: ${this.stats.processingTime}ms`);

    if (this.stats.warnings.length > 0) {
      console.log(`   Warnings: ${this.stats.warnings.length}`);
    }

    if (this.stats.errors.length > 0) {
      console.log(`   Errors: ${this.stats.errors.length}`);
    }

    logPerformanceMetrics(performanceMetrics);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const processor = new OptionsDataProcessor();
    await processor.process();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error instanceof Error ? error.message : error + '');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Run if this file is executed directly
if (require.main === module) {
  main();
}

import { join } from 'path';
import {
  // ProcessedOptionContract,
  // SymbolData,
  // ApiMetadata,
  // ProcessingStats,
  // FileWriteResult,
  // SymbolProcessingResult,
  CONFIG,
  // PerformanceMetrics,
} from './types';
import { groupBySymbol, ensureDir, validateEnvironment } from './utils';

import { OptionsDataProcessor } from './data-processor';

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const env = validateEnvironment();
    const processor = new OptionsDataProcessor();
    const rawData = await processor.readInputData();
    const validContracts = await processor.validateData(rawData);
    const symbolGroups = groupBySymbol(validContracts);
    await ensureDir(env.apiOutputPath);
    await ensureDir(join(env.apiOutputPath, CONFIG.OUTPUT_FILES.SYMBOLS_DIR));
    const processingResults = await processor.processSymbols(symbolGroups);
    await processor.generateApiFiles(symbolGroups, processingResults);
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error instanceof Error ? error.message : error + '');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

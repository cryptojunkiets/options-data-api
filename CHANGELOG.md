# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.10] - 2025-09-13

### 🚀 Performance

- **Data Processing Engine**
  - **CPU-Aware Concurrency**: Updated MAX_CONCURRENCY to dynamically adjust based on available CPU cores (`Math.min(16, require('os').cpus().length)`) instead of fixed limit of 10
  - **Batch Size Optimization**: Increased BATCH_SIZE from 1000 to 5000 rows for more efficient batch processing
  - **Memory-Efficient Validation**: Restructured validation loop to process batches with immediate garbage collection hints every 8 batches
  - **Progress Reporting Optimization**: Reduced progress update frequency to prevent console spam (every 4 batches for validation, every 25*concurrency for symbol processing)

- **GitHub Actions Workflow**
  - **Garbage Collection Control**: Added `--expose-gc` flag to NODE_OPTIONS to enable explicit garbage collection control for memory-intensive operations

- **Contract Validation Improvements**
  - **Early Exit Validation**: Implemented early return for critical field validation to avoid unnecessary processing
  - **Streamlined Field Validation**: Consolidated validation logic to reduce redundant checks and improve validation speed
  - **Optimized Decimal Precision**: Replaced repeated `toFixed()` calls with single decimal multiplier calculation for better performance
  - **Reduced Memory Allocations**: Eliminated REQUIRED_FIELDS array iteration in favor of direct field checks

- **Symbol Grouping Optimization**
  - **Two-Pass Grouping Algorithm**: Split grouping into separate grouping and sorting phases to avoid sorting single-contract symbols
  - **Optimized Contract Comparison**: Implemented specialized `compareContracts` function with string comparison shortcuts
  - **Conditional Sorting**: Only sort symbol groups when they contain multiple contracts

- **JSON Processing Enhancement**
  - **Simplified Buffer Conversion**: Removed unnecessary JSON formatting (removed `null, 2` prettification) for smaller file sizes and faster I/O

### 🔧 Fixed

- **Type Safety**: Improved non-null assertion safety in validation and parsing logic
- **Error Handling**: Enhanced error context preservation throughout the validation pipeline
- **Memory Management**: Added strategic garbage collection hints to prevent memory buildup during large dataset processing

### 📝 Changed

- **Configuration Updates**: Moved from hardcoded constants to dynamic system-aware configuration
- **Code Organization**: Improved separation of concerns between validation, grouping, and processing phases

## [1.0.9] - 2025-09-07

### 🔧 Fixed

- **GitHub Actions Workflow**
  - **Node.js Options Configuration**: Removed `--optimize-for-size` flag from NODE_OPTIONS due to compatibility error ("--optimize-for-size is not allowed in NODE_OPTIONS")
  - **Memory Configuration**: Retained `--max-old-space-size=4096` flag for heap memory optimization while removing unsupported optimization flag
  - **Workflow Stability**: Fixed Node.js process exit code 9 error that was preventing successful workflow execution

## [1.0.8] - 2025-09-07

### 🚀 Performance

- **GitHub Actions Workflow**
  - **Node.js Memory Optimization**: Added Node.js heap memory limit configuration (`--max-old-space-size=4096`) and memory optimization flags (`--optimize-for-size`) for better handling of large datasets
  - **Parallel Processing**: Configured UV thread pool size to 8 threads (`UV_THREADPOOL_SIZE=8`) to enable better parallel processing performance
  - **Streaming Data Processing**: Updated workflow to use streaming approach for improved memory efficiency during data processing

### 🧹 Removed

- **GitHub Actions Workflow**
  - **DOLT_VERSION Variable**: Removed misleading `DOLT_VERSION` variable and all references since Dolt installation always uses the latest version
  - **Version-Specific Caching**: Updated Dolt installation cache key from version-specific to `dolt-latest-` for accurate caching behavior

## [1.0.7] - 2025-09-05

### 🔧 Fixed

- **GitHub Actions Workflow**
  - **Commit Message Syntax**: Fixed shell script syntax error in "Selective commit and push" step caused by unmatched quotes in multi-line commit message
  - **String Quoting**: Corrected quote pairing in git commit command that was causing "unexpected EOF while looking for matching quote" error

### 🧹 Removed

- **Development Files**
  - **Test File Cleanup**: Removed `src/test.ts` file that was used for local development testing

## [1.0.6] - 2025-09-05

### 🔧 Fixed

- **GitHub Actions Workflow**
  - **Environment Variable Consistency**: Fixed inconsistent usage of `~` and `$HOME` environment variables in Dolt installation and PATH configuration
  - **Cross-Platform Compatibility**: Standardized on `$HOME` variable usage for improved reliability across different runner operating systems
  - **Cache Path Alignment**: Ensured cache path and PATH export use consistent environment variable syntax

## [1.0.5] - 2025-09-05

### 🔧 Fixed

- **GitHub Actions Workflow**
 - **Dolt Command Availability**: Fixed issue where `dolt` command was not available in the same step as PATH modification
 - **Step Separation**: Separated Dolt PATH setup and usage into distinct workflow steps for proper command availability
 - **Workflow Reliability**: Improved workflow execution reliability by ensuring proper PATH propagation between steps
 - **Reverted Invalid Fix**: Removed ineffective inline PATH export and verification approaches from previous version

## [1.0.4] - 2025-09-05

### 🔧 Fixed

- **GitHub Actions Dolt PATH Issue**
  - **Cached Binary PATH**: Fixed "dolt: command not found" error when using cached Dolt installations
  - **Explicit PATH Export**: Added `export PATH="$HOME/.dolt/bin:$PATH"` to all steps that use Dolt commands
  - **Cross-Step Compatibility**: Ensured Dolt binary is available regardless of cache hit/miss status
  - **Verification Enhancement**: Combined PATH setup with immediate verification to catch issues early

## [1.0.3] - 2025-09-04

### 🚀 Performance

- **GitHub Actions Optimization**
  - **Parallel Job Execution**: Split GitHub Action workflow into parallel jobs to significantly reduce overall execution time
  - **Smart Data Extraction**: Improved options data extraction with "Check-First, then Data" strategy:
    - Fast `COUNT(*)` query to verify data existence on target date
    - Single full data extraction query when data exists
    - Automatic fallback with latest date query and single extraction when target date unavailable
  - **Conditional Processing**: Skip unnecessary work when data is already current
  - **Enhanced Build Performance**: Skip TypeScript build when no source code changes detected
  - **Improved Caching**: Enhanced caching strategy for all build artifacts

### 🔧 Fixed

- **Workflow Configuration**
  - **Dolt Executable Path**: Fixed bug by properly shifting the command to add dolt executable to system PATH

### 📝 Changed

- **Git Workflow Enhancement**
  - **Optimized Git Configuration**: Updated commit and push workflow for improved performance and safety
  - **Safer Push Strategy**: Implemented more robust Git push strategy for better reliability

## [1.0.2] - 2025-09-02

### 🔧 Fixed

- **API Path Configuration**
  - **Documentation URLs**: Fixed API endpoint documentation to reflect correct GitHub Pages URL structure
  - **Base URL**: Removed `/api/` prefix from API documentation since GitHub Pages serves the api directory contents as root
  - **Endpoint Examples**: Updated all curl examples and documentation to use correct paths:
    - `GET /symbols.json` (instead of `/api/symbols.json`)
    - `GET /symbols/{SYMBOL}.json` (instead of `/api/symbols/{SYMBOL}.json`)
    - `GET /metadata.json` (instead of `/api/metadata.json`)
  - **JavaScript References**: Updated client-side fetch calls in documentation to use correct relative paths

### 📝 Changed

- **README Generation**: Updated README template to reflect accurate API endpoint URLs
- **API Documentation**: Corrected all endpoint examples and base URL references

## [1.0.1] - 2025-09-02

### 🔧 Changed

- **Workflow Configuration Updates**
  - **Conditional Logic**: Improved branch-based deployment conditions
  - **Permissions**: Updated workflow permissions for Pages deployment

## [1.0.0] - 2025-08-30

### 🎉 Initial Release

#### Added

- **Core Data Processing Engine**
  - TypeScript-based options chain data processor
  - Parallel symbol processing with configurable concurrency (max 10)
  - Memory-efficient batch processing (1000 rows per batch)
  - Comprehensive data validation and cleaning pipeline
  - Support for all standard options Greeks (delta, gamma, theta, vega, rho)

- **GitHub Actions Automation**
  - Automated daily data updates (weekdays at 3 AM UTC)
  - Manual workflow trigger with custom date selection
  - Dolt database integration for reliable data source
  - Intelligent caching system for faster processing
  - Fresh clone fallback for database corruption recovery

- **API Infrastructure**
  - RESTful JSON API served via GitHub Pages
  - Three main endpoints:
    - `/symbols.json` - List of all available symbols
    - `/symbols/{SYMBOL}.json` - Individual symbol contract data
    - `/metadata.json` - Dataset statistics and metadata
  - Automatic API documentation generation
  - Rate limiting information and usage guidelines

- **Data Quality & Validation**
  - Multi-level data validation (required fields, data types, business rules)
  - Automatic filtering of inactive contracts (bid > 0 OR ask > 0)
  - Data type normalization and precision control (4 decimal places)
  - Comprehensive error reporting and warning system
  - Data integrity checks before publishing

- **Performance & Reliability**
  - Retry logic with exponential backoff for file operations
  - Memory usage monitoring and garbage collection
  - File size limits to comply with GitHub restrictions (50MB per file)
  - Graceful error handling and partial failure recovery
  - Performance metrics logging

- **Monitoring & Observability**
  - Detailed processing statistics and metrics
  - Memory usage tracking and optimization
  - Processing time monitoring
  - Error categorization (validation, file_write, data_parse, memory, unknown)
  - Warning system for non-fatal issues

- **Developer Experience**
  - Complete TypeScript type definitions
  - Comprehensive error messages and logging
  - Development and production build configurations
  - ESLint integration for code quality
  - Modular architecture for easy maintenance

#### Technical Specifications

- **Node.js**: Version 18+ required
- **TypeScript**: Version 5.0+ with strict mode enabled
- **Database**: Dolt database integration
- **Data Source**: `post-no-preference/options` repository
- **Update Frequency**: Weekdays only (Monday-Friday)
- **File Formats**: JSON for API, CSV for data input
- **Hosting**: GitHub Pages (free tier)

#### API Features

- **Data Structure**: Standardized option contract format
- **Symbol Coverage**: All symbols with active trading
- **Greek Values**: Complete options Greeks included
- **Historical Support**: Automatic fallback to latest available data (within 7 days)
- **Metadata Tracking**: Dataset statistics and update timestamps

#### Automation Features

- **Smart Caching**: Database and dependency caching for faster runs
- **Fallback Logic**: Automatic retry with fresh data if cached version fails
- **Data Validation**: Pre-publish verification of all generated files
- **Documentation**: Auto-generated README with current statistics
- **Deployment**: Seamless GitHub Pages deployment on master branch

#### Security & Compliance

- **Input Validation**: Comprehensive sanitization of all input data
- **File Size Limits**: Protection against oversized file generation
- **Error Isolation**: Individual symbol failures don't crash entire process
- **Memory Protection**: Monitoring and cleanup to prevent memory leaks

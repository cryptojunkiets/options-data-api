# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

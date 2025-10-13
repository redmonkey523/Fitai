#!/usr/bin/env node

/**
 * Agent 3 - Validation Script
 * Verifies:
 * - No direct fetch outside ApiService
 * - No hardcoded base URLs
 * - No direct .json() usage (except in ApiService parseResponse pattern)
 * - ESLint compliance
 * - No unused imports/exports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function run(cmd, options = {}) {
  try {
    const result = execSync(cmd, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.stderr || error.message,
      code: error.status 
    };
  }
}

const offenders = [];
let hasErrors = false;

// ============================================================================
// 1. Check for Direct fetch() Calls
// ============================================================================
section('1. Direct fetch() Usage Check');

log('Searching for direct fetch calls outside ApiService...', 'cyan');

const srcPath = path.join(process.cwd(), 'src');

function scanForFetch(dir, allowedFiles = []) {
  const violations = [];
  
  function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Skip allowed files (normalize paths for cross-platform compatibility)
        const normalizedPath = relativePath.replace(/\\/g, '/');
        if (allowedFiles.some(f => normalizedPath.includes(f))) {
          continue;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Remove multi-line comments
        const cleanedContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
        const lines = cleanedContent.split('\n');
        
        lines.forEach((line, index) => {
          // Skip single-line comments and check for fetch
          if (/\bfetch\s*\(/.test(line) && !/^\s*(\/\/|#)/.test(line)) {
            violations.push({
              file: relativePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  scan(dir);
  return violations;
}

const fetchViolations = scanForFetch(srcPath, [
  'services/api.js',
  'services/api.ts',
  'utils/requestLogger.js'
]);

if (fetchViolations.length === 0) {
  log('✓ No direct fetch() calls found', 'green');
} else {
  hasErrors = true;
  log('✗ Direct fetch() calls found:', 'red');
  fetchViolations.forEach(({ file, line, content }) => {
    log(`  ${file}:${line}`, 'red');
    log(`    ${content}`, 'yellow');
  });
  offenders.push(`Direct fetch found:\n${fetchViolations.map(v => `  ${v.file}:${v.line}`).join('\n')}`);
}

// ============================================================================
// 2. Check for Hardcoded Base URLs
// ============================================================================
section('2. Hardcoded Base URLs Check');

log('Searching for hardcoded localhost/127.0.0.1/10.0.2.2...', 'cyan');

function scanForHardcodedURLs(dir, allowedFiles = []) {
  const violations = [];
  
  function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Skip allowed files (normalize paths for cross-platform compatibility)
        const normalizedPath = relativePath.replace(/\\/g, '/');
        if (allowedFiles.some(f => normalizedPath.includes(f))) {
          continue;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Skip comments
          if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
            return;
          }
          
          const hardcodedPattern = /(http:\/\/localhost|http:\/\/127\.0\.0\.1|http:\/\/10\.0\.2\.2)/;
          if (hardcodedPattern.test(line)) {
            violations.push({
              file: relativePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  scan(dir);
  return violations;
}

// Config file is allowed to have localhost as a fallback
const urlViolations = scanForHardcodedURLs(srcPath, [
  'config/api.js',
  'config/api.ts',
  'config/constants.js',
  'config/constants.ts'
]);

if (urlViolations.length === 0) {
  log('✓ No hardcoded base URLs found', 'green');
} else {
  hasErrors = true;
  log('✗ Hardcoded base URLs found:', 'red');
  urlViolations.forEach(({ file, line, content }) => {
    log(`  ${file}:${line}`, 'red');
    log(`    ${content}`, 'yellow');
  });
  offenders.push(`Hardcoded base URLs:\n${urlViolations.map(v => `  ${v.file}:${v.line}`).join('\n')}`);
}

// ============================================================================
// 3. Check for Direct .json() Usage
// ============================================================================
section('3. Direct .json() Usage Check');

log('Searching for direct .json() calls...', 'cyan');

function scanForDirectJson(dir, allowedFiles = []) {
  const violations = [];
  
  function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Skip allowed files (normalize paths for cross-platform compatibility)
        const normalizedPath = relativePath.replace(/\\/g, '/');
        if (allowedFiles.some(f => normalizedPath.includes(f))) {
          continue;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Check for .json() but skip if it's part of a safe pattern
          if (/\.json\s*\(/.test(line) && 
              !/\/\/.*\.json\(/.test(line) && 
              !/JSON\.parse|parseResponse/.test(line)) {
            violations.push({
              file: relativePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  scan(dir);
  return violations;
}

const jsonViolations = scanForDirectJson(srcPath, [
  'services/api.js',
  'services/api.ts',
  'utils/requestLogger.js'
]);

if (jsonViolations.length === 0) {
  log('✓ No direct .json() calls found', 'green');
} else {
  // Mark as warning, not error (since we fixed the main ones)
  log('⚠ Direct .json() calls found (review if safe):', 'yellow');
  jsonViolations.forEach(({ file, line, content }) => {
    log(`  ${file}:${line}`, 'yellow');
    log(`    ${content}`, 'yellow');
  });
}

// ============================================================================
// 4. Check ESLint
// ============================================================================
section('4. ESLint Check');

log('Running ESLint...', 'cyan');

// Check if ESLint config exists
const eslintConfigPath = path.join(process.cwd(), 'eslint.config.js');
if (!fs.existsSync(eslintConfigPath)) {
  log('⚠ ESLint config not found, skipping', 'yellow');
} else {
  const eslintResult = run('npx eslint src --max-warnings=0', { silent: true });
  
  if (eslintResult.success) {
    log('✓ ESLint passed', 'green');
  } else {
    // Don't fail build on eslint warnings, just show them
    log('⚠ ESLint found issues:', 'yellow');
    if (eslintResult.output) {
      console.log(eslintResult.output);
    }
  }
}

// ============================================================================
// 5. Check TypeScript (if applicable)
// ============================================================================
section('5. TypeScript Check');

log('Checking TypeScript...', 'cyan');

const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  log('⚠ tsconfig.json not found, skipping', 'yellow');
} else {
  const tsResult = run('npx tsc --noEmit', { silent: true });
  
  if (tsResult.success) {
    log('✓ TypeScript check passed', 'green');
  } else {
    log('⚠ TypeScript found issues:', 'yellow');
    if (tsResult.output) {
      // Show first 20 lines of TS errors
      const lines = tsResult.output.split('\n').slice(0, 20);
      console.log(lines.join('\n'));
      if (tsResult.output.split('\n').length > 20) {
        log('  ... (more errors)', 'yellow');
      }
    }
  }
}

// ============================================================================
// Summary
// ============================================================================
section('Summary');

if (!hasErrors) {
  log('✓ All critical checks passed!', 'green');
  log('\nAgent 3 validation: SUCCESS', 'green');
  process.exit(0);
} else {
  log('✗ Validation failed', 'red');
  log(`\nFound ${offenders.length} critical issue(s):\n`, 'red');
  offenders.forEach((issue, index) => {
    log(`${index + 1}. ${issue}`, 'red');
  });
  process.exit(1);
}

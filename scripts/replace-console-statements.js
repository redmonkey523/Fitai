#!/usr/bin/env node
/**
 * Script to replace console.* statements with crashReporting service
 * 
 * Usage: node scripts/replace-console-statements.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/*.test.js',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/crashReporting.js', // Don't modify the crashReporting service itself
  '**/scripts/**',
  '**/backend/**', // Handle backend separately if needed
];

// Replacement patterns
const REPLACEMENTS = [
  {
    pattern: /console\.log\((.*?)\);/g,
    replacement: 'crashReporting.log($1);',
    description: 'console.log → crashReporting.log'
  },
  {
    pattern: /console\.error\((.*?)\);/g,
    replacement: 'crashReporting.logError(new Error($1));',
    description: 'console.error → crashReporting.logError'
  },
  {
    pattern: /console\.warn\((.*?)\);/g,
    replacement: 'crashReporting.logMessage($1, \'warning\');',
    description: 'console.warn → crashReporting.logMessage'
  },
  {
    pattern: /console\.info\((.*?)\);/g,
    replacement: 'crashReporting.logMessage($1, \'info\');',
    description: 'console.info → crashReporting.logMessage'
  },
  {
    pattern: /console\.debug\((.*?)\);/g,
    replacement: 'crashReporting.logMessage($1, \'debug\');',
    description: 'console.debug → crashReporting.logMessage'
  },
];

// Check if crashReporting import exists
function hasCrashReportingImport(content) {
  return /import.*crashReporting.*from.*crashReporting/.test(content) ||
         /require\(.*crashReporting.*\)/.test(content);
}

// Add crashReporting import
function addCrashReportingImport(content, filePath) {
  const ext = path.extname(filePath);
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  
  // Check if there are existing imports
  const importMatch = content.match(/^import\s/m);
  
  if (importMatch) {
    // Add after the last import
    const lastImportIndex = content.lastIndexOf('\nimport');
    if (lastImportIndex !== -1) {
      const nextNewline = content.indexOf('\n', lastImportIndex + 1);
      const importStatement = isTypeScript
        ? "import crashReporting from '../services/crashReporting';\n"
        : "import crashReporting from './crashReporting';\n";
      return content.slice(0, nextNewline + 1) + importStatement + content.slice(nextNewline + 1);
    }
  }
  
  // No imports found, add at the top
  const importStatement = isTypeScript
    ? "import crashReporting from '../services/crashReporting';\n\n"
    : "import crashReporting from './crashReporting';\n\n";
  return importStatement + content;
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacementCount = 0;
    
    // Check if file has console statements
    if (!/console\.(log|error|warn|info|debug)/.test(content)) {
      return { modified: false, count: 0 };
    }
    
    // Apply replacements
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        replacementCount += matches.length;
        modified = true;
      }
    });
    
    // Add crashReporting import if not present and file was modified
    if (modified && !hasCrashReportingImport(content)) {
      content = addCrashReportingImport(content, filePath);
    }
    
    // Write back
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${filePath} (${replacementCount} replacements)`);
    }
    
    return { modified, count: replacementCount };
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return { modified: false, count: 0, error: error.message };
  }
}

// Main execution
function main() {
  console.log('🔍 Scanning for console statements...\n');
  
  // Find all JS/TS files in src/
  const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
    ignore: EXCLUDE_PATTERNS,
    absolute: true,
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  let totalModified = 0;
  let totalReplacements = 0;
  const errors = [];
  
  files.forEach(file => {
    const result = processFile(file);
    if (result.modified) {
      totalModified++;
      totalReplacements += result.count;
    }
    if (result.error) {
      errors.push({ file, error: result.error });
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files modified: ${totalModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${errors.length}`);
    errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }
  
  console.log('\n✅ Done!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, REPLACEMENTS };



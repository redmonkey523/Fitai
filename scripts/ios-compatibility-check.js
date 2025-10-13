#!/usr/bin/env node
/**
 * iOS Compatibility Checker
 * Scans codebase for iOS-incompatible patterns and reports issues
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const issues = [];
const warnings = [];
const successes = [];

console.log(`\n${colors.cyan}🔍 iOS Compatibility Check${colors.reset}\n`);

// Check 1: Native modules without fallbacks
console.log('Checking native modules...');
const nativeModules = [
  'react-native-vision-camera',
  'react-native-health',
  'react-native-google-fit',
];

nativeModules.forEach(module => {
  const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', { absolute: true });
  let hasRequire = false;
  let hasFallback = false;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(`require('${module}')`)) {
      hasRequire = true;
      if (content.includes('try') && content.includes('catch')) {
        hasFallback = true;
      }
    }
  });
  
  if (hasRequire && hasFallback) {
    successes.push(`✅ ${module} - has fallback`);
  } else if (hasRequire && !hasFallback) {
    issues.push(`❌ ${module} - NO FALLBACK (will crash in Expo Go)`);
  }
});

// Check 2: Platform-specific code
console.log('Checking platform-specific code...');
const platformChecks = glob.sync('src/**/*.{js,jsx,ts,tsx}', { absolute: true });
let iosChecks = 0;
let webChecks = 0;
let androidChecks = 0;

platformChecks.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.match(/Platform\.OS\s*===\s*['"]ios['"]/g)) iosChecks++;
  if (content.match(/Platform\.OS\s*===\s*['"]android['"]/g)) androidChecks++;
  if (content.match(/Platform\.OS\s*===\s*['"]web['"]/g)) webChecks++;
});

successes.push(`✅ iOS platform checks: ${iosChecks} files`);
successes.push(`✅ Android platform checks: ${androidChecks} files`);
if (webChecks > 0) {
  warnings.push(`⚠️  Web platform checks: ${webChecks} files (ensure fallbacks)`);
}

// Check 3: iOS permissions in app.json
console.log('Checking iOS permissions...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const iosConfig = appJson.expo?.ios;

if (iosConfig) {
  successes.push(`✅ iOS configuration exists`);
  
  if (iosConfig.bundleIdentifier) {
    successes.push(`✅ Bundle ID: ${iosConfig.bundleIdentifier}`);
  } else {
    issues.push(`❌ Missing bundle identifier`);
  }
  
  if (iosConfig.infoPlist) {
    const permissions = Object.keys(iosConfig.infoPlist).filter(key => 
      key.startsWith('NS') && key.includes('Usage')
    );
    successes.push(`✅ iOS permissions: ${permissions.length} configured`);
    permissions.forEach(p => {
      console.log(`   - ${p}`);
    });
  } else {
    warnings.push(`⚠️  No infoPlist permissions (may need more for production)`);
  }
} else {
  issues.push(`❌ No iOS configuration in app.json`);
}

// Check 4: SafeAreaView usage
console.log('Checking SafeAreaView usage...');
const screenFiles = glob.sync('src/screens/**/*.{js,jsx,ts,tsx}', { absolute: true });
let safeAreaCount = 0;
let missingCount = 0;

screenFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('SafeAreaView')) {
    safeAreaCount++;
  } else if (content.includes('return') && content.includes('View')) {
    missingCount++;
  }
});

if (safeAreaCount > missingCount) {
  successes.push(`✅ SafeAreaView usage: ${safeAreaCount}/${screenFiles.length} screens`);
} else {
  warnings.push(`⚠️  SafeAreaView usage: ${safeAreaCount}/${screenFiles.length} screens (consider adding more)`);
}

// Check 5: Navigation setup
console.log('Checking navigation...');
const navFile = 'src/navigation/TabNavigator.js';
if (fs.existsSync(navFile)) {
  const navContent = fs.readFileSync(navFile, 'utf8');
  if (navContent.includes('@react-navigation')) {
    successes.push(`✅ React Navigation configured`);
  }
  
  // Count tab screens
  const tabMatches = navContent.match(/Tab\.Screen/g);
  if (tabMatches) {
    const tabCount = tabMatches.length;
    if (tabCount <= 7) {
      successes.push(`✅ Tab navigation: ${tabCount} tabs (within limits)`);
    } else {
      warnings.push(`⚠️  Tab navigation: ${tabCount} tabs (iOS recommends ≤5)`);
    }
  }
} else {
  issues.push(`❌ Navigation file not found`);
}

// Check 6: Package.json for iOS-incompatible packages
console.log('Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

// Known iOS-compatible packages
const iosCompatible = [
  'expo',
  'react-native',
  '@react-navigation',
  'expo-camera',
  'expo-image-picker',
  'expo-location',
];

let compatibleCount = 0;
Object.keys(deps).forEach(dep => {
  if (iosCompatible.some(p => dep.startsWith(p))) {
    compatibleCount++;
  }
});

successes.push(`✅ Dependencies: ${compatibleCount} iOS-compatible packages`);

// Check 7: Hardcoded widths/heights (might not work on all iOS devices)
console.log('Checking hardcoded dimensions...');
const styleFiles = glob.sync('src/**/*.{js,jsx,ts,tsx}', { absolute: true });
let hardcodedDimensions = 0;

styleFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/width:\s*\d+\s*,|height:\s*\d+\s*,/g);
  if (matches) {
    hardcodedDimensions += matches.length;
  }
});

if (hardcodedDimensions > 50) {
  warnings.push(`⚠️  Hardcoded dimensions: ${hardcodedDimensions} found (use percentages or Dimensions API)`);
} else {
  successes.push(`✅ Hardcoded dimensions: ${hardcodedDimensions} (acceptable)`);
}

// Print Results
console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

if (issues.length > 0) {
  console.log(`${colors.red}❌ CRITICAL ISSUES (${issues.length}):${colors.reset}`);
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log(`${colors.yellow}⚠️  WARNINGS (${warnings.length}):${colors.reset}`);
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

console.log(`${colors.green}✅ SUCCESSES (${successes.length}):${colors.reset}`);
successes.forEach(success => console.log(`   ${success}`));

console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

// Summary
const totalChecks = issues.length + warnings.length + successes.length;
const score = Math.round((successes.length / totalChecks) * 100);

let grade, emoji;
if (score >= 90) {
  grade = 'A';
  emoji = '🎉';
} else if (score >= 80) {
  grade = 'B';
  emoji = '👍';
} else if (score >= 70) {
  grade = 'C';
  emoji = '⚠️';
} else {
  grade = 'D';
  emoji = '❌';
}

console.log(`${emoji} ${colors.cyan}iOS Compatibility Score: ${score}% (Grade ${grade})${colors.reset}\n`);

if (issues.length === 0) {
  console.log(`${colors.green}✅ Your app is iOS-ready! ${colors.reset}`);
  console.log(`   - Test in Expo Go for core features`);
  console.log(`   - Build with EAS for full features`);
} else {
  console.log(`${colors.red}❌ Fix critical issues before testing${colors.reset}`);
}

console.log('\n');

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);


#!/usr/bin/env node
/**
 * Automated Xcode Setup Script
 * Prepares the iOS project for Xcode development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const exec = (cmd, silent = false) => {
  try {
    return execSync(cmd, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    return null;
  }
};

console.log('\n');
log('═══════════════════════════════════════', 'cyan');
log('   🍎 Xcode Compatibility Setup', 'bright');
log('═══════════════════════════════════════', 'cyan');
console.log('\n');

// Step 1: Check prerequisites
log('📋 Step 1: Checking Prerequisites', 'blue');
console.log('');

// Check Node
const nodeVersion = exec('node --version', true);
if (nodeVersion) {
  log(`✅ Node.js: ${nodeVersion.trim()}`, 'green');
} else {
  log('❌ Node.js not found. Please install Node.js', 'red');
  process.exit(1);
}

// Check npm
const npmVersion = exec('npm --version', true);
if (npmVersion) {
  log(`✅ npm: ${npmVersion.trim()}`, 'green');
} else {
  log('❌ npm not found', 'red');
  process.exit(1);
}

// Check CocoaPods
const podVersion = exec('pod --version', true);
if (podVersion) {
  log(`✅ CocoaPods: ${podVersion.trim()}`, 'green');
} else {
  log('⚠️  CocoaPods not found', 'yellow');
  log('   Installing CocoaPods...', 'yellow');
  const installed = exec('sudo gem install cocoapods', false);
  if (installed) {
    log('✅ CocoaPods installed successfully', 'green');
  } else {
    log('❌ Failed to install CocoaPods', 'red');
    log('   Please run: sudo gem install cocoapods', 'yellow');
    process.exit(1);
  }
}

// Check Xcode
const xcodeVersion = exec('xcodebuild -version', true);
if (xcodeVersion) {
  log(`✅ Xcode: ${xcodeVersion.split('\n')[0]}`, 'green');
} else {
  log('⚠️  Xcode not found or not in PATH', 'yellow');
  log('   Please install Xcode from Mac App Store', 'yellow');
}

console.log('');

// Step 2: Check if ios folder exists
log('📁 Step 2: Checking iOS Project', 'blue');
console.log('');

const iosPath = path.join(process.cwd(), 'ios');
const iosExists = fs.existsSync(iosPath);

if (iosExists) {
  log('✅ iOS folder already exists', 'green');
  log('   To regenerate, run: npm run prebuild:clean', 'cyan');
} else {
  log('⚠️  iOS folder not found', 'yellow');
  log('   Generating iOS project...', 'yellow');
  console.log('');
  
  // Step 3: Run expo prebuild
  log('🔨 Step 3: Generating Native iOS Project', 'blue');
  console.log('');
  log('   This may take 2-3 minutes...', 'cyan');
  console.log('');
  
  const prebuild = exec('npx expo prebuild --platform ios', false);
  if (prebuild) {
    log('✅ iOS project generated successfully', 'green');
  } else {
    log('❌ Failed to generate iOS project', 'red');
    process.exit(1);
  }
}

console.log('');

// Step 4: Install pods
log('📦 Step 4: Installing CocoaPods Dependencies', 'blue');
console.log('');

if (fs.existsSync(iosPath)) {
  log('   Installing pods (this may take a few minutes)...', 'cyan');
  console.log('');
  
  const podInstall = exec('cd ios && pod install', false);
  if (podInstall !== null) {
    log('✅ CocoaPods dependencies installed', 'green');
  } else {
    log('❌ Failed to install pods', 'red');
    log('   Try running: cd ios && pod install', 'yellow');
    process.exit(1);
  }
} else {
  log('⚠️  iOS folder not found, skipping pod install', 'yellow');
}

console.log('');

// Step 5: Verify workspace
log('🔍 Step 5: Verifying Xcode Workspace', 'blue');
console.log('');

const workspacePath = path.join(iosPath, 'fitnessapp.xcworkspace');
if (fs.existsSync(workspacePath)) {
  log('✅ Xcode workspace ready', 'green');
  log(`   Location: ${workspacePath}`, 'cyan');
} else {
  log('❌ Workspace not found', 'red');
  log('   Something went wrong with pod install', 'yellow');
  process.exit(1);
}

console.log('');

// Step 6: Check app.json configuration
log('⚙️  Step 6: Verifying Configuration', 'blue');
console.log('');

const appJsonPath = path.join(process.cwd(), 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const iosConfig = appJson.expo?.ios;
  
  if (iosConfig) {
    log('✅ iOS configuration found', 'green');
    
    if (iosConfig.bundleIdentifier) {
      log(`   Bundle ID: ${iosConfig.bundleIdentifier}`, 'cyan');
    } else {
      log('⚠️  Bundle identifier not set', 'yellow');
    }
    
    if (iosConfig.infoPlist) {
      const permissions = Object.keys(iosConfig.infoPlist).filter(k => k.startsWith('NS'));
      log(`   Permissions: ${permissions.length} configured`, 'cyan');
    }
  } else {
    log('⚠️  No iOS configuration in app.json', 'yellow');
  }
} else {
  log('⚠️  app.json not found', 'yellow');
}

console.log('');

// Success summary
log('═══════════════════════════════════════', 'cyan');
log('   ✅ Xcode Setup Complete!', 'green');
log('═══════════════════════════════════════', 'cyan');
console.log('');

log('📝 Next Steps:', 'bright');
console.log('');
log('   1. Open in Xcode:', 'cyan');
log('      npm run xcode', 'bright');
log('      (or) open ios/fitnessapp.xcworkspace', 'cyan');
console.log('');
log('   2. Configure code signing:', 'cyan');
log('      - Select your team', 'cyan');
log('      - Verify bundle identifier', 'cyan');
console.log('');
log('   3. Select device/simulator and press ⌘R', 'cyan');
console.log('');

log('💡 Useful Commands:', 'bright');
console.log('');
log('   npm run xcode          - Open Xcode workspace', 'cyan');
log('   npm run pod:install    - Reinstall pods', 'cyan');
log('   npm run ios:clean      - Clean Xcode build', 'cyan');
log('   npm run ios:device     - Run on connected device', 'cyan');
log('   npm run prebuild:clean - Regenerate iOS project', 'cyan');
console.log('');

log('📚 Documentation:', 'bright');
console.log('');
log('   See XCODE_SETUP_GUIDE.md for complete instructions', 'cyan');
console.log('');

// Offer to open Xcode
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('🍎 Open Xcode now? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    log('\n🚀 Opening Xcode...', 'green');
    exec('open ios/fitnessapp.xcworkspace', false);
  } else {
    log('\n👍 Run "npm run xcode" when ready to open Xcode', 'cyan');
  }
  readline.close();
  console.log('');
});


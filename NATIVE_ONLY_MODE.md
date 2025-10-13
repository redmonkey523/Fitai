# Native-Only Mode

**Configuration:** iOS + Android only | Web platform disabled

---

## 🎯 Why Native-Only?

This app uses custom native modules that Metro couldn't bundle for web:
- `react-native-vision-camera` - Camera scanning
- `expo-av` - Video playback
- `expo-file-system` - Native file access
- Custom native features

Rather than create mock implementations, we've disabled web to ensure:
1. ✅ Clean native builds
2. ✅ No bundler errors
3. ✅ Full feature support on iOS/Android
4. ✅ Proper App Store deployment path

---

## 📱 Target Platforms

### Enabled:
- ✅ iOS (App Store)
- ✅ Android (Play Store)

### Disabled:
- ❌ Web (can be re-enabled later with web-compatible alternatives)

---

## ⚙️ Configuration Files

### `app.json`
```json
{
  "expo": {
    "platforms": ["ios", "android"]
  }
}
```

### `package.json`
```json
{
  "scripts": {
    "start": "expo start --clear",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:ios": "eas build -p ios --profile production",
    "build:android": "eas build -p android --profile production"
  }
}
```

### `babel.config.js`
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

### `metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

---

## 🚀 Development Workflow

### Local Development:
```bash
# Start Metro bundler
npm start

# Run on simulators (requires Android Studio/Xcode)
npm run android
npm run ios
```

### Cloud Builds (EAS):
```bash
# Development builds (for testing)
eas build -p ios --profile development
eas build -p android --profile development

# Production builds (for App Store/Play Store)
npm run build:ios
npm run build:android
```

---

## 🔧 Troubleshooting

### Metro bundler errors?
```bash
# Clear all caches
rm -rf node_modules .expo node_modules/.cache
npm install --legacy-peer-deps
npx expo start --clear
```

### Expo Go shows errors?
**Expected!** This app uses custom native modules not available in Expo Go.

**Solution:** Use development builds:
```bash
eas build -p android --profile development
```

### Want to re-enable web later?
1. Add `"web"` back to `platforms` array in `app.json`
2. Create web-compatible alternatives for native modules
3. Use platform-specific imports:
   ```javascript
   import { Platform } from 'react-native';
   
   if (Platform.OS !== 'web') {
     const { Camera } = await import('react-native-vision-camera');
   }
   ```

---

## 📖 Related Documentation

- **NATIVE_ONLY_SETUP_COMPLETE.md** - Full setup guide and next steps
- **IMPLEMENTATION_ROADMAP.md** - Overall project roadmap
- **EAS.json** - Build profiles configuration

---

## ✅ Current Status

- [x] Web platform disabled in config
- [x] Metro bundles successfully (1619 modules)
- [x] SDK 54.0.0 active
- [x] All native dependencies installed
- [x] EAS build scripts configured
- [ ] Development build created (next step)

---

**Last Updated:** SDK 54.0.0 upgrade - October 2025

# 🚀 Ultra AI Scanner Setup Guide

## Overview

The Ultra AI Scanner is a comprehensive solution that combines multiple scanning methods and AI services to provide reliable food recognition and barcode scanning on both iOS and Android, including Expo Go compatibility.

## 🎯 Features

### **Multi-Layer Scanning Architecture**
1. **Primary**: VisionCamera with real AI APIs
2. **Secondary**: Expo Camera with barcode scanning  
3. **Fallback**: Image picker with AI processing
4. **Demo**: Always available for testing

### **AI Services Integration**
- **Open Food Facts** (Free - Always Available)
- **Nutritionix API** (Free tier available)
- **Calorie Mama AI** (Paid - Most Accurate)
- **Google Cloud Vision** (Paid - General Recognition)
- **Demo Mode** (Always Available)

### **Cross-Platform Compatibility**
- ✅ iOS (VisionCamera + Expo Camera)
- ✅ Android (VisionCamera + Expo Camera)
- ✅ Expo Go (Expo Camera + Image Picker)
- ✅ Web (Image Picker)

## 🛠️ Setup Instructions

### 1. Backend Configuration

#### Create Environment File
```bash
cd backend
cp env.example .env
```

#### Configure AI Service API Keys

Edit `backend/.env` and add your API keys:

```env
# Nutritionix API (Free tier available)
NUTRITIONIX_APP_ID=your_nutritionix_app_id_here
NUTRITIONIX_APP_KEY=your_nutritionix_app_key_here

# Calorie Mama AI (Paid - Most Accurate for Food Recognition)
CALORIE_MAMA_API_KEY=your_calorie_mama_api_key_here

# Google Cloud Vision API (Paid - Good for General Image Recognition)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# OpenAI API (Optional - For Advanced AI Features)
OPENAI_API_KEY=your_openai_api_key_here
```

#### Get API Keys

**Nutritionix (Free Tier)**
1. Go to [https://www.nutritionix.com/business/api](https://www.nutritionix.com/business/api)
2. Sign up for free account
3. Get your App ID and App Key

**Calorie Mama AI (Paid)**
1. Go to [https://dev.caloriemama.ai/](https://dev.caloriemama.ai/)
2. Sign up and get API key
3. Most accurate for food recognition

**Google Cloud Vision (Paid)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Vision API
3. Create API key
4. Set up billing (required)

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
npm install
```

### 3. Start the Backend

```bash
cd backend
npm start
```

**If port 5000 is in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### 4. Test the Scanner

#### Start the App
```bash
npm start
```

#### Use the Test Component
1. Navigate to the AI Scanner Test component
2. Choose between Food Recognition or Barcode Scanner
3. Test different scanning modes

## 🔧 Configuration Options

### Scanner Modes

#### Food Recognition Mode
- **VisionCamera**: High-quality photo capture with AI processing
- **Expo Camera**: Fallback camera with AI processing
- **Image Picker**: Manual image selection with AI processing
- **Demo Mode**: Simulated AI responses for testing

#### Barcode Scanner Mode
- **VisionCamera**: Real-time barcode detection
- **Expo Camera**: Real-time barcode detection
- **Demo Mode**: Simulated barcode responses

### AI Service Priority

The scanner tries AI services in this order:

1. **Calorie Mama AI** (if API key available)
2. **Google Vision** (if API key available)
3. **Nutritionix** (if API key available)
4. **Open Food Facts** (always available)
5. **Demo Mode** (always available)

## 📱 Platform-Specific Setup

### iOS Setup

#### VisionCamera (Recommended)
```bash
npx expo install react-native-vision-camera
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "This app needs access to camera to scan food and barcodes."
        }
      ]
    ]
  }
}
```

#### Expo Camera (Fallback)
```bash
npx expo install expo-camera
```

### Android Setup

#### VisionCamera (Recommended)
```bash
npx expo install react-native-vision-camera
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "This app needs access to camera to scan food and barcodes."
        }
      ]
    ]
  }
}
```

#### Expo Camera (Fallback)
```bash
npx expo install expo-camera
```

### Expo Go Setup

For Expo Go compatibility, the scanner automatically falls back to:
- Expo Camera for barcode scanning
- Image Picker for food recognition
- Demo mode for testing

## 🧪 Testing

### Test Barcodes

Use these test barcodes:
- `3017620422003` - Nutella Hazelnut Spread
- `5000159407236` - Snickers Chocolate Bar
- `4008400322221` - Greek Yogurt Natural
- `049000006343` - Coca-Cola Classic
- `028400090000` - Banana
- `demo123` - Demo barcode

### Test Food Recognition

1. **Real Food Photos**: Take photos of actual food items
2. **Demo Mode**: Use demo mode for testing without real photos
3. **Image Picker**: Select food images from your gallery

## 🔍 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

#### Camera Permission Issues
1. Check app permissions in device settings
2. Ensure camera permission is granted
3. Try restarting the app

#### AI Service Errors
1. Check API keys in `.env` file
2. Verify API service status
3. Check network connectivity
4. Review API rate limits

#### VisionCamera Not Working
1. Ensure proper installation
2. Check platform-specific setup
3. Fallback to Expo Camera automatically

### Error Messages

#### "Camera not available"
- App will automatically use fallback methods
- Demo mode is always available

#### "AI Processing Error"
- Check backend logs
- Verify API keys
- Try demo mode

#### "Network Error"
- Check internet connection
- Verify backend is running
- Check API service status

## 📊 Performance Optimization

### Image Processing
- Images are compressed before upload
- Maximum file size: 10MB
- Supported formats: JPEG, PNG

### API Rate Limits
- **Nutritionix**: 100 requests/minute (free tier)
- **Calorie Mama**: 50 requests/minute
- **Google Vision**: 1000 requests/minute
- **Open Food Facts**: No limit

### Caching
- Results are cached locally
- Barcode lookups are cached
- Image processing results are cached

## 🔒 Security

### API Key Security
- Store API keys in environment variables
- Never commit API keys to version control
- Use different keys for development and production

### Image Security
- Images are processed securely
- Temporary files are cleaned up
- No images are stored permanently

## 📈 Monitoring

### Backend Health Check
```bash
curl http://localhost:5000/api/ai/health
```

### Service Status
The health endpoint returns:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "openFoodFacts": true,
      "nutritionix": true,
      "calorieMama": true,
      "googleVision": true,
      "demo": true
    }
  }
}
```

## 🚀 Production Deployment

### Environment Variables
Ensure all production API keys are set:
```env
NODE_ENV=production
NUTRITIONIX_APP_ID=your_production_app_id
NUTRITIONIX_APP_KEY=your_production_app_key
CALORIE_MAMA_API_KEY=your_production_api_key
GOOGLE_VISION_API_KEY=your_production_api_key
```

### Performance Monitoring
- Monitor API response times
- Track error rates
- Monitor rate limit usage

## 📝 API Documentation

### Food Recognition
```javascript
// Process food image
const result = await apiService.ai.processFoodImage(imagePath);
```

### Barcode Scanning
```javascript
// Look up product by barcode
const result = await apiService.ai.lookupBarcode(barcode);
```

### Demo Mode
```javascript
// Get demo food recognition
const result = await apiService.ai.getDemoFood();

// Get demo barcode scan
const result = await apiService.ai.getDemoBarcode();
```

## 🎯 Success Criteria

Your Ultra AI Scanner is working correctly when:

1. ✅ Backend starts without errors
2. ✅ Camera permissions are granted
3. ✅ Food recognition works in demo mode
4. ✅ Barcode scanning works with test barcodes
5. ✅ Real AI services work (if API keys configured)
6. ✅ Fallback modes work when primary fails
7. ✅ Results display correctly
8. ✅ Works on both iOS and Android
9. ✅ Works in Expo Go

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section
2. Verify all setup steps are completed
3. Test with demo mode first
4. Check backend logs for errors
5. Verify API keys are correct
6. Test on different devices/platforms

## 📚 Additional Resources

- [VisionCamera Documentation](https://mrousavy.com/react-native-vision-camera/)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Nutritionix API Documentation](https://trackapi.nutritionix.com/docs/)
- [Calorie Mama API Documentation](https://dev.caloriemama.ai/)
- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Open Food Facts API Documentation](https://world.openfoodfacts.org/data)

---

**🎉 Congratulations!** Your Ultra AI Scanner is now ready to provide accurate food recognition and barcode scanning across all platforms!

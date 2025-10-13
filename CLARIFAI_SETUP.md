# Clarifai Food Model Setup Guide

## 🍎 Clarifai Food Model - FREE Vision API

**What you get:**
- ✅ **1,000 requests per month** - Perfect for testing and development
- ✅ **Specialized in food recognition** - 1000+ food items
- ✅ **No credit card required** for free tier
- ✅ **Excellent accuracy** for food photos
- ✅ **Easy setup** - Just need API key

## 📋 Step-by-Step Setup

### 1. Create Clarifai Account
1. Go to: https://www.clarifai.com/
2. Click "Sign Up" (top right)
3. Create account with email/password
4. **No credit card required!**

### 2. Get Your API Key
1. After signing up, go to: https://portal.clarifai.com/
2. Click on your profile (top right)
3. Go to "Security" → "API Keys"
4. Click "Create API Key"
5. Give it a name like "Fitness App Food Recognition"
6. Copy the generated API key

### 3. Add to Your Backend
1. Open your `backend/.env` file
2. Add this line:
```env
CLARIFAI_API_KEY=your_actual_api_key_here
```
3. Replace `your_actual_api_key_here` with your real API key

### 4. Test the Scanner
1. Start your backend: `cd backend && npm start`
2. Open your app and go to Nutrition screen
3. Try scanning a food photo
4. The scanner will now try Clarifai first (after Calorie Mama)

## 🔄 Priority Order

The scanner now tries these services in order:
1. **Calorie Mama** (if you have API key)
2. **Clarifai Food Model** ← **Your new FREE service!**
3. **Google Vision** (if you have API key)
4. **Nutritionix** (if you have API key)
5. **Demo data** (always works)

## 🎯 What Clarifai Recognizes

Clarifai's Food Model recognizes:
- Fruits and vegetables
- Meats and proteins
- Dairy products
- Grains and breads
- Desserts and snacks
- Prepared meals
- Beverages
- And 1000+ more food items!

## 🚀 Benefits

- **FREE forever** - No credit card needed
- **Specialized** - Built specifically for food recognition
- **Accurate** - High confidence scores for food items
- **Fast** - Quick response times
- **Reliable** - Stable API service

## 🔧 Troubleshooting

**If Clarifai fails:**
- Check your API key is correct
- Verify you're under the 1000 requests/month limit
- The scanner will automatically try the next service

**API Key format:**
- Should look like: `Key abc123def456...`
- About 40-50 characters long
- No spaces or special characters

## 📱 Testing

Test with these food types:
- 🍎 Fresh fruits
- 🥗 Salads
- 🍕 Pizza
- 🍔 Burgers
- 🥛 Dairy products
- 🍞 Bread and grains

The scanner will show "Clarifai Food Model" as the source when it successfully recognizes food!

---

**Next Steps:** Get your API key and test the scanner. The food recognition should be much more accurate now! 🎉

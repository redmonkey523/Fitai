#!/bin/bash

# Development Startup Script for Fitness App
# This script starts both the backend and frontend servers

echo "🚀 Starting Fitness App Development Environment"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if backend exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend folder not found."
    exit 1
fi

echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check if backend node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

echo "✅ Dependencies ready!"
echo ""

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (optional - will use in-memory DB if not configured)
# MONGODB_URI=mongodb://localhost:27017/fitness_app

# JWT Secrets (change these in production!)
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:19000,http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760

# Optional: Email Configuration (for password reset, etc.)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Optional: Cloud Storage (Cloudinary for production)
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret
EOF
    echo "✅ Created backend/.env with default development settings"
fi

echo ""
echo "🎯 Starting servers..."
echo ""
echo "  📌 Backend will start on: http://localhost:5000"
echo "  📌 Frontend will start on: http://localhost:19006 (web)"
echo ""
echo "⚠️  Keep this window open! Press Ctrl+C to stop both servers."
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped. Goodbye!"
    exit 0
}

# Register cleanup on Ctrl+C
trap cleanup INT TERM

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a few seconds for backend to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi

echo "✅ Backend server started!"
echo ""

# Start frontend
echo "🎨 Starting frontend (Expo)..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Press 'w' for web browser"
echo "  Press 'a' for Android emulator"
echo "  Press 'i' for iOS simulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start frontend (this will block until Ctrl+C)
npm start &
FRONTEND_PID=$!

# Wait for frontend process
wait $FRONTEND_PID
cleanup



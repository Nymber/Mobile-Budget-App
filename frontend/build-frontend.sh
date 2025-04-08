#!/bin/bash

# Script to build the frontend for the Budget App

# Navigate to the frontend directory
cd "$(dirname "$0")/frontend"

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Frontend build successful!"
  echo "Static files should be available in frontend/out/static"
else
  echo "❌ Frontend build failed. Check the error messages above."
  exit 1
fi

# Verify the output directory structure
if [ -d "out" ]; then
  echo "✅ 'out' directory exists"
  if [ -d "out/static" ]; then
    echo "✅ 'out/static' directory exists"
  else
    echo "⚠️ Warning: 'out/static' directory does not exist"
  fi
else
  echo "⚠️ Warning: 'out' directory does not exist"
fi

echo "Frontend build complete. Run the backend server to serve both API and static files."

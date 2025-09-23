#!/bin/bash

# Build Verification Script
# This script helps troubleshoot build issues

echo "🔍 Build Environment Check"
echo "=========================="

# Check Node.js version
echo "📦 Node.js version:"
node --version

# Check npm version
echo "📦 npm version:"
npm --version

# Check TypeScript installation
echo "📦 TypeScript version:"
npx tsc --version

# Check if rimraf is available
echo "🧹 Checking rimraf availability:"
if command -v rimraf &> /dev/null; then
    echo "✅ rimraf command found"
    rimraf --version
elif npx rimraf --version &> /dev/null; then
    echo "✅ rimraf available via npx"
    npx rimraf --version
else
    echo "⚠️ rimraf not found, will use fallback method"
fi

# Check dist directory
echo "📁 Checking dist directory:"
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "📊 Contents:"
    ls -la dist/ 2>/dev/null || echo "Empty or inaccessible"
else
    echo "📁 dist directory does not exist (will be created during build)"
fi

# Try build methods
echo ""
echo "🔨 Testing build methods:"
echo "========================"

# Test clean operations
echo "🧹 Testing clean:fallback..."
if npm run clean:fallback; then
    echo "✅ clean:fallback works"
else
    echo "❌ clean:fallback failed"
fi

echo "🧹 Testing clean..."
if npm run clean; then
    echo "✅ clean works"
else
    echo "❌ clean failed"
fi

# Test TypeScript compilation
echo "🔨 Testing TypeScript compilation..."
if npx tsc; then
    echo "✅ TypeScript compilation successful"
    echo "📁 Build output:"
    ls -la dist/ 2>/dev/null || echo "No output found"
else
    echo "❌ TypeScript compilation failed"
fi

echo ""
echo "🎯 Build verification complete!"
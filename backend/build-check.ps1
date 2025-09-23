# Build Verification Script for PowerShell
# This script helps troubleshoot build issues

Write-Host "🔍 Build Environment Check" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

try {
    # Check Node.js version
    Write-Host "📦 Node.js version:" -ForegroundColor Blue
    node --version

    # Check npm version
    Write-Host "📦 npm version:" -ForegroundColor Blue
    npm --version

    # Check TypeScript installation
    Write-Host "📦 TypeScript version:" -ForegroundColor Blue
    npx tsc --version

    # Check if rimraf is available
    Write-Host "🧹 Checking rimraf availability:" -ForegroundColor Blue
    try {
        $rimrafVersion = npx rimraf --version 2>$null
        if ($rimrafVersion) {
            Write-Host "✅ rimraf available via npx: $rimrafVersion" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️ rimraf not found, will use fallback method" -ForegroundColor Yellow
    }

    # Check dist directory
    Write-Host "📁 Checking dist directory:" -ForegroundColor Blue
    if (Test-Path "dist") {
        Write-Host "✅ dist directory exists" -ForegroundColor Green
        Write-Host "📊 Contents:" -ForegroundColor Blue
        Get-ChildItem dist -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
    }
    else {
        Write-Host "📁 dist directory does not exist (will be created during build)" -ForegroundColor Yellow
    }

    # Try build methods
    Write-Host ""
    Write-Host "🔨 Testing build methods:" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green

    # Test clean operations
    Write-Host "🧹 Testing clean:fallback..." -ForegroundColor Blue
    try {
        npm run clean:fallback
        Write-Host "✅ clean:fallback works" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ clean:fallback failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "🧹 Testing clean..." -ForegroundColor Blue
    try {
        npm run clean
        Write-Host "✅ clean works" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ clean failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test TypeScript compilation
    Write-Host "🔨 Testing TypeScript compilation..." -ForegroundColor Blue
    try {
        npx tsc
        Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
        Write-Host "📁 Build output:" -ForegroundColor Blue
        if (Test-Path "dist") {
            Get-ChildItem dist -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
        }
        else {
            Write-Host "No output found" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ TypeScript compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "🎯 Build verification complete!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Build verification failed: $($_.Exception.Message)" -ForegroundColor Red
}
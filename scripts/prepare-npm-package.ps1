# SuperAugment NPM Package Preparation Script (PowerShell)

Write-Host "🚀 Preparing SuperAugment for NPM publication..." -ForegroundColor Green

# 1. Clean and build
Write-Host "🧹 Cleaning and building..." -ForegroundColor Yellow
npm run clean
npm run build

# 2. Test the executable
Write-Host "🧪 Testing executable..." -ForegroundColor Yellow
if (Test-Path "dist/index.js") {
    Write-Host "✅ dist/index.js exists" -ForegroundColor Green
} else {
    Write-Host "❌ dist/index.js missing" -ForegroundColor Red
    exit 1
}

# 3. Check package.json
Write-Host "📦 Checking package.json configuration..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.bin) {
    Write-Host "✅ Binary configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ Missing binary configuration" -ForegroundColor Red
    exit 1
}

# 4. Verify files to include
Write-Host "📁 Verifying files to include..." -ForegroundColor Yellow
if ((Test-Path "dist") -and (Test-Path "config")) {
    Write-Host "✅ Required directories exist" -ForegroundColor Green
} else {
    Write-Host "❌ Missing required directories" -ForegroundColor Red
    exit 1
}

# 5. Test local installation
Write-Host "🔧 Testing local installation..." -ForegroundColor Yellow
npm pack --dry-run

Write-Host ""
Write-Host "🎉 SuperAugment is ready for NPM publication!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. npm login (if not already logged in)"
Write-Host "2. npm publish"
Write-Host ""
Write-Host "📝 After publication, users can install with:" -ForegroundColor Cyan
Write-Host "   npm install -g superaugment"
Write-Host ""
Write-Host "🔧 And configure VS Code Augment with:" -ForegroundColor Cyan
Write-Host @"
   {
     "mcpServers": {
       "superaugment": {
         "command": "npx",
         "args": ["-y", "superaugment"],
         "env": {}
       }
     }
   }
"@

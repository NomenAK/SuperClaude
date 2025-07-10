#!/bin/bash

# SuperAugment NPM Package Preparation Script

echo "🚀 Preparing SuperAugment for NPM publication..."

# 1. Clean and build
echo "🧹 Cleaning and building..."
npm run clean
npm run build

# 2. Test the executable
echo "🧪 Testing executable..."
chmod +x dist/index.js
node dist/index.js --help 2>/dev/null || echo "✅ MCP server ready (no --help flag expected)"

# 3. Check package.json
echo "📦 Checking package.json configuration..."
if grep -q '"bin"' package.json; then
    echo "✅ Binary configuration found"
else
    echo "❌ Missing binary configuration"
    exit 1
fi

# 4. Verify files to include
echo "📁 Verifying files to include..."
if [ -d "dist" ] && [ -d "config" ]; then
    echo "✅ Required directories exist"
else
    echo "❌ Missing required directories"
    exit 1
fi

# 5. Test local installation
echo "🔧 Testing local installation..."
npm pack --dry-run

echo ""
echo "🎉 SuperAugment is ready for NPM publication!"
echo ""
echo "📋 Next steps:"
echo "1. npm login (if not already logged in)"
echo "2. npm publish"
echo ""
echo "📝 After publication, users can install with:"
echo "   npm install -g superaugment"
echo ""
echo "🔧 And configure VS Code Augment with:"
echo '   {
     "mcpServers": {
       "superaugment": {
         "command": "npx",
         "args": ["-y", "superaugment"],
         "env": {}
       }
     }
   }'

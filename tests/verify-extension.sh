#!/bin/zsh

echo "🔍 VSCode Extension Verification Script"
echo "======================================="

# Check if services are running
echo "\n1. Checking required services..."

# Check server
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "   ✅ Backend server running (port 3001)"
else
    echo "   ❌ Backend server NOT running"
    echo "   💡 Start with: cd server && npm start"
fi

# Check dashboard
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ Dashboard running (port 3000)"
else
    echo "   ❌ Dashboard NOT running" 
    echo "   💡 Start with: cd dashboard && npm run dev"
fi

# Check extension
echo "\n2. Checking extension installation..."
if code --list-extensions | grep -q "productivity-tracker.vscode-productivity-tracker"; then
    echo "   ✅ Extension installed"
else
    echo "   ❌ Extension NOT installed"
    exit 1
fi

echo "\n3. Checking compiled extension files..."
if [[ -f "/home/nabinkhair/Desktop/v-status/vscode-extension/out/extension.js" ]]; then
    echo "   ✅ Extension compiled successfully"
else
    echo "   ❌ Extension NOT compiled"
    echo "   💡 Run: cd vscode-extension && npm run compile"
fi

echo "\n📋 MANUAL TESTING CHECKLIST:"
echo "============================"
echo "□ Open VSCode: code /home/nabinkhair/Desktop/v-status"
echo "□ Press Ctrl+Shift+P → 'Developer: Reload Window'"
echo "□ Look for success message: 'Productivity Tracker extension loaded successfully!'"
echo "□ Check status bar (bottom-right) for tracking indicator"
echo "□ Open Developer Console (Help → Toggle Developer Tools)"
echo "□ Look for console logs: 🚀, 🏗️, 📊, ✅"
echo "□ Test command: 'Productivity Tracker: Login with GitHub'"
echo "□ Test command: 'Productivity Tracker: Open Dashboard'"

echo "\n🐛 TROUBLESHOOTING:"
echo "=================="
echo "If commands show 'not found':"
echo "1. Check Developer Console for errors (red text)"
echo "2. Try 'Developer: Reload Window' again"
echo "3. Verify extension activation logs are present"
echo "4. Check if any import/dependency errors in console"

echo "\n🎯 SUCCESS CRITERIA:"
echo "==================="
echo "✅ Extension loads without errors"
echo "✅ Status bar item appears"
echo "✅ Commands execute (no 'not found' error)"
echo "✅ Console shows activation logs"
echo "✅ Welcome message appears (first time)"

echo "\n📞 Next Steps:"
echo "============="
echo "1. Follow the manual checklist above"
echo "2. Report any console errors you see"
echo "3. Test the GitHub login flow"
echo "4. Verify status bar updates after login"

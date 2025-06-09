#!/bin/bash

echo "🧪 VSCode Extension Testing Script"
echo "================================="

# Check if extension is installed
echo "1. Checking if extension is installed..."
if code --list-extensions | grep -q "productivity-tracker.vscode-productivity-tracker"; then
    echo "   ✅ Extension is installed"
else
    echo "   ❌ Extension is NOT installed"
    exit 1
fi

# Check if server is running
echo "2. Checking if server is running..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Server is running on port 3001"
else
    echo "   ❌ Server is NOT running"
    echo "   💡 Start server with: cd server && npm start"
    exit 1
fi

# Check if dashboard is running
echo "3. Checking if dashboard is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Dashboard is running on port 3000"
else
    echo "   ❌ Dashboard is NOT running"
    echo "   💡 Start dashboard with: cd dashboard && npm run dev"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Open VSCode: code /home/nabinkhair/Desktop/v-status"
echo "   2. Press Ctrl+Shift+P"
echo "   3. Type: 'Developer: Reload Window'"
echo "   4. Look for status bar item in bottom right"
echo "   5. Try: 'Productivity Tracker: Login with GitHub'"
echo ""
echo "📊 If you see the status bar item, the extension is working!"
echo "🔗 Dashboard: http://localhost:3000/dashboard"

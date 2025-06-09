#!/bin/bash

echo "🧪 Testing VSCode Extension Commands"
echo "===================================="

# Test if extension is installed
echo "1. Checking extension installation..."
if code --list-extensions | grep -q "productivity-tracker.vscode-productivity-tracker"; then
    echo "   ✅ Extension is installed"
else
    echo "   ❌ Extension NOT installed"
    exit 1
fi

echo ""
echo "🎯 Instructions for Testing in VSCode:"
echo "=====================================
1. Open VSCode: code /home/nabinkhair/Desktop/v-status
2. Press F1 or Ctrl+Shift+P to open Command Palette
3. IMPORTANT: First run 'Developer: Reload Window' to ensure extension loads
4. Check for these signs that the extension is working:

📊 LOOK FOR:
   - Status bar item in bottom-right corner (should show login prompt)
   - Info message: 'Productivity Tracker extension loaded successfully!'
   - Commands in palette starting with 'Productivity Tracker:'

🧪 TEST COMMANDS:
   - Type: 'Productivity Tracker: Login with GitHub'
   - Type: 'Productivity Tracker: Open Dashboard'
   - Type: 'Productivity Tracker: Show Productivity Stats'

🔍 DEBUG STEPS:
   If commands don't work:
   1. Open Developer Console: Help → Toggle Developer Tools
   2. Look for console logs starting with 🚀, 🏗️, 🔄, ✅
   3. Check for any error messages in red

🎯 EXPECTED BEHAVIOR:
   - Extension loads with success message
   - Status bar shows '🔒 Click to login' or similar
   - Commands execute without 'command not found' errors
   - Clicking status bar or running login command opens GitHub OAuth"

echo ""
echo "📝 If you see 'command not found' errors, please:"
echo "   1. Check VSCode Developer Console for errors"
echo "   2. Try 'Developer: Reload Window' again"
echo "   3. Report any console error messages"

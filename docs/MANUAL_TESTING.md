# VSCode Productivity Tracker - Manual Testing Guide

## 🎯 Testing Overview

This guide will help you manually test the complete VSCode Productivity Tracker system to ensure all components are working correctly.

## 📋 Pre-Testing Checklist

### 1. Verify All Services Are Running
```bash
# 1. Backend Server (Terminal 1)
cd /home/nabinkhair/Desktop/v-status/server
npm start
# Should show: "🚀 Server running on port 3001"

# 2. Dashboard (Terminal 2)
cd /home/nabinkhair/Desktop/v-status/dashboard
npm run dev
# Should show: "✓ Ready in XXXXms"

# 3. MongoDB
# Ensure MongoDB is running on localhost:27017
```

### 2. VSCode Extension Status
- The extension should already be installed from the .vsix package
- If not installed, run: `code --install-extension vscode-extension/productivity-tracker-0.0.1.vsix`

## 🧪 Manual Testing Steps

### Step 1: VSCode Extension Authentication

1. **Open VSCode** in the project directory:
   ```bash
   cd /home/nabinkhair/Desktop/v-status
   code .
   ```

2. **Check Status Bar**:
   - Look for "🔒 Login" in the bottom status bar
   - This indicates the extension is loaded but not authenticated

3. **Authenticate with GitHub**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type: `Productivity Tracker: Login with GitHub`
   - Press Enter
   - Follow the GitHub OAuth flow in the browser
   - Return to VSCode after authentication

4. **Verify Authentication**:
   - Status bar should change to "📊 Tracking" (green)
   - You should see a welcome message

### Step 2: Activity Tracking

1. **Test File Operations**:
   - Open a new file: `Ctrl+N`
   - Save the file: `Ctrl+S`
   - Edit the file: Type some content
   - Open another existing file

2. **Check WebSocket Connection**:
   - Open VSCode Developer Console: `Help > Toggle Developer Tools`
   - Look for WebSocket connection logs in the Console tab

3. **Verify Activity Events**:
   - Each action should trigger activity events
   - Check the server logs for incoming WebSocket messages

### Step 3: Quick Actions Menu

1. **Access Quick Menu**:
   - Press `Ctrl+Shift+P`
   - Type: `Productivity Tracker: Quick Actions`
   - Or click the status bar item

2. **Test Menu Options**:
   - **Open Dashboard**: Should open browser to dashboard
   - **View Stats**: Should show current productivity stats
   - **Settings**: Should show extension settings
   - **Logout**: Should disconnect and change status bar to "🔒 Login"

### Step 4: Dashboard Verification

1. **Access Dashboard**:
   - Open browser to: `http://localhost:3000`
   - Click "Login with GitHub" if not already authenticated
   - Navigate to Dashboard section

2. **Check Real-time Updates**:
   - Perform activities in VSCode (open files, edit, save)
   - Refresh dashboard or wait for real-time updates
   - Verify that stats update in real-time

3. **Test Dashboard Features**:
   - **Stats Overview**: Current session info
   - **Activity Chart**: Time-based activity visualization
   - **Project Chart**: Projects you've worked on
   - **Language Stats**: Programming languages used
   - **Recent Activity**: Latest file operations

### Step 5: Data Persistence

1. **Logout and Re-login**:
   - Logout from VSCode extension
   - Close VSCode
   - Reopen VSCode and login again
   - Verify previous activity data is still available

2. **Cross-Platform Verification**:
   - Check dashboard shows cumulative data
   - Verify MongoDB contains activity records:
   ```bash
   # Connect to MongoDB
   mongosh
   use productivity_tracker
   db.activities.find().sort({timestamp: -1}).limit(10)
   ```

## 🔍 Expected Results

### VSCode Extension
- ✅ Status bar shows current tracking status
- ✅ Authentication flow works smoothly
- ✅ Activity events are captured for all file operations
- ✅ Quick actions menu provides easy access to features
- ✅ WebSocket connection maintains real-time communication

### Backend Server
- ✅ GitHub OAuth authentication works
- ✅ JWT tokens are issued and validated
- ✅ WebSocket server accepts authenticated connections
- ✅ Activity events are saved to MongoDB
- ✅ API endpoints return correct data

### Dashboard
- ✅ GitHub authentication works
- ✅ Real-time updates reflect VSCode activity
- ✅ All charts and components display data correctly
- ✅ Responsive design works on different screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Check VSCode Extensions view
   - Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

2. **Authentication Failed**:
   - Check GitHub OAuth app settings
   - Verify environment variables in server/.env

3. **WebSocket Connection Issues**:
   - Check server logs for WebSocket errors
   - Verify JWT token is valid
   - Check network connectivity

4. **Dashboard Not Loading**:
   - Ensure Next.js dev server is running
   - Check browser console for errors
   - Verify API endpoints are accessible

### Debug Commands

```bash
# Check extension logs
code --log-level=trace

# Check server logs
cd server && npm start

# Check MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"

# Test API endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/activity/stats
```

## 📊 Success Criteria

The system is fully functional when:

1. ✅ VSCode extension authenticates successfully
2. ✅ Activity tracking captures all file operations
3. ✅ WebSocket maintains real-time connection
4. ✅ Dashboard displays live productivity data
5. ✅ Data persists across sessions
6. ✅ All API endpoints respond correctly
7. ✅ GitHub OAuth flow works seamlessly

## 🎉 Next Steps

Once manual testing is complete:

1. **Production Deployment**: Configure production environment variables
2. **User Documentation**: Create setup guides for end users
3. **Performance Optimization**: Monitor and optimize for scale
4. **Feature Enhancements**: Add more productivity metrics and insights

---

**Happy Testing! 🚀**

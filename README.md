# 📊 VSCode Productivity Tracker

A comprehensive full-stack productivity and wellbeing tracker for Visual Studio Code that monitors your coding activity in real-time and provides insightful analytics through a beautiful dashboard.

## 🎯 Features

### VSCode Extension
- **Real-time Activity Tracking**: Monitors file operations, text changes, and coding sessions
- **GitHub Authentication**: Seamless OAuth integration with VSCode's GitHub API
- **Status Bar Integration**: Live tracking indicator with quick access to features
- **Quick Actions Menu**: Easy access to dashboard, stats, settings, and logout
- **WebSocket Communication**: Real-time data synchronization with backend

### Backend Server
- **Express.js API**: RESTful endpoints for activity data and statistics
- **MongoDB Integration**: Robust data persistence with optimized indexes
- **GitHub OAuth**: Secure authentication with JWT token management
- **WebSocket Server**: Real-time activity tracking and live updates
- **Advanced Analytics**: Comprehensive activity aggregation and insights

### Dashboard (Next.js)
- **Beautiful UI**: Modern, responsive design with shadcn/ui components
- **Real-time Updates**: Live productivity metrics and activity visualization
- **Interactive Charts**: Activity timeline, project distribution, language stats
- **GitHub Integration**: Seamless authentication and user management
- **Mobile Responsive**: Works perfectly on all device sizes

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   VSCode        │ ←──────────────→ │   Backend       │ ←─────────────→ │   Dashboard     │
│   Extension     │                  │   Server        │                 │   (Next.js)     │
│   (TypeScript)  │                  │   (Express)     │                 │                 │
└─────────────────┘                  └─────────────────┘                 └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    MongoDB      │
                                     │    Database     │
                                     └─────────────────┘
```

## 📁 Project Structure

```
v-status/
├── vscode-extension/          # VSCode Extension (TypeScript)
│   ├── src/
│   │   ├── extension.ts       # Main extension entry point
│   │   ├── authService.ts     # GitHub authentication
│   │   ├── activityTracker.ts # Activity monitoring
│   │   ├── webSocketClient.ts # Real-time communication
│   │   └── types.ts          # TypeScript interfaces
│   ├── package.json          # Extension manifest
│   └── tsconfig.json         # TypeScript configuration
├── server/                   # Backend Server (Node.js/Express)
│   ├── src/
│   │   ├── server.ts         # Express app setup
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Authentication middleware
│   └── package.json
├── dashboard/                # Frontend Dashboard (Next.js)
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and API client
│   │   └── contexts/       # React contexts
│   └── package.json
├── integration-test.js      # Automated testing script
├── MANUAL_TESTING.md       # Manual testing guide
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB running on localhost:27017
- VSCode 1.74+
- GitHub account for OAuth

### 1. Clone and Setup
```bash
# Install dependencies for all components
npm install
cd server && npm install
cd ../dashboard && npm install
cd ../vscode-extension && npm install
```

### 2. Environment Configuration
Create `server/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/productivity_tracker
JWT_SECRET=your-super-secure-jwt-secret-key
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/auth/github/callback
```

Create `dashboard/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. GitHub OAuth Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - Application name: `VSCode Productivity Tracker`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/auth/github/callback`
3. Copy Client ID and Client Secret to server/.env

### 4. Start Services
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start dashboard
cd dashboard
npm run dev

# Terminal 3: Install and activate VSCode extension
cd vscode-extension
npm run compile
npm run package
code --install-extension vscode-productivity-tracker-0.0.1.vsix
```

### 5. Test the System
1. Open VSCode in the project directory
2. Press `Ctrl+Shift+P` → "Productivity Tracker: Login with GitHub"
3. Complete GitHub authentication
4. Start coding - your activity will be tracked automatically!
5. Visit `http://localhost:3000` to view your productivity dashboard

## 📱 Usage

### VSCode Extension Commands
- `Productivity Tracker: Login with GitHub` - Authenticate with GitHub
- `Productivity Tracker: Quick Actions` - Open quick actions menu
- `Productivity Tracker: Open Dashboard` - Launch dashboard in browser
- `Productivity Tracker: View Stats` - Show current session statistics
- `Productivity Tracker: Settings` - Configure extension settings
- `Productivity Tracker: Logout` - Disconnect and stop tracking

### Dashboard Features
- **Stats Overview**: Current session time, active file, projects, and total sessions
- **Activity Chart**: Visual timeline of your coding activity
- **Project Chart**: Distribution of time across different projects
- **Language Stats**: Programming languages used with time breakdown
- **Recent Activity**: Latest file operations and coding events

## 🧪 Testing

### Automated Integration Tests
```bash
# Run comprehensive integration test
node integration-test.js
```

### Manual Testing
Follow the detailed guide in [MANUAL_TESTING.md](./MANUAL_TESTING.md) for complete system verification.

## 🔧 API Endpoints

### Authentication
- `POST /auth/github` - Initiate GitHub OAuth flow
- `GET /auth/github/callback` - Handle OAuth callback
- `POST /auth/verify` - Verify JWT token

### Activity Tracking
- `GET /api/activity/stats` - Current session statistics
- `GET /api/activity/daily` - Daily activity summary
- `GET /api/activity/projects` - Project-based analytics
- `GET /api/activity/summary` - Overall productivity summary
- `GET /api/activity/languages` - Programming language stats
- `GET /api/activity/timeseries` - Time-series activity data

### WebSocket Events
- `activity_event` - Real-time activity tracking
- `get_stats` - Request current statistics
- `stats` - Statistics response
- `connected` - Connection confirmation

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **GitHub OAuth**: Industry-standard OAuth 2.0 flow
- **Input Validation**: Comprehensive data validation using Joi
- **CORS Protection**: Configured for development and production
- **WebSocket Authentication**: Token-based WebSocket security

## 🎨 Customization

### Extension Settings
Configure the extension through VSCode settings:
- Auto-start tracking on VSCode launch
- Custom activity tracking intervals
- Dashboard URL configuration
- Notification preferences

### Dashboard Themes
The dashboard supports both light and dark themes with automatic system detection.

## 🚀 Deployment

### Production Environment
1. Set up MongoDB Atlas or production MongoDB instance
2. Configure production environment variables
3. Deploy backend to cloud service (Heroku, AWS, etc.)
4. Deploy dashboard to Vercel or similar platform
5. Package and distribute VSCode extension

### Environment Variables
Update production environment variables for:
- Database connection strings
- GitHub OAuth app credentials (production)
- JWT secrets (use strong, random keys)
- API URLs (production endpoints)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [VSCode Extension API](https://code.visualstudio.com/api) for excellent documentation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) for the amazing React framework
- [MongoDB](https://www.mongodb.com/) for robust data persistence

## 📞 Support

If you encounter any issues or have questions:

1. Check the [MANUAL_TESTING.md](./MANUAL_TESTING.md) troubleshooting section
2. Review the integration test results
3. Open an issue on GitHub with detailed error logs

---

**Made with ❤️ for productive developers**

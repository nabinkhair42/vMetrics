# Environment Variables

The VSCode Productivity Tracker supports configuration via environment variables for flexible deployment and development setups.

## VSCode Extension Environment Variables

### Core Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PRODUCTIVITY_SERVER_URL` | Server endpoint URL | `http://localhost:3001` | `https://your-server.com` |
| `PRODUCTIVITY_IDLE_TIMEOUT` | Idle timeout in minutes | `5` | `10` |
| `PRODUCTIVITY_SYNC_INTERVAL` | Sync interval in seconds | `90` | `60` |

### Usage

#### Development
```bash
# Set environment variables before launching VS Code
export PRODUCTIVITY_SERVER_URL="http://localhost:3001"
export PRODUCTIVITY_IDLE_TIMEOUT="5"
export PRODUCTIVITY_SYNC_INTERVAL="90"

# Launch VS Code
code .
```

#### Production/Deployment
```bash
# For team deployments
export PRODUCTIVITY_SERVER_URL="https://productivity.yourcompany.com"
export PRODUCTIVITY_IDLE_TIMEOUT="10"

# Users launch VS Code with these settings
code .
```

## Server Environment Variables

### Database & Core
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/productivity` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-super-secure-secret` |
| `PORT` | Server port | No | `3001` |

### Authentication (GitHub OAuth)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes | `your-github-client-id` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | Yes | `your-github-secret` |
| `GITHUB_REDIRECT_URI` | OAuth callback URL | Yes | `http://localhost:3001/auth/github/callback` |

### CORS & Frontend
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `FRONTEND_URL` | Dashboard frontend URL | No | `http://localhost:3000` |
| `SESSION_SECRET` | Session signing secret | No | `change-this-secret` |

### Example Server .env
```env
# Database
MONGODB_URI=mongodb://localhost:27017/productivity_tracker

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-session-secret-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/auth/github/callback

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Dashboard Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production
```env
NEXT_PUBLIC_API_URL=https://your-api-server.com
```

## Priority Order

Environment variables take precedence over VS Code settings:

1. **Environment Variables** (highest priority)
2. **VS Code User Settings**
3. **VS Code Workspace Settings**
4. **Default Values** (lowest priority)

## Docker Support

For containerized deployments:

```dockerfile
# Set environment variables in Dockerfile
ENV PRODUCTIVITY_SERVER_URL=https://productivity-api.company.com
ENV PRODUCTIVITY_IDLE_TIMEOUT=10

# Or use docker-compose.yml
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  vscode:
    image: your-vscode-image
    environment:
      - PRODUCTIVITY_SERVER_URL=https://productivity-api.company.com
      - PRODUCTIVITY_IDLE_TIMEOUT=10
```

## Troubleshooting

### Check Current Configuration
The extension logs the active configuration on startup. Check the VS Code Output panel (Developer Tools > Output > Productivity Tracker) for:

```
🔧 Configuration loaded: {
  serverUrl: "http://localhost:3001",
  idleTimeout: "5m", 
  syncInterval: "90s",
  source: "environment" | "vscode-settings"
}
```

### Common Issues

1. **Environment variables not recognized**: Restart VS Code after setting environment variables
2. **Server connection fails**: Verify `PRODUCTIVITY_SERVER_URL` is accessible
3. **Sync issues**: Adjust `PRODUCTIVITY_SYNC_INTERVAL` based on network conditions

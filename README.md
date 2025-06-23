# vMetrics - VSCode Productivity Tracker



<div align="center">
<img src="/icon.png" alt="vMetrics Logo" width="100" />
  <h3>Code Smarter, Not Harder - Track Your Coding Productivity</h3>
  <p>A comprehensive full-stack productivity tracking system for developers using VS Code</p>
</div>

## Overview

vMetrics is a sophisticated productivity tracking ecosystem designed specifically for developers who want to understand and optimize their coding habits. The system seamlessly tracks your coding activity across multiple devices through a VS Code extension, processes this data through a powerful backend server, and presents beautiful insights through a modern web dashboard.

## What Does vMetrics Do?

### Real-Time Activity Tracking
- **Smart File Monitoring**: Tracks when you open, edit, save, and close files
- **Language Detection**: Automatically identifies programming languages you're working with
- **Project Recognition**: Intelligently categorizes your work by project/workspace
- **Focus Session Tracking**: Monitors active coding periods and idle time
- **Multi-Device Synchronization**: Unifies data across all your development machines

### Intelligent Analytics
- **Productivity Insights**: Understand your coding patterns and peak productivity hours
- **Time Allocation**: See exactly how much time you spend on different projects and languages
- **Session Analysis**: Track focus sessions, breaks, and overall work-life balance
- **Trend Monitoring**: Identify productivity trends over time with detailed historical data

### Privacy-First Approach
- **Metadata Only**: Never tracks actual code content, only file metadata and timing
- **GitHub Authentication**: Secure login using your existing GitHub account
- **Local Data Control**: Choose what data to sync and maintain control over your information

## System Architecture

vMetrics consists of three integrated components working together:

### VS Code Extension
- **Real-Time Monitoring**: Captures coding activity as it happens
- **Offline Support**: Continues tracking even when disconnected from the internet
- **Smart Batching**: Efficiently syncs data without impacting VS Code performance
- **Idle Detection**: Automatically detects when you step away from coding
- **Status Bar Integration**: Shows current tracking status and quick stats

**Key Features:**
- File open/close/save/edit tracking
- Programming language detection
- Workspace and project identification
- Window focus/blur monitoring
- Configurable idle timeout (default: 5 minutes)
- Session management with unique identifiers

### Backend Server
- **Real-Time Data Processing**: Handles incoming activity data from extensions
- **Session Management**: Intelligently processes raw events into meaningful sessions
- **Multi-Device Support**: Merges data from multiple development machines
- **GitHub OAuth Integration**: Secure authentication and user management
- **RESTful API**: Provides comprehensive endpoints for dashboard consumption

**Technology Stack:**
- Node.js with Express.js framework
- MongoDB for flexible data storage
- WebSocket support for real-time features
- JWT-based authentication
- Helmet for security hardening
- Rate limiting and CORS protection

### Web Dashboard
- **Modern UI**: Built with Next.js 15 and shadcn/ui components
- **Interactive Charts**: Beautiful visualizations using Recharts library
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Real-Time Updates**: Live activity status when actively coding

## Key Features & Benefits

### Comprehensive Analytics

**Activity Overview:**
- Daily, weekly, and monthly coding time summaries
- Project-wise time allocation and progress tracking
- Programming language usage statistics and expertise mapping
- File activity patterns and most-edited files

**Visual Insights:**
- GitHub-style activity heatmaps showing consistency over time
- Interactive charts displaying productivity trends
- Project comparison graphs and language distribution charts
- Focus session analysis with average session lengths

### Productivity Optimization

**Focus Management:**
- Session tracking with automatic idle detection
- Break pattern analysis for work-life balance insights
- Peak productivity hour identification
- Distraction pattern recognition

**Goal Setting & Tracking:**
- Daily coding time goals and achievement tracking
- Project milestone progress monitoring
- Consistency streaks and habit formation insights

### Multi-Device Synchronization

**Seamless Integration:**
- Automatic data merging across multiple development machines
- Unique machine identification for device-specific insights
- Centralized dashboard showing unified productivity metrics
- Cross-platform compatibility (Windows, macOS, Linux)

### Dashboard Features

**Smart Overview:**
- Today's productivity summary with key metrics
- Current activity status (live tracking when coding)
- Quick access to most relevant projects and languages
- Trend indicators showing productivity changes

**Detailed Analytics:**
- Tabbed interface for different time ranges (daily, weekly, monthly)
- Interactive filtering by projects, languages, or date ranges
- Exportable charts and data for external analysis
- Customizable dashboard widgets and layouts

**Activity Heatmap:**
- Visual representation of coding consistency over time
- Color-coded intensity based on daily activity levels
- Tooltip details showing exact hours and session counts
- Configurable time ranges for historical analysis

## Privacy & Security

### Data Protection
- **No Code Content**: Only metadata (file names, timestamps, languages) is tracked
- **Encrypted Communication**: All data transmission uses HTTPS/WSS protocols
- **User Control**: Full control over data retention and deletion
- **GitHub Authentication**: No additional passwords or sensitive data storage

### Transparency
- **Open Metrics**: Clear visibility into what data is collected
- **Configurable Tracking**: Ability to customize what activities are monitored
- **Data Export**: Option to export your data at any time
- **Privacy Settings**: Granular control over data sharing and visibility

## Use Cases

### For Individual Developers
- **Productivity Insights**: Understand your most productive hours and optimize your schedule
- **Project Management**: Track time spent on different projects for accurate billing or reporting
- **Skill Development**: Monitor programming language usage to identify areas for growth
- **Work-Life Balance**: Ensure healthy coding patterns with break and session tracking

### For Development Teams
- **Team Analytics**: Aggregate insights (when privacy settings allow)
- **Project Tracking**: Monitor collective progress on team projects
- **Resource Allocation**: Understand team productivity patterns for better planning
- **Technology Adoption**: Track team-wide adoption of new languages and tools

### For Freelancers & Consultants
- **Time Tracking**: Accurate billing with detailed project breakdowns
- **Client Reporting**: Professional reports showing work patterns and dedication
- **Portfolio Insights**: Demonstrate expertise through language and project diversity
- **Productivity Optimization**: Maximize billable hours through better work habits

## Technical Highlights

### Performance Optimized
- **Minimal VS Code Impact**: Lightweight extension with efficient event handling
- **Smart Data Batching**: Reduces network overhead with intelligent sync strategies
- **Offline Resilience**: Continues tracking even without internet connectivity
- **Fast Dashboard Loading**: Optimized queries and caching for quick insights

### Developer Experience
- **Easy Setup**: Simple installation through VS Code marketplace
- **Intuitive Interface**: Clean, modern dashboard design with excellent UX
- **Flexible Configuration**: Customizable settings for different workflow preferences
- **Reliable Tracking**: Robust error handling and data integrity protection

### Scalable Architecture
- **Microservices Ready**: Modular design allowing for easy scaling and maintenance
- **Database Optimization**: Efficient MongoDB schemas with proper indexing
- **API Design**: RESTful endpoints following best practices
- **Security First**: Implementation of security best practices throughout the stack

## Design Philosophy

vMetrics is built around the principle of **"Insights Without Intrusion"** - providing valuable productivity insights while maintaining complete privacy and minimal impact on your development workflow. The system is designed to be:

- **Non-Invasive**: Runs silently in the background without disrupting your coding flow
- **Privacy-Conscious**: Never accesses or stores your actual code content
- **Actionable**: Provides insights that can genuinely help improve productivity
- **Beautiful**: Modern, intuitive interface that makes data exploration enjoyable
- **Reliable**: Consistent tracking and data integrity across all usage scenarios

---

<div align="center">
  <p><strong>Transform your coding productivity with actionable insights.</strong></p>
  <p>Discover patterns, optimize your workflow, and achieve your development goals with vMetrics.</p>
</div>

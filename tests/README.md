# VSCode Productivity Tracker Tests

This folder contains all test files and scripts for the VSCode Productivity Tracker project.

## Test Files

### `integration-test.js`
Comprehensive integration test script that validates:
- Server health and MongoDB connection
- API authentication with Bearer tokens
- WebSocket connection and authentication
- Activity data persistence and retrieval
- Stats calculation and aggregation
- Dashboard accessibility

**Usage:**
```bash
node tests/integration-test.js
```

### `test-extension.sh`
Shell script for testing the VSCode extension functionality including:
- Extension installation verification
- Command registration testing
- Activity tracking validation
- WebSocket connection testing

**Usage:**
```bash
chmod +x tests/test-extension.sh
./tests/test-extension.sh
```

### `verify-extension.sh`
Extension verification script that checks:
- Extension package integrity
- Configuration validation
- Dependency verification
- Command availability

**Usage:**
```bash
chmod +x tests/verify-extension.sh
./tests/verify-extension.sh
```

### `debug-extension.sh`
Debugging script for troubleshooting extension issues:
- Extension loading problems
- Command registration failures
- Authentication issues
- WebSocket connection problems

**Usage:**
```bash
chmod +x tests/debug-extension.sh
./tests/debug-extension.sh
```

## Running Tests

### Prerequisites
1. Ensure the server is running: `npm run dev` from the server folder
2. MongoDB should be running locally or configured with remote connection
3. VSCode extension should be installed and enabled

### Full Test Suite
Run all tests in sequence:
```bash
# From project root
node tests/integration-test.js
./tests/test-extension.sh
./tests/verify-extension.sh
```

### Individual Tests
Run specific test files as needed based on what you're testing.

## Test Environment
- Server URL: http://localhost:3001
- MongoDB: Local instance or configured remote
- WebSocket: ws://localhost:3001
- Dashboard: http://localhost:3000 (when running)

## Troubleshooting
If tests fail, check:
1. Server is running and accessible
2. MongoDB connection is established
3. Environment variables are configured
4. VSCode extension is properly installed
5. GitHub OAuth credentials are valid

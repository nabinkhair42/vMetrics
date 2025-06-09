# VSCode Productivity & Wellbeing Tracker – Full-Stack Architecture Plan

## Project Overview

This project is a full-stack system to track coding productivity and digital wellbeing for developers using VS Code. It consists of three main parts: a VS Code extension (TypeScript) to capture coding activity, a Node/Express backend with WebSocket support for real-time data and a MongoDB database, and a Next.js web dashboard (using **shadcn/ui** component library) for visualizing the data. The goal is to seamlessly record coding activity (files opened, time spent, idle vs focus periods, etc.) across multiple devices using one GitHub-based login, and present meaningful insights (e.g. coding time, top projects, daily patterns) in a modern web UI.

**Key Technical Components:**

* **VS Code Extension (TypeScript):** Runs inside VS Code, listening to editor events (files opened/closed, editor focus changes, file saves, etc.) and user inactivity. It sends real-time event data to the backend via WebSocket.
* **Backend Server (Node.js & Express):** Manages WebSocket connections from extensions, receives and processes activity events, and stores them in a **MongoDB** database. Also handles authentication via GitHub OAuth (so the user’s GitHub ID ties all their data together). Provides RESTful or GraphQL APIs for the dashboard to fetch aggregated stats.
* **Web Dashboard (Next.js + shadcn/ui):** An authenticated web app where users log in with GitHub OAuth to view their coding metrics. The dashboard will display charts, summaries, and possibly GitHub-style heatmaps of coding activity in an intuitive UI.

**High-Level Workflow:**

1. The developer installs the VS Code extension and logs in via GitHub (ensuring the extension knows the user’s identity).
2. The extension opens a WebSocket connection to the backend and sends events as the user codes (e.g. “opened file X at 10:00”, “edited file Y for 5 minutes”, “window lost focus at 10:30”, etc.).
3. The backend authenticates the events (each event is associated with the user’s GitHub ID and a unique machine ID for that device) and writes them to MongoDB.
4. If the user has the dashboard open, the backend can also push live updates (optional) to the dashboard via WebSocket or the dashboard can pull data periodically via REST APIs.
5. The Next.js dashboard queries the backend for summarized data (e.g. total coding time per day, top projects, distribution of activity by hour) and displays it with interactive charts and UI components.

This architecture ensures data is unified by user (GitHub account) even if they use multiple machines. It’s scalable – the backend can handle many WebSocket connections (Node.js can manage tens of thousands of concurrent sockets given adequate resources), and the stateless nature of the API allows horizontal scaling if needed. The use of WebSockets provides real-time data flow, while MongoDB offers a flexible way to store event logs and query them for analytics.

## Project Structure and Folder Organization

The project can be organized as a monorepo with separate folders for each component, or as separate repositories. A convenient structure (monorepo) might look like:

```
/vscode-extension/   # VS Code extension package
   package.json
   src/
      extension.ts       # Entry point of the extension
      events.ts          # Logic for capturing VS Code events
      websocket.ts       # WebSocket client logic
      auth.ts            # GitHub OAuth integration or token handling
      utils.ts           # Helper functions (e.g. formatting, UUID generation)
   tsconfig.json
   README.md

/server/            # Backend Express server
   package.json
   src/
      index.ts or app.ts # Express app setup
      auth/              # Auth routes and logic (GitHub OAuth callbacks)
      api/               # REST API routes for dashboard data (if any)
      ws/                # WebSocket server setup and handlers
      models/            # Mongoose models (User, Activity, etc.)
      controllers/       # Logic for handling incoming events, querying DB
      config/            # Config (MongoDB URI, GitHub OAuth credentials)
   .env                  # Environment variables (not committed)
   README.md

/dashboard/         # Next.js 13 app (frontend)
   package.json
   next.config.js
   app/ or pages/        # Next.js routes (using the App Router or Pages Router)
      login/             # OAuth callback handling (if needed on client)
      dashboard/         # Protected routes for dashboard pages
      ... other pages (e.g. profile, settings if any)
   components/           # React components (charts, layout, etc.)
   lib/                  # Utility functions (e.g. API client)
   styles/               # Tailwind CSS styles (if customizing)
   public/               # Static assets
   README.md
```

Each part is relatively decoupled, communicating through well-defined interfaces (WebSocket or HTTP API). This separation also makes it easier to deploy them independently (e.g. dashboard to Vercel, server to Railway, etc.).

## VS Code Extension (TypeScript)

**Purpose:** The extension runs inside VS Code and is responsible for capturing the user’s coding activity in real-time and forwarding it to the backend. It needs to track what file the user is working on, for how long, detect when the user stops typing or switches focus (to determine idle time), and handle authentication so events are tied to the correct user.

**Key Events to Track:** We will use VS Code’s Extension API to listen for relevant editor events:

* **Active Editor Change:** Use `vscode.window.onDidChangeActiveTextEditor` to detect when the user switches the active file/editor. *“An event which fires when the active editor has changed. Note that the event also fires when the active editor changes to `undefined`.”*. This tells us when the user opened a new file or switched away (undefined means no editor open).
* **File Open/Close:** Use `vscode.workspace.onDidOpenTextDocument` (and possibly onDidClose) to know when a file is opened in the editor. *“onDidOpenTextDocument: An event that is emitted when a text document is opened…”*. This can mark the start of working on a file.
* **File Save:** Use `vscode.workspace.onDidSaveTextDocument` to detect saves. *“onDidSaveTextDocument: An event that is emitted when a text document is saved to disk.”*. Save events indicate activity (the user made changes).
* **Document Edit Events:** Use `vscode.workspace.onDidChangeTextDocument` to detect when the contents of a file are modified. *“An event that is emitted when a text document is changed (e.g., contents change or dirty-state changes).”*. We can use this to detect continuous typing activity.
* **Editor/Window Focus:** Use `vscode.window.onDidChangeWindowState` to catch when the VS Code window gains or loses focus. *“An Event which fires when the focus or activity state of the current window changes. The value of the event represents whether the window is focused.”*. This is crucial for detecting when the user switches to another app (goes out of focus) or comes back, which signals a potential break/idle period.

**Data Captured:** From these events, the extension will compile data such as:

* **Timestamp** of the event.
* **Event type** (e.g. “file\_open”, “file\_close”, “file\_save”, “edit”, “focus”, “blur”, “idle\_start”, “idle\_end”, etc.).
* **File name or identifier** (possibly the full path or project-relative path).
* **Language ID** of the file (e.g. JavaScript, Python – VS Code API provides `document.languageId`).
* **Duration** (for certain events that signify an ended period of focus, the extension can calculate how long the user was working since the last relevant event).

The extension will likely need to maintain some state to calculate durations. For example, it can note the timestamp when a file became active and then on switching files or losing focus, compute the time difference to know how long the user actively worked on that file. It might send a summarized event like “worked 25 minutes on file X”.

**Idle Detection:** To accurately measure “focus” time, the extension should detect inactivity. This could be done with a timer or by monitoring the events above:

* If no edit or save events occur for a certain threshold (say 5 minutes) while the editor is still open, consider that the user went idle. For instance, one existing tracker uses a default inactivity timeout of 5 minutes (300 seconds): *“If no activity is detected for 5 minutes, the timer stops automatically.”*. We can use a similar threshold (configurable by the user).
* Additionally, if the VS Code window loses focus (`onDidChangeWindowState` reports not focused), we immediately mark the end of a focus session (the user switched to another app).
* The extension can send a special “idle” event to the server when this happens, or the server can infer idle periods by gaps in timestamps. A common approach (as used by others) is: *“Inactivity Timeout… default is 150 seconds. Coding time is counted until this threshold is reached.”* – meaning the extension keeps counting you as “active” for a couple of minutes of silence, then stops. We will implement a similar logic.

To implement this, the extension might use a periodic heartbeat/ping. For example, while the editor is focused and the user is active, send a “ping” message every minute. If the backend stops receiving pings (or receives an explicit “idle\_start”), it knows the user went idle. **Alternatively**, the extension can handle it internally: when idle timeout is reached, send a final event for that session indicating it ended at that timestamp.

**Multi-Device Consideration:** Each extension installation (on each machine) should identify itself with a **Machine ID**. This could be generated on first use (store a UUID in the extension’s global state) or use the machine’s hostname. Using hostname is a simple approach – e.g. WakaTime uses the computer’s hostname (and IP) to distinguish machines. We can combine both: e.g., generate a UUID and perhaps tag it with a hash of hostname, to ensure uniqueness. All events sent from the extension will include both the user’s GitHub ID (or an auth token tied to it) and the machineId, so the backend can separate data by device if needed.

**Authentication Flow in Extension:** Since GitHub OAuth is the sole auth method, the extension needs to obtain an OAuth token or session for the user. VS Code has a built-in GitHub authentication integration we can leverage. We have two possible approaches:

1. **Use VS Code’s GitHub authentication API:** VS Code provides an authentication API that can piggyback on the user’s GitHub login in VS Code. For example, calling `vscode.authentication.getSession('github', ['user:email'], { createIfNone: true })` will prompt the user to authorize and returns an access token. The extension can then send this token to our backend to log in. The backend would verify the token with GitHub or call GitHub’s API to get the user’s GitHub ID and email. Once verified, the backend can respond with a session token (e.g. a JWT) for use in subsequent communications.
2. **Use an external OAuth flow:** The extension can open an external browser to the backend’s GitHub OAuth URL. The user authorizes, and the backend redirects to a special URL that the extension can listen for (VS Code can register a URI handler like `vscode://your-extension-id/callback`). Upon receiving the OAuth callback (with a code or token), the extension completes login (perhaps storing a JWT from the server). This flow is similar to how the official GitHub Pull Requests extension works (it opens the system browser and then VS Code catches the callback).

Using the first approach (VS Code’s built-in GitHub auth) is simpler for the user (no leaving VS Code). The extension would then send the retrieved GitHub token to an endpoint like `/auth/github` on our server. The server verifies and responds with our app’s auth token (JWT or session cookie). The extension stores this token (possibly in VS Code’s global storage securely) and uses it for future connections.

**WebSocket Communication:** Once authenticated, the extension opens a WebSocket connection to the backend (e.g. `wss://api.yourapp.com` with maybe a path like `/ws`). We can use the Node `ws` package within the extension to create a client socket. (Yes, VS Code extensions can use Node packages – e.g., one Stack Overflow answer confirms *“You can use the `ws` package”* to open WebSocket connections from an extension.) The extension will maintain this connection as long as VS Code is running and user is logged in. All events (file opens, closes, etc.) are sent as JSON messages over this socket. The messages would include the user’s auth token (or the token could be used during the handshake, e.g. as a query parameter or initial message to authenticate the socket).

The extension should handle error cases: if the WebSocket disconnects (network issues), it should try to reconnect (exponential backoff) and possibly buffer any events during downtime to send later so data isn’t lost. It should also handle the case where the user has not logged in: perhaps queue events locally until login is done, or prompt the user to log in immediately on install.

**Security & Privacy:** The extension will **not** send actual code or file contents – only metadata like file name, project identifier, and timing info. This ensures we’re only tracking productivity metrics, not the code itself. All communication is over SSL (wss\://). Users will authenticate via GitHub, so no separate passwords are needed, reducing friction.

## Backend Server (Express.js, WebSocket, MongoDB)

**Purpose:** The backend’s job is to receive the streaming events from all connected VS Code extensions, authenticate and store that data, and provide an API for the dashboard to retrieve aggregated information. It also manages user authentication (GitHub OAuth flow) and possibly real-time updates to the dashboard.

**Tech Stack:** Node.js with Express.js for the web framework, using **express-ws** or the **ws** library to handle WebSocket endpoints. We will use **MongoDB** (via MongoDB Atlas in production) with Mongoose for schemas to store data. The server also integrates with GitHub OAuth – likely via the Passport.js middleware or a custom implementation – to handle login.

**WebSocket Endpoint:** We can set up a dedicated route for WebSocket connections, e.g. `/ws/activity`. Using the `express-ws` package makes this easy – you can define a WS route in Express and it gives a `ws` object to receive messages. Alternatively, we run a raw WebSocket server alongside Express. For simplicity: *“install both Express.js and ‘ws’ packages to provide our web server and WebSocket server, respectively”*. On server startup, we attach the WebSocket server to the HTTP server.

When a client (extension) connects to the WebSocket, the server will authenticate it. This can be done by requiring a query param or an initial message containing the user’s JWT (that was obtained after OAuth). If the JWT is valid (we verify its signature and maybe check user exists), we mark this socket as authenticated and store the userId in the socket’s session context. The server might keep a map of active connections keyed by user (to possibly send real-time updates or handle multiple devices).

**Receiving Events:** The extension will send JSON messages like:

```json
{ "type": "file_open", "file": "index.js", "language": "javascript", "timestamp": 1694455200000, "machineId": "ABC123" }
```

The server’s WebSocket handler will parse each message and insert a corresponding record into MongoDB. We might have a function `handleActivityEvent(userId, event)` that does this. For real-time processing, the insert should be quick (a single write). We may also do some light processing: for example, if the event indicates an **end of a focus session** (like `idle_start` or window blur), the server could calculate how long the session lasted by looking at the last “focus start” event. However, doing too much processing on the fly could slow down ingestion, so an alternative is to store raw events and compute aggregates when querying for the dashboard.

The server should acknowledge important messages. With plain WebSockets, typically one might not ack each message, but we could design the protocol such that the extension expects an ack for critical events (to optionally resend if no ack). Given this is not a financial system, a small data loss on disconnect might not be catastrophic, but ideally we ensure reliability via simple acks or by the extension buffering and checking last timestamp confirmed.

**Data Model (MongoDB):** We will have at least two collections: `users` and `activities`. Potentially a third for `machines` if we want to store device info separately (or we embed machine info in each activity or in user document).

* **User**: stores user information. Key fields:

  * `githubId`: the unique GitHub user ID (a number) or username. We can use GitHub ID as the primary key.
  * `username`: GitHub username (for display).
  * `avatarUrl`: perhaps store their avatar for UI.
  * `email`: if needed (GitHub API can provide it if user allows).
  * `createdAt` (when they first logged in).
  * Optionally, an array of `machines` (each with an id and maybe lastActive time or name).

  When a user logs in via OAuth, if their GitHub ID isn’t in the DB, we create a new user document. If it exists, we update any info needed. The session (JWT or cookie) will correspond to this user.

* **Activity**: stores events of user activity. Each document could represent a singular event or a summarized session. The schema needs to capture:

  * `userId` (reference to the `users` collection, or we can just store the GitHub ID).
  * `machineId` (string, to filter by device if needed).
  * `timestamp` (when the event occurred).
  * `eventType` (string, e.g. "open", "edit", "save", "focus", "blur", "idle\_start", "idle\_end", etc.).
  * `fileName` (maybe just the file name or path – possibly store relative path or project name).
  * `project` (optional, could be derived from the workspace folder name or Git repo name).
  * `language` (the language ID, e.g. "javascript").
  * `duration` (number of seconds or milliseconds, only for events that mark a period of time. For instance, we might create a special event like `focus_session` that has a start and end; instead of two separate events, we record one event with duration. Alternatively store start and end timestamps in one doc).

  The exact modeling can vary:

  * One approach: store granular events (open, close, etc.) and compute aggregate durations in queries. This is simpler to implement initially and flexible. For example, to get “time spent on file X today”, the backend would find all focus start and end events around file X and sum durations (or count heartbeats).
  * Another approach: have the extension send already aggregated sessions (start time, end time for a file or for a continuous coding session). This would reduce computation later. For instance, when the user stops coding on a file (either closes it or goes idle), the extension could send one event with a `duration` field of how long that file was active. This way the DB directly has “user spent N minutes on file Y from 10:00 to 10:30”.

We can combine both approaches: send fine-grained events for flexibility, and also higher-level events for convenience. For clarity, suppose we define:

* `FocusSession` event: when the user goes from idle to active, mark a session start; when they go idle again or stop, mark session end and duration. We could store a FocusSession doc with start, end, totalActiveTime.
* But to keep it simple, we might avoid multi-document transactions and just log points in time. The dashboard queries can interpret sequences of events into sessions.

We will also index the `activities` collection on fields like `userId`, `timestamp`, maybe `project`, to optimize queries (e.g. fetching a user’s last 7 days of activity sorted by time, or grouping by project).

**GitHub OAuth Implementation:** The backend will implement the OAuth 2.0 flow with GitHub as follows:

* **GitHub App Registration:** We register our app with GitHub to get a Client ID and Client Secret. We configure the OAuth callback URL to point to our backend (e.g. `https://api.myapp.com/auth/github/callback`).
* **Login Endpoint:** The backend exposes `/auth/github` which initiates the OAuth flow. When the user clicks “Login with GitHub” on the dashboard, it hits this endpoint. We redirect the user to GitHub’s authorization page with the appropriate scopes (probably just basic user info scope).
* **Callback Endpoint:** GitHub redirects back to `/auth/github/callback` with a temporary code. The backend then exchanges this code for an access token by calling GitHub’s token endpoint. After obtaining the GitHub access token, we fetch the user’s profile (GET `/user` API on GitHub) to get their GitHub ID, username, and email.
* **Create Session:** We then create a session for the user. If using Passport.js, at this point `passport.authenticate('github')` middleware would have already handled getting the profile, and we’d call `req.login` to serialize the user. If doing manually, we can create a JWT that contains the user’s ID. We then redirect the user to the dashboard front-end with the session in place. For example, if using cookies, the backend sets a secure cookie on the response. If using JWT in URL, we could redirect to the front-end with the token in a query param or fragment.

Using **Passport.js with the GitHub strategy** is a convenient option to manage a lot of this. For example, we can configure Passport with GitHubStrategy and have routes like: `app.get('/auth/github', passport.authenticate('github'));` and `app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/', failureRedirect: '/login' }));`. In Passport’s verify function, we would get the GitHub profile and either create or find a user in our DB, then call `done(null, user)`. According to a guide: *“The route `/auth/github` redirects the client to the GitHub login page. The route `/auth/github/callback` will be called if GitHub authentication is successful.”*. We will implement those routes similarly. The result is the user is logged in to our system (we can serialize the user info into a session or JWT).

For the VS Code extension, it likely won’t go through the redirect flow the same way (since it’s not a browser). If using the VS Code auth API (which returns a GitHub token), we’ll need a separate endpoint like `/auth/github/tokenLogin` where the extension sends a GitHub access token from VS Code. The backend can verify that token by calling GitHub (or using it to fetch the user profile), then respond with a JWT for the extension to use. This JWT can be used to authenticate the WebSocket connection (as mentioned above).

**API for Dashboard:** In addition to the WebSocket endpoint and auth routes, the backend will expose APIs for fetching the summarized data:

* For example, `GET /api/summary?range=weekly` might return total coding time in the last week, or data grouped by day.
* `GET /api/projects` could return a list of projects with total time.
* `GET /api/activity/timeseries?date=2025-06-09` could return an hourly breakdown for that date, etc.

These endpoints will query MongoDB, likely using aggregation pipelines. We could also use an ORM like Mongoose to define a schema and possibly use its query helpers. For example, to get total coding time today, we might sum all durations for events on today’s date for that user. If raw events are stored, we might instead sum the differences between start and end events.

**Real-time Considerations:** The system doesn’t strictly require pushing data to the web client in real-time (it could fetch on page load or refresh on an interval). However, since we have WebSocket capability, we could also have the dashboard open a WebSocket to get live updates. For instance, if the user is coding on one machine and also has the dashboard open on another screen, we could live-update “current active file” or increment timers in real-time. This could be a nice touch but is optional. If implemented, the backend could broadcast certain events to the user’s dashboard client (it would need to know which socket connections belong to the dashboard vs extension; easiest way is to have separate WS namespaces or paths, one for extensions to send data in, another for dashboards to subscribe).

**Scalability & Deployment:** The Express app can be containerized or hosted easily. We plan to deploy it on **Railway**, which can host Node.js servers. Railway will allow us to set environment variables for the GitHub client secret, MongoDB connection URL, JWT secret, etc. We need to ensure CORS is configured if the dashboard is on a different domain (Vercel domain) so that API calls from the dashboard’s browser can reach the backend. Also, enabling sticky sessions on WebSocket is usually not needed if we don’t store session state in memory (we will use JWTs to identify sockets, so any instance can handle any user’s messages as long as it can verify the token). We could in the future run multiple instances of the server behind a load balancer for scaling WebSockets (using something like a Redis pub/sub if we need to broadcast between instances). But initially, one server instance should handle quite a lot of concurrent connections, given the lightweight nature of events.

## Client Dashboard (Next.js + shadcn/ui)

**Purpose:** The dashboard is a web application where users can log in to view their coding activity stats and insights. It should be modern, clean, and user-friendly, using the **shadcn/ui** component library for a consistent UI. The dashboard communicates with the backend (over REST APIs or possibly WebSockets for live data) and presents visualizations like charts and summaries.

**Technology:** We use **Next.js** (a React framework) which allows server-side rendering and easy deployment to Vercel. The UI will be built with **Tailwind CSS** (shadcn/ui is essentially a set of pre-built Tailwind + Radix UI components). We will use the **App Router** in Next.js 13 for a simplified structure, and possibly NextAuth (if we wanted to integrate authentication easily) or a custom auth handling since our auth is via GitHub and our own backend.

**Authentication on Dashboard:** Users will click “Login with GitHub” on the dashboard. This will redirect them to our backend’s `/auth/github` as described. After successful login, the backend can redirect back to the Next.js app. If we use cookies for session, the cookie will be on the API domain; we might instead use a JWT. One approach is to have the backend redirect to something like `dashboard.yourapp.com/auth/callback?token=XYZ`. The Next.js app can read this token (perhaps in a page that captures the URL), store it (maybe in a cookie or localStorage), and then include it in API requests. Alternatively, we could use Next.js API routes to handle the OAuth callback – but since the backend already does it, we’ll likely keep it there to avoid duplicating logic.

Once logged in, the Next.js app will have an access token (or rely on a session cookie). We will then show the user’s dashboard. All API calls from the client (such as fetching activity data) will include this token (e.g., as `Authorization: Bearer <jwt>` header) so the backend can authorize and respond with the correct data.

**Dashboard Features:** We will provide multiple views of the data:

* **Today’s Summary:** e.g., “You coded for X hours Y minutes today, across Z files in Q projects. You had N coding sessions (focus periods) with M breaks.”
* **Charts:** Visualize data over time. For example, a line or area chart of coding time per day for the past week or month. A bar chart of coding time by project or by language. An “activity by hour” chart (heatmap or bar chart showing which hours of the day the user is most active).
* **Top Files/Projects:** A ranked list of where the user spent the most time. This can be a simple list or a bar graph.
* **Focus vs Idle visualization:** Perhaps a timeline for a given day highlighting coding sessions vs idle periods. Or simply statistics like “Longest focus session: 1h 20m, Avg session: 30m” etc.
* **Heatmap:** A calendar-like heatmap (like GitHub contributions graph) showing intensity of coding per day over weeks. This helps identify most productive days. (This might be a “stretch goal” feature, but it’s highly appealing and was noted by others: *generating “GitHub-style heatmaps” of activity*).

We will use **shadcn/ui** components for building the interface. This library provides pre-built components and even chart integrations. In fact, shadcn’s documentation provides a set of **chart components built with Recharts** that we can utilize: *“A collection of chart components that you can copy and paste into your apps. Charts are designed to look great out of the box... They work well with the other components and are fully customizable.”*. Under the hood, these use **Recharts** (a React chart library). We can use these for bar charts, line charts, etc., to visualize coding metrics.

For example, to show coding time by day, we might use a `<BarChart>` component (from Recharts) within a styled Card component from shadcn. The shadcn charts come with tooltip and axis components that match the design. We will keep the dashboard UI relatively simple and data-focused: using **Card** components to display key metrics, perhaps arranged in a grid for the summary (total time coded, number of projects, etc.), and using **Tabs** or navigation for different views (daily, weekly, projects, settings).

**UX Considerations:** The design should be clean and not overwhelming:

* We will likely have a sidebar or header navigation for the main sections (Dashboard, maybe a Settings page to manage profile or integration, etc.).
* The main dashboard page (after login) can start with a **headline statistic** (e.g., “Today: 4h 35m coding” in large text), then a breakdown by project or file.
* Charts should be interactive and labeled clearly. For instance, a bar chart for “Top 5 Projects this week” with project names and hours.
* We will use consistent color themes (shadcn’s default, which is based on Radix UI design tokens). Since developers often prefer dark mode, we’ll ensure the site is fully responsive to dark mode (shadcn/ui supports dark mode out of the box, matching the system or user preference).
* Use tooltips and maybe modals for extra info. For example, clicking on a specific day’s bar could show the files worked on that day and time spent.

**Example Dashboard UI:**

Below is an example of what a developer productivity dashboard might look like, with charts and stats summarizing coding activity (for illustration purposes):

**Figure: Example coding activity dashboard with daily coding time, project breakdown, and other stats**.

As shown, a typical layout includes summary cards at the top (today’s time, etc.), and charts or graphs below (e.g., a bar chart per day, project list, etc.). We can achieve similar visuals using our stack (Tailwind + shadcn components + Recharts).

To implement the dashboard frontend:

* We will set up Next.js pages (or use the new App directory). For example, the main page might be `/dashboard` which is a protected page that requires auth. If not logged in, user is redirected to landing or login.
* We will create React components for each chart or data display. For instance, a `ActivityChart` component that takes data and renders a Recharts line chart, a `ProjectsTable` component to list top projects, etc.
* We’ll integrate the **shadcn/ui** by installing it (their CLI or manual installation as per docs) to get components like `<Card>`, `<Table>`, `<Tabs>`, etc., styled consistently. Using these ready components will speed development and ensure a modern look and feel.

**Data Fetching:** We can use Next.js’s SSR or client-side data fetching depending on needs:

* For a personalized dashboard, we might use Next.js API routes or calls in `getServerSideProps` to fetch data on each page load (which would require the user’s token in the request).
* Alternatively, since we have a REST API on the backend, the front-end could be a purely client-side app that fetches data after render. For example, use React hooks (useEffect) to load the summary stats and then display. This might slightly delay showing data, but we can show a loading state.
* A hybrid approach: use Next’s server components to load some data (like a summary) and stream in more data if needed.

Given that we have to integrate with an external API backend (not using Next.js built-in API routes exclusively), we will likely treat the Next app as a client to the Express API. So client-side fetching with a library like SWR or React Query could be convenient for caching and updating data.

**State Management:** The dashboard is relatively simple – we can use React’s context or just pass data as props. If we use NextAuth or a custom auth context, we will store the user’s info and token globally (e.g., via a Context provider). That makes it easy to attach the token to API calls.

**shadcn/ui Advantages:** By using this library, we ensure:

* **Consistency:** All UI components (buttons, dialogs, etc.) have a consistent style (based on Tailwind CSS).
* **Accessibility:** shadcn’s components are built on Radix primitives, which handle focus management and ARIA attributes, so our dashboard will be accessible.
* **Development Speed:** Many pre-built components like navigation menu, dropdowns, theme toggle, etc., are available. For charts, as noted, we have pre-styled Recharts components we can utilize, which saves time in customizing the look of charts.

We’ll also follow good frontend practices: responsive design (so the dashboard could be viewed on different screen sizes), lazy-loading heavy components (like perhaps load charts only when they are in view or needed), and optimizing for performance (e.g., avoid very heavy queries on page load; maybe paginate or limit data, like only show top 10 projects at once, etc.).

## Database Schema

Using MongoDB with Mongoose, our schema designs might look like:

**User Schema:**

```js
const UserSchema = new mongoose.Schema({
  githubId: { type: String, unique: true, required: true },
  username: String,
  avatarUrl: String,
  email: String,
  machines: [{
    machineId: String,
    name: String,      // maybe store hostname
    lastActive: Date
  }],
  createdAt: { type: Date, default: Date.now }
});
```

* We ensure `githubId` is unique. We’ll likely query users by this. It can be a string or number (GitHub IDs are numbers, but can fit in JS Number).
* `machines`: optional subdocuments if we want to keep track of all machines a user has used. Each has `machineId` (the UUID or hostname we get from extension) and maybe a human-readable name (we could initially set it to the OS hostname). We can update `lastActive` whenever we get data from that machine.
* We may also add fields in future like preferences (e.g., preferred idle timeout override, etc.).

**Activity Schema:**

```js
const ActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, 
  githubId: { type: String, index: true },  // store GitHub ID for convenience, indexed
  machineId: String,
  timestamp: { type: Date, index: true },
  eventType: String,
  fileName: String,
  project: String,
  language: String,
  duration: Number  // in seconds (optional, for events that carry a duration)
});
```

Here we include both `userId` (Mongo objectId reference) and `githubId`. We could use one or the other as the primary reference. If we anticipate often querying by user, using the numeric GitHub ID as a key is handy (and allows not joining with user collection for simple lookups). The trade-off is some duplication of data, but it’s minor.

We index `userId` and `timestamp` because a common query will be “find all activities for user X in time range Y-Z”. Index on `timestamp` helps with sorting and range filtering, and compound index on (userId, timestamp) could be even better.

**Data Examples:**

* A file open event:

```json
{
  "githubId": "12345678",
  "machineId": "machine-abc-001",
  "timestamp": ISODate("2025-06-09T10:00:00Z"),
  "eventType": "file_open",
  "fileName": "app.js",
  "project": "MyProject",
  "language": "javascript"
}
```

* An idle start event (meaning user went idle at this time):

```json
{
  "githubId": "12345678",
  "machineId": "machine-abc-001",
  "timestamp": ISODate("2025-06-09T10:30:00Z"),
  "eventType": "idle_start",
  "fileName": "app.js",
  "project": "MyProject",
  "language": "javascript",
  "duration": 1800  // maybe we include how long the session was active before idle (in sec)
}
```

In this example, if the extension knew the user was working from 10:00 to 10:30 on app.js, it could directly send an idle\_start with duration 1800 seconds, indicating a 30-minute session ended.

Alternatively, we might log a separate event for session start and session end. For clarity, it might be better to have explicit session records:

* A `session_start` when user becomes active (with maybe file or project context).
* A `session_end` when idle, with a duration.

However, combining into one event with duration (like the idle\_start carrying the duration of the focus period that just ended) is an efficient representation (one record per session rather than two).

We also consider a **Daily Summary** collection or cache: We could pre-aggregate daily totals and store them to speed up dashboard queries. For example, each day we could sum up total time and store a record:

```json
{ "userId": X, "date": "2025-06-09", "totalSeconds": 14400, "projects": { "ProjA": 7200, "ProjB": 7200 } }
```

But such caching can be added later if needed. Initially, querying the raw events with MongoDB’s aggregation should suffice.

**Scaling Data Storage:** Each event is small (few hundred bytes at most). Even if a user is very active (say 8 hours coding generating perhaps an event every minute or more), that’s maybe 480 events/day, which is fine. For 1000 users, that’s 480k events per day in the worst case, which MongoDB can handle with proper indexing. Over time, if data grows, we might purge or archive older fine-grained events and keep summaries, but as a first implementation, storing everything is okay.

We will use **MongoDB Atlas** which gives us a highly available cluster and easy scaling. We just need to ensure to create the indexes on key fields for performance.

## Step-by-Step Implementation Plan

To build this project in a structured way, we will proceed in stages for each component and then integrate them:

**1. Scaffold the VS Code Extension:**

* Use Yeoman or VS Code’s extension generator to initialize a new extension project (TypeScript). This creates the basic `extension.ts` and configuration needed to package an extension.
* In `package.json` of the extension, declare needed permissions (if any) and include the `ws` library dependency for WebSocket, and possibly a UUID library. Also include the contribution points if we have any commands (like a “Login” command in the Command Palette).
* Implement a basic `activate` function in `extension.ts` that, for now, maybe just prints to console and sets up a simple command (for testing).

**2. Set Up the Backend Server:**

* Initialize a Node.js project (Express). Install Express, `ws` (or `express-ws`), Mongoose, and Passport (with passport-github2 if using Passport for OAuth).
* Create a simple Express app in `src/index.ts` that has a health check route and listens on a port. Set up MongoDB connection using Mongoose (`mongoose.connect(connectionString)`).
* Implement the WebSocket server: If using `express-ws`, do `const expressWs = require('express-ws')(app)` and then define a route `app.ws('/ws', (ws, req) => { ... });`. Inside, handle incoming messages and parse JSON.
* For now, create a placeholder handler for messages that just logs them or stores them in an in-memory array for testing.

**3. Implement GitHub OAuth (Backend):**

* Register a GitHub OAuth app to get client ID/secret. Configure redirect URL to point to a dev URL (e.g. `http://localhost:3000/auth/github/callback` if running locally).
* In Express, set up Passport:

  * `passport.use(new GitHubStrategy({ clientID, clientSecret, callbackURL }, verifyFunc ))` where verifyFunc finds/creates a user in DB.
  * Use sessions or JWT: For simplicity in early dev, you can use sessions (Express-session or cookie-session and Passport’s serialize/deserialize). This stores user in a server session (which is fine if the dashboard and server share origin or if using cookies).
  * Create routes: `app.get('/auth/github', passport.authenticate('github'))` and `app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/auth/success', failureRedirect: '/auth/error' }))`.
  * Also, define `/auth/success` to send an HTML or script that notifies the front-end (for example, it could just redirect to the dashboard page with a flag).
  * If using JWT instead of cookie session, then in the callback route, we can generate a token and send it in a query redirect: e.g., redirect to `frontendurl?token=...`.
* Test this flow in isolation by hitting the login URL and ensuring a user gets created in DB and session is established.

**4. Create User and Activity Models (DB):**

* Define Mongoose schemas for User and Activity as discussed. Implement the logic in the OAuth verify function to create a user if not exists.
* Also add an API endpoint like `GET /api/me` that returns current user info (to test session working) and maybe `GET /api/activities` to list recent events (just for debugging initially).
* Ensure the server can connect to a local MongoDB instance or Atlas (for dev, you can use Docker or a local Mongo).

**5. Extension: Implement Authentication Flow:**

* Using the VS Code API, implement a command (e.g., `Activate: Login to Tracker`) that triggers GitHub auth. The easiest might be `vscode.authentication.getSession('github', scopes, { createIfNone: true })`. This will open GitHub in the browser and once user accepts, return a session with `accessToken`.
* In the extension, once we get the GitHub `accessToken`, call the backend (e.g., `https://api.myapp.com/auth/vscode`) with this token. Implement this route in the backend to accept a GitHub token, verify it (perhaps call `https://api.github.com/user` with it), then respond with a JWT for the extension.
* Store this JWT in the extension (perhaps in `context.globalState` or secure storage API if available).
* Now, when opening the WebSocket, include this JWT for authentication. For example, connect to `wss://api.myapp.com/ws?token=JWT`. On the server, the initial handshake can read the token query and verify user.
* Alternatively, if not comfortable passing token in query, the extension can immediately send a message after connect: `{ type: "auth", token: "JWT" }` which the server checks and marks the connection as authenticated. Subsequent messages must be ignored until auth passes.
* Test this flow: run backend locally, use the extension (in VS Code debug) to attempt login, ensure the JWT is received and WebSocket connects. Log on server side to verify.

**6. Extension: Capture and Send Events:**

* Now implement the event listeners in the extension activation:

  * `vscode.window.onDidChangeActiveTextEditor` -> on trigger, get details of the new editor (`editor.document.fileName`, `editor.document.languageId`). If there was a previous active file being tracked, compute its duration (from last switch time) and send a “file\_focus\_ended” event for that file. Then send a “file\_focus\_started” for the new file (or simply a generic “file\_open” event with timestamp).
  * `vscode.workspace.onDidOpenTextDocument` -> this might be redundant if we cover active editor change, but could log events for completeness.
  * `vscode.workspace.onDidSaveTextDocument` -> send a “file\_save” event with file name and timestamp.
  * `vscode.workspace.onDidChangeTextDocument` -> do not send every keystroke (would be too frequent), but use it to update an `isIdle` timer. E.g., on any change, record `lastActivityTime = now`. Use a `setInterval` timer (say every 60 sec) to check if `now - lastActivityTime > idleThreshold` – if so, user went idle. If not, send a heartbeat event.
  * `vscode.window.onDidChangeWindowState` -> if `focused === false`, immediately send an “idle\_start” event (because user alt-tabbed away). If `focused === true` and we were previously unfocused, send an “idle\_end” or a new “session\_start” event.
* Manage state within the extension: track the current active file and start time, track whether currently in an idle state or active state, etc., so that duplicate events aren’t sent. For instance, only send an “idle\_start” once when going idle, and send an “idle\_end” when coming back.
* As events occur, format a JSON message and send via the WebSocket. Ensure to include `userId` or token (though token likely already associated with socket), and `machineId`. Possibly the server doesn’t need userId in each message because the connection is tied to a user after auth – but including it doesn’t hurt for log completeness.
* Test by actually performing actions in VS Code (open a file, type, save, etc.) and see if the server logs the incoming events correctly. Adjust as needed (e.g., reduce noise if too many events; maybe implement minimal throttling on onDidChangeTextDocument to not spam).

**7. Dashboard: Setup Next.js Project:**

* Use `npx create-next-app@latest` to create the Next.js app (TypeScript). Integrate Tailwind CSS (the Create Next App can initialize it or do manual setup).
* Install shadcn/ui library. According to shadcn docs, either use their CLI (`npx shadcn-ui@latest init`) or manual steps: add the shadcn dependencies (which likely include Radix UI and class-merge utilities, etc.). Then use the CLI to add components like `npx shadcn-ui add card chart button` etc. This will generate pre-styled components in the project (under `components/ui`).
* Create a basic page structure: e.g., `app/page.tsx` could be a landing page or redirect to `/dashboard` if logged in. Create `app/dashboard/page.tsx` for the main dashboard.
* Implement a simple auth context: e.g., a `AuthProvider` that on mount checks for a token (maybe in cookie/localstorage) and if not present, redirect to login. For development, we can simulate login by manually storing a token.
* We could also integrate **NextAuth.js** with a custom provider for GitHub that points to our backend, but that might be overkill since we already have our OAuth handled. Instead, after OAuth login, we get a token and just store it.

**8. Dashboard: Implement Data Display (Static / Mock):**

* Before hooking up actual APIs, design the UI components with mock data. Create a few components:

  * `StatsCard` – a card showing a single stat (e.g., “Coding Time Today: 4h”).
  * `ActivityChart` – perhaps a line chart for last 7 days. (Use the shadcn chart component: basically a wrapper around Recharts. We can copy an example from shadcn’s docs, which show how to set up a `<BarChart>` inside a `<Card>`.)
  * `ProjectList` – maybe a simple table or list of top projects with time.
  * `TimeOfDayChart` – maybe a 24h heatmap or bar chart showing which hours the user codes. (This could be a horizontal bar for each hour, or a donut of distribution.)
* Lay out the Dashboard page: e.g., a 2x2 grid of cards for summary stats, then a section for charts. Use shadcn’s responsive grid (could just use Tailwind classes like `grid grid-cols-2 gap-4` etc. since Tailwind is set up).
* Ensure it looks fine in light and dark mode. Use some sample Tailwind classes from shadcn’s examples to style text (they often use a muted color for secondary text, etc.).

**9. Dashboard: Connect to Backend API:**

* Set up environment configs to know the backend API URL (in dev, maybe `http://localhost:3000`, in prod an env like `API_BASE_URL`).
* Use `fetch` or a library to call the API endpoints. For example, in `dashboard/page.tsx`, use `getServerSideProps` or `useEffect` to fetch `/api/summary` and `/api/projects` etc.
* Implement corresponding API endpoints in the Express server:

  * e.g., `GET /api/summary?range=weekly` will aggregate the last 7 days from Activity collection for that user. (In Mongo, something like: filter by user and timestamp > now-7days, group by date and sum durations.)
  * `GET /api/projects?range=weekly` similarly groups by project.
  * If needed, implement a `GET /api/daily?date=YYYY-MM-DD` to get detailed breakdown for that day (for a timeline view).
* Secure these routes: the backend should check the session or JWT. If using cookie session, ensure the Next.js fetch sends credentials (or use the cookie stored from OAuth). If using JWT, include it in the fetch headers (`Authorization`). We’ll need to include that in our fetch call from Next. Possibly store the token via Next’s API routes to avoid exposing it in client, but since it’s a JWT for that user only, it’s fine to use in client-side calls.
* Once the data flows, bind it to the components. Format the time durations nicely (e.g., seconds to hours/min string).
* Test end-to-end: run the extension to generate some activity (or manually insert some events in DB), then login on the dashboard and see if it displays correctly. Adjust queries if data doesn’t match expectations.

**10. Implement Additional Features:**

* Multi-device merging: ensure if you simulate two different machineIds for same user, the dashboard still shows combined data. This should naturally happen if we query by userId only. If we want to show per-device breakdown, we can add filters in UI or a toggle to show combined vs by device.
* Focus session logic on backend: perhaps create an endpoint `/api/focus` that calculates number of sessions and average session length for a period. Or include it in summary.
* Possibly implement a real-time component: e.g., on the dashboard, show “Currently coding in: <file> on <machine>” if the user is actively coding. This could be done by having the server broadcast the latest active file event via WebSocket to the dashboard. If we do this, we’ll also implement a small WS client in the dashboard Next.js app.
* Add a settings or profile page in the dashboard that shows the user’s info (GitHub name, maybe an option to disconnect or logout which would simply clear the session).

**11. Testing & QA:**

* Write unit tests for critical functions (if time permits): e.g., a function that processes raw events into sessions.
* Do manual end-to-end tests: e.g., start coding, stop coding, see that idle is detected and session recorded correctly, then see that reflected on the dashboard. Test on multiple machines (simulate by using two different VS Code with different machine IDs).
* Security test: ensure an unauthorized request to API is rejected (try calling APIs without token, should 401). Also ensure that one user cannot access another’s data (JWT should scope to one user).
* Performance test (basic): simulate a high frequency of events (maybe loop sending dummy events via WS) and see that the server handles it and data gets stored. MongoDB can be tested for query performance on large data volumes (we can generate dummy data for a year and see if the aggregation is still quick, adding indexes as needed).

**12. Deployment Preparation:**

* Set up GitHub repositories (one or multiple). Add environment configuration for production:

  * For the extension: we’ll eventually package it via `vsce` (Visual Studio Code Extension tool) and it doesn’t need server credentials baked in (server URL can be in settings or well-known if public).
  * For the backend: prepare a production config (e.g., NODE\_ENV=production, proper MongoDB Atlas URI, GitHub OAuth callback pointing to production domain, JWT secret).
  * For the Next.js app: configure environment variables for API base URL, and Vercel project settings for domain.
* We will likely need to adjust the OAuth app settings on GitHub to include the production callback URL (and possibly separate dev vs prod apps).
* Ensure CORS settings on the Express app allow the frontend domain to make requests (using something like `app.use(cors({ origin: 'https://yourapp.vercel.app', credentials: true }))` if using cookies).
* Prepare the database on Atlas (create cluster, set up user and password, whitelist IP or use VPC/peering depending on hosting).

**13. Deployment:**

* **Backend on Railway:** Push the server code to a GitHub repo. On Railway, create a new project from this repo. Set environment variables:

  * `MONGODB_URI` (from Atlas),
  * `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
  * `JWT_SECRET` (if using JWT),
  * any other needed config (e.g., `APP_BASE_URL` for constructing redirect URIs).
    Railway will build and run the Express app. Ensure that the WebSocket route is working (Railway supports plain WebSockets on the deployed domain).
* **Database:** Already on Atlas, just ensure the network access is configured (if Railway gives a static IP or you might set Atlas to accept all for now or use DNS).
* **Next.js on Vercel:** Connect the Next.js repo to Vercel for CI/CD. Set the environment vars in Vercel:

  * `NEXT_PUBLIC_API_BASE_URL` = the URL of the Railway app (so the client knows where to fetch data).
  * If using any secrets in frontend (ideally none, since the secret stuff stays server-side).
  * We might not use Next’s server-side much, but if we had any, ensure the same env vars for calling backend.
    Deploy the app. Vercel will give a domain, e.g., `myapp.vercel.app`. We should configure GitHub OAuth allowed callback to this domain as well (if the OAuth flow passes through the frontend).
* **VS Code Extension:** Update the extension’s WebSocket URL to the production backend. Also, if any OAuth flow in extension, update URLs to production. Then package the extension (`vsce package`) and publish it to the VS Code Marketplace (you’d need a publisher ID). This might be done after some testing in production environment.

**14. Monitoring and Maintenance:**

* Set up logs and monitors. Railway provides logs; we can also integrate something like Logflare or another logging service for more permanent log keeping. MongoDB Atlas has its own monitoring for slow queries – ensure indices are in place if any slow query is detected.
* For front-end, consider analytics or error tracking (Sentry) to catch any runtime errors users face.
* Provide documentation for users: e.g., how to install extension, link to the dashboard, etc. Perhaps the dashboard homepage (when not logged in) is a simple landing page with instructions and a login button.

By following these steps, we develop each piece methodically and ensure integration points (auth tokens, API formats) line up correctly.

## Data Visualization & UX Recommendations (shadcn/UI)

Using **shadcn/ui** for our Next.js dashboard means we have access to a set of polished components that follow modern design standards. Here’s how we leverage them and ensure a great UX:

* **Overall Aesthetic:** shadcn/ui is built on top of Tailwind and Radix UI, which yields a clean, “developer-centric” look (lots of subtle grays, good spacing, etc.). This aligns well with a productivity app – it should look minimal and not distracting. We’ll use the default theme which is sleek and ensure our added charts follow the same style (colors, fonts).

* **Responsive Design:** The components are largely responsive by default (using fluid width etc.). We will ensure that the dashboard layout adjusts to smaller screens. For instance, the summary cards might stack vertically on mobile instead of a grid. We can test using Chrome’s device emulator to polish the CSS.

* **Navigation & Flow:** Provide clear navigation. Possibly a top navigation bar with the app name and a profile menu (showing GitHub avatar and a logout button). Or a side navigation if more sections (but our app is fairly straightforward, so a top bar might suffice).

* After login, the first view is the **Dashboard**. This should highlight key information first:

  * *Today’s coding time* prominently. Perhaps as a big number with an icon of a clock or code.
  * Possibly compare it to yesterday (to give context), e.g., “You’re 1 hour above yesterday”.
  * Show if the user has reached a personal goal (if we had such a feature like daily goal hours).

* **Charts and Graphs:** Visualizations make data easier to consume. Use the shadcn chart components which are based on Recharts for a smooth integration. According to shadcn’s Chart documentation: *“We use Recharts under the hood… build your charts using Recharts components and only bring in custom components such as ChartTooltip when needed.”*. We can utilize ready components like `<ChartContainer>`, `<ChartTooltipContent>` provided by shadcn’s examples to have consistent styling.

  * For example, a bar chart for weekly activity: X-axis days of week, Y-axis hours coded. Each bar colored with a theme color (shadcn’s default might give us a nice blue or we can customize).
  * A pie chart or bar chart for language breakdown (if we want to show what languages the user spent time on).
  * The GitHub-style heatmap could be implemented with a grid of colored squares. There isn’t a pre-made component for that in shadcn, but we can either find a small library or craft a simple one using a CSS grid of 7 columns (days of week) and \~52 rows (weeks) highlighting intensity. This might be an advanced feature for later.

* **Interactivity:** Use tooltips on charts to show exact values on hover. For instance, hovering a bar on the weekly chart shows “Tuesday: 3h 40m”. Recharts via shadcn can handle that – there’s a `<ChartTooltip>` component in their library.

* **shadcn Components for Layout:** Use **Card** components to group related info. For example, each summary metric can be a Card with a header and value. Use **Tabs** if we want to let the user toggle the time range (e.g., a toggle between “Week / Month / Year” or “Projects / Files”). shadcn/ui likely has a Tabs component (built on Radix Tabs).

* **Consistency with VS Code theme:** The extension itself doesn’t have a UI beyond maybe a status bar item or command, but the web app can mirror some of VS Code’s feel. For instance, supporting dark mode automatically means if a user primarily uses VS Code in dark, our dashboard will appear in dark theme too, creating a cohesive feel. The extension might open the dashboard in a browser – it would be nice if the user doesn’t get a blinding white page in the night. With Tailwind and shadcn, enabling dark mode (via `media` or class strategy) is straightforward. We ensure all elements adapt (shadcn’s default components do support dark mode via the `dark:` classes).

* **Performance & UX:** The dashboard should load fast. Next.js will help by server-rendering some content. We should keep the bundle size in check by only including necessary components. The charts (Recharts) add some weight, but we will only load them on the page where needed. If needed, we can dynamic import charts so they don’t block initial page load.

* **Guidance and Empty States:** For a new user (with no data yet), the dashboard should not just be blank. We can detect if no activity is present and show a friendly message like “No activity logged yet. Install the VS Code extension and start coding to see your stats!” possibly with a link to installation instructions. This improves UX for first-timers.

* **Accessibility:** The UI components being based on Radix means keyboard navigation and screen reader labels should be handled. We’ll ensure to add alt text to any images or custom SVGs, and use proper semantic HTML (e.g., use `<table>` for project lists if tabular, etc.). This ensures the app can be used by those with assistive tech.

* **User Customizations:** Perhaps not in v1, but consider allowing the user to set some preferences on the dashboard, like “daily coding goal” or “preferred working hours” to contextualize data. Using the design system, implementing a simple settings modal or page is easy.

Finally, we want the dashboard to **motivate healthy coding habits**. So we might include nudges in the UI, like if a user has been coding non-stop for many hours, highlight that in a gentle way (“You’ve been coding for 5 hours straight – remember to take a short break for your wellbeing!”). Or if the user’s coding time drastically drops or increases week over week, the UI could display a note (maybe with a little icon, all in good spirit). These are optional enhancements for user engagement.

## Deployment Suggestions

Deploying this full-stack project will involve hosting the three components in suitable services:

* **VS Code Extension:** This is not a server component, but we will publish it through the VS Code Marketplace for users to install. You’ll need to create a publisher (through vsce command line) and upload the VSIX package. Microsoft typically approves extensions quickly, and then users can install it by name. The extension just needs to know the backend’s URL (which for production would be a stable domain, e.g. `wss://api.yourapp.com`).

* **Backend (Express server) on Railway:** Railway is a great choice for hosting Node.js apps easily. We will containerize (or Railway can auto-build via our package.json). Steps:

  * Set up the project in Railway, link to GitHub for CI/CD.
  * Define environment variables in Railway:

    * `PORT` (Railway usually sets this automatically).
    * `MONGODB_URI` (connection string to Atlas).
    * `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` (for OAuth).
    * `SESSION_SECRET` or `JWT_SECRET`.
    * Perhaps `ALLOWED_ORIGIN` (the frontend URL for CORS).
  * Railway will give a domain like `yourapp.up.railway.app`. We might use a custom domain (like api.yourapp.com) mapped to it for cleanliness. Railway supports custom domains with HTTPS.
  * Make sure to enable metrics or logs on Railway to monitor memory/CPU since WebSockets can keep connections open. If scaling becomes needed, Railway allows increasing plan or instances.
  * **WebSocket Note:** Ensure that any proxy or CDN in front supports WebSockets (Railway’s does). If we put Cloudflare in front, for example, we’d need to configure it to allow WS upgrades. But likely we’ll connect directly to Railway’s endpoint or custom domain pointing to it.

* **Database on MongoDB Atlas:** Create a cluster (probably M0 free tier might suffice for testing, but for many users, M10 or higher for production). Use a highly available cluster (Atlas gives a 3-node replica set even for lower tiers, which is good). Steps:

  * Create a database user with strong password, whitelist the backend’s IP or use Atlas’s network peering if Railway offers it. (Alternatively, since Railway’s IP can change or if dynamic, you might allow access from anywhere but that’s less secure – better restrict by some means).
  * Put the connection string in Railway’s config.
  * Set up an index in the `activities` collection on `{ userId: 1, timestamp: 1 }` for performance. This can be done via Mongoose (define in schema) or manually in Atlas UI.
  * Plan backup/retention if needed (Atlas has backup options if on certain tiers).
  * Monitor usage; if our data grows a lot, we might need to archive or scale the cluster.

* **Next.js Dashboard on Vercel:** Vercel is the recommended platform for Next.js and offers a frictionless deployment. Steps:

  * Create a new project on Vercel and import the GitHub repo for the dashboard. Vercel will auto-detect it’s a Next.js app and deploy. It also provides preview deployments on each branch which is nice for testing changes.
  * Configure environment variables on Vercel:

    * `NEXT_PUBLIC_API_BASE_URL` = e.g. `https://api.yourapp.com` (pointing to Railway backend). The `NEXT_PUBLIC_` prefix means it will be exposed to frontend JS (which is fine, it’s just an endpoint).
    * If using any other secret for build (probably not).
    * If the dashboard itself needed to handle OAuth (e.g., using NextAuth with GitHub), we’d have GitHub secrets here too, but since we delegated to backend, we don’t need that on Vercel.
  * We might need to adjust the callback URL flow: after OAuth on backend, we redirect to the dashboard. Ensure that URL (the Vercel domain) is allowed in GitHub OAuth app settings.
  * Vercel will give a domain like `yourapp.vercel.app`. We can set up a custom domain (e.g. `app.yourapp.com`) and point DNS to Vercel. Also, ensure our backend’s CORS includes this domain.
  * Vercel handles SSL automatically. It also handles scaling; our Next.js app mostly serves static/SSR content and some client JS, which Vercel’s edge network will cache.

* **Domain Setup:** If you have a custom domain, say `yourapp.com`, you might set:

  * `api.yourapp.com` CNAME to Railway’s provided host (or an A record if IP given).
  * `app.yourapp.com` CNAME to alias of Vercel deployment.
  * Alternatively, you could unify under one domain with paths, but splitting domains is fine and often easier given different hosts.

* **Monitoring & Analytics:** Consider adding a simple analytics for the web app (even Vercel Analytics or Google Analytics) just to know active users, etc., and track front-end performance. On the backend, use something like Sentry for error tracking or Railway’s built-in error logs.

* **Scaling Consideration:**

  * For backend, if we needed to scale to more instances (for more WebSocket connections or throughput), we would have to ensure sticky sessions if using cookies (or better, use JWT stateless so any instance can auth). We might also need a way for instances to share state if we start doing live pushes (like if one instance receives an event and needs to push to a dashboard socket that’s connected to another instance). Solutions include using a message broker or Redis pub/sub to broadcast events to all instances so the right one can forward to the dashboard. This is similar to how Socket.io with multiple servers requires a Redis adapter. Initially, we can avoid this complexity by running a single instance or by not doing cross-communication (each WS connection only cares about its own events – extension to server to DB, and dashboard will fetch from DB rather than subscribe, so that decouples them).
  * MongoDB can handle a lot, but if write volume becomes huge, we can consider sharding or at least scaling vertically (Atlas makes it easy to upgrade instance size). For read-heavy (if many users constantly refreshing dashboards), ensure queries are optimized. We can add caching at the API layer (e.g., cache the last 5 minutes of summary for a user in memory or Redis) if needed.

* **Cost Management:** Using Vercel and Atlas M0 we can start nearly free. Railway has a free tier as well, but WebSocket might require always-on instance (likely need a paid tier or use Railway’s free credits and then it might sleep, which isn’t ideal for WS). Possibly use Render.com or Fly.io as alternatives if needed (they often have free tiers for small usage). But given the scope, a small paid instance on Railway for the backend might be necessary for reliable WebSocket connections (some free tiers don’t allow long-lived connections or have short timeouts).

In summary, the deployment will involve three separate deployments (extension to marketplace, server to Node hosting, client to Vercel). Once deployed, a user experience flow is:

* User goes to our app site (hosted on Vercel) and clicks Login with GitHub.
* They get redirected to GitHub and back, establishing a session.
* They install the VS Code extension from the Marketplace.
* In VS Code, they run “Login” (if not automatically detected) which uses GitHub auth and connects to the backend.
* Now as they code, data flows to backend, and when they open the dashboard, they see their data.

All components use modern, widely-supported tech and can scale. The choices ensure minimal maintenance: Vercel auto-builds the front-end on push, Railway auto-deploys backend on push, and Atlas is managed DB. This setup should allow the small team to focus on features and quality without worrying about server maintenance.

# SportsBook - Socket Synchronization Server

The SportsBook Socket Synchronization Server is a dedicated Node.js service designed to manage real-time event broadcasting and state synchronization across the SportsBook ecosystem. It acts as a centralized hub, ensuring that the User Platform and Admin Portal maintain consistent data without requiring manual client-side polling.

## Core Responsibilities

The server manages several critical real-time data streams:

- **Live Match Broadcasting**: Relays instant score updates and match status changes from administrative sources to all active user clients.
- **Facility Occupancy Monitoring**: Updates live density metrics and heatmaps for campus sports facilities.
- **Resource Availability**: Notifies clients immediately when court bookings, equipment status, or session availability changes.

## Communication Patterns

The server utilizes two primary communication patterns for efficient data delivery:

### 1. Room-Based Updates (Targeted)
Clients join specific rooms based on the sport or facility they are viewing (e.g., `sport:cricket`). This ensures that updates regarding specific facility availability are only sent to interested users, minimizing unnecessary network traffic.

### 2. Global Broadcasts (All-Client)
Critical platform-wide events, such as match score updates or system notifications, are broadcast to all connected clients simultaneously.

## Security and Internal API

The server exposes a secure internal API that allows other SportsBook platforms to trigger broadcasts. These endpoints are protected by a shared secret mechanism:

- **Validation**: All incoming POST requests must provide a valid `x-socket-secret` header.
- **Endpoints**:
    - `POST /notify-update`: Used by the backend to trigger availability or occupancy changes for specific sports.
    - `POST /notify-matches`: Triggers a global update event for the live scoring interface.

## Tech Stack

- **Runtime**: Node.js 20+
- **Engine**: Socket.io 4.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Transport**: WebSocket (Exclusive)

## Installation and Local Setup

### 1. Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
PORT=""
SOCKET_INTERNAL_SECRET=""
```

### 2. Dependency Installation
Install the necessary packages and TypeScript tools:
```bash
npm install
```

### 3. Execution
To run the server in development mode with hot-reloading:
```bash
npm run dev
```

For production environments, build the project and start the compiled JavaScript:
```bash
npm run build
npm start
```

## Production Considerations
When deploying this service independently:
- **CORS Configuration**: The server is currently configured with permissive CORS for development. In production, the origin should be restricted to the specific domains of the User and Admin platforms.
- **Transports**: The server is locked to the WebSocket transport to ensure low-latency communication and avoid long-polling overhead. Ensure your load balancer supports WebSocket upgrades.
# SportsBook - Socket Synchronization
This is a Node.js server that manages real-time communication across the entire SportsBook ecosystem. It ensures that data remains synchronized between the User Platform and the Admin Portal without manual refreshes.
## Purpose
This server handles:
- **Live Match Updates**: Broadcasting scores from Admin to all Users.
- **Occupancy Tracking**: Real-time updates for facility density.
- **Booking Notifications**: Instant alerts when availability changes.
## Technical Implementation
- **Engine**: Socket.io
- **Runtime**: Node.js
---
## Setup &
### 1. Installation
```bash
npm install
```
### 2. Environment Configuration
Create a `.env`:
```env
PORT=3005
SOCKET_INTERNAL_SECRET=""
```
*Note: The `SOCKET_INTERNAL_SECRET` is used for secure server-to-server notifications from the platforms.*

### 3. Execution
```bash
npm run dev
```
---

## 📡 Internal API Endpoints
The server exposes limited POST endpoints for the platforms to trigger global broadcasts:
- `POST /notify-update`: Broadcasts availability or occupancy changes.
- `POST /notify-matches`: Triggers a global refresh of active match data.
*All internal requests must include the `x-socket-secret` header.*
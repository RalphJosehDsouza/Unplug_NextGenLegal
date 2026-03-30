# WebRTC Video Calling Feature - Implementation Guide

## Overview

A complete WebRTC video calling system has been integrated into NextGenLegal, enabling real-time peer-to-peer video consultations between citizens and lawyers. The system uses Socket.io for signaling and simple-peer for WebRTC connections.

## Architecture

### Components

1. **Backend (Node.js + Express)**
   - WebRTC signaling endpoints
   - Database models for call state management
   - Socket.io server for real-time communication

2. **Frontend (React + TypeScript)**
   - Video call UI components
   - Socket.io client integration
   - Simple-peer wrapper for peer connections

### Technology Stack

- **WebRTC Library**: simple-peer 9.11.1
- **Signaling Protocol**: Socket.io 4.7.2
- **ICE Servers**: Google STUN servers (stun.l.google.com, stun1.l.google.com)
- **TURN Server**: Optional (configurable via environment variables)

## Database Schema

### Booking Model Extensions

Added fields to the `Booking` model:

```javascript
- call_status: ENUM('pending', 'accepted', 'scheduled', 'active', 'completed', 'rejected')
- scheduled_call_time: DATE (when the call is scheduled)
- webrtc_room_id: STRING (unique identifier for the video room)
- call_started_at: DATE (timestamp when call started)
- call_ended_at: DATE (timestamp when call ended)
```

### Database Migration

Run the migration to update your database:

```bash
npm run db:migrate
```

## API Endpoints

### WebRTC Endpoints

All endpoints require authentication via JWT token.

#### 1. **POST /api/webrtc/initiate**
Citizen initiates a video call request.

**Request:**
```json
{
  "booking_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video call initiated",
  "data": {
    "booking_id": "uuid",
    "call_status": "pending",
    "webrtc_room_id": "room_xxx",
    "citizen_name": "John Doe",
    "lawyer_name": "Jane Smith"
  }
}
```

#### 2. **POST /api/webrtc/accept**
Lawyer accepts the incoming call request.

**Request:**
```json
{
  "booking_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video call accepted",
  "data": {
    "booking_id": "uuid",
    "call_status": "accepted",
    "webrtc_room_id": "room_xxx"
  }
}
```

#### 3. **POST /api/webrtc/reject**
Lawyer declines the call request.

**Request:**
```json
{
  "booking_id": "uuid"
}
```

#### 4. **POST /api/webrtc/schedule**
Lawyer schedules the call for a specific time or starts immediately.

**Request:**
```json
{
  "booking_id": "uuid",
  "start_immediately": true,
  "scheduled_time": "2024-03-31T15:00:00Z"  // Optional if start_immediately is true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video call scheduled",
  "data": {
    "booking_id": "uuid",
    "call_status": "active" | "scheduled",
    "webrtc_room_id": "room_xxx",
    "scheduled_call_time": "2024-03-31T15:00:00Z"
  }
}
```

#### 5. **POST /api/webrtc/end**
End the video call session.

**Request:**
```json
{
  "booking_id": "uuid"
}
```

#### 6. **GET /api/webrtc/status/:booking_id**
Get current call status.

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "call_status": "active",
    "webrtc_room_id": "room_xxx",
    "scheduled_call_time": "2024-03-31T15:00:00Z",
    "call_started_at": "2024-03-31T15:05:00Z"
  }
}
```

## Socket.io Events

### Server-to-Client Events

#### `incoming-call`
Sent to lawyer when citizen initiates a call.

**Data:**
```javascript
{
  booking_id: "uuid",
  citizen_id: "uuid",
  citizen_name: "John Doe"
}
```

#### `call-accepted`
Sent to citizen when lawyer accepts the call.

**Data:**
```javascript
{
  booking_id: "uuid",
  message: "Lawyer accepted your call request"
}
```

#### `call-rejected`
Sent to citizen when lawyer declines the call.

**Data:**
```javascript
{
  booking_id: "uuid",
  message: "Lawyer declined your call request"
}
```

#### `call-scheduled`
Sent to citizen when lawyer schedules the call.

**Data:**
```javascript
{
  booking_id: "uuid",
  scheduled_time: "2024-03-31T15:00:00Z",
  webrtc_room_id: "room_xxx",
  message: "Your video call has been scheduled"
}
```

#### `webrtc-offer`
SDP offer for WebRTC connection.

**Data:**
```javascript
{
  offer: { type: "offer", sdp: "..." },
  from: "socket_id"
}
```

#### `webrtc-answer`
SDP answer for WebRTC connection.

**Data:**
```javascript
{
  answer: { type: "answer", sdp: "..." },
  from: "socket_id"
}
```

#### `webrtc-ice-candidate`
ICE candidate for connection optimization.

**Data:**
```javascript
{
  candidate: { ... },
  from: "socket_id"
}
```

### Client-to-Server Events

#### `register-user`
Register user socket connection.

**Data:**
```javascript
userId: "uuid"
```

#### `call-request`
Citizen initiates video call (after API call).

**Data:**
```javascript
{
  booking_id: "uuid",
  lawyer_id: "uuid",
  citizen_id: "uuid",
  citizen_name: "John Doe"
}
```

#### `accept-call`
Lawyer accepts call (after API call).

**Data:**
```javascript
{
  booking_id: "uuid",
  citizen_id: "uuid"
}
```

#### `reject-call`
Lawyer rejects call (after API call).

**Data:**
```javascript
{
  booking_id: "uuid",
  citizen_id: "uuid"
}
```

#### `schedule-call`
Lawyer schedules call (after API call).

**Data:**
```javascript
{
  booking_id: "uuid",
  citizen_id: "uuid",
  scheduled_time: "2024-03-31T15:00:00Z",
  webrtc_room_id: "room_xxx"
}
```

#### `join-room`
Join WebRTC room for video call.

**Data:**
```javascript
roomId: "room_xxx"
```

#### `leave-room`
Leave WebRTC room.

**Data:**
```javascript
roomId: "room_xxx"
```

#### `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`
WebRTC signaling events.

## Frontend Components

### 1. `useSocket` Hook
Custom React hook for Socket.io client connection.

**Location:** `src/hooks/useSocket.ts`

**Usage:**
```typescript
const { socket, isConnected } = useSocket();

if (!socket) return <div>Connecting...</div>;

socket.emit('call-request', data);
socket.on('incoming-call', (data) => { /* handle */ });
```

### 2. `WebRTCVideo` Component
Full-featured video call UI with local and remote video.

**Location:** `src/components/webrtc/WebRTCVideo.tsx`

**Props:**
```typescript
{
  roomId: string;              // Unique room identifier
  userId: string;              // Current user ID
  isInitiator?: boolean;       // Is this peer the initiator
  onCallEnd?: () => void;      // Callback when call ends
}
```

**Features:**
- Local video (picture-in-picture style)
- Remote video in main display
- Mute/unmute audio
- Toggle video on/off
- Call duration timer
- End call button
- Connection status indicator

### 3. `LawyerAlertsTab` Component
Lawyer's incoming call alerts and scheduling interface.

**Location:** `src/components/webrtc/LawyerAlertsTab.tsx`

**Features:**
- Real-time incoming call notifications
- Accept/Decline call buttons
- Schedule call dialog with datetime picker
- Option to start immediately
- Notification toast alerts

**Usage in Dashboard:**
```typescript
<LawyerAlertsTab />
```

### 4. `CitizenVideoCall` Component
Citizen's video call initiation and join interface.

**Location:** `src/components/webrtc/CitizenVideoCall.tsx`

**Props:**
```typescript
{
  booking_id: string;      // Booking ID
  lawyer_name: string;     // Display name
  lawyer_id: string;       // Lawyer user ID
  onClose?: () => void;    // Callback when component closes
}
```

**Features:**
- Initiate call button
- Real-time status updates
- Countdown timer to scheduled call
- Automatic join when time arrives
- Call status tracking (requesting, accepted, scheduled, active)

## Installation & Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### 2. Run Database Migration

```bash
cd backend
npm run db:migrate
```

### 3. Environment Variables

**Backend (.env):**
```env
# Server
PORT=4000
FRONTEND_URL=http://localhost:5173

# Optional TURN server config
VITE_TURN_SERVER=turn:turnserver.example.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password
```

**Frontend (.env or .env.local):**
```env
VITE_API_URL=http://localhost:4000
VITE_BACKEND_URL=http://localhost:4000

# Optional TURN server
VITE_TURN_SERVER=turn:turnserver.example.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password
```

### 4. Start the Servers

**Backend:**
```bash
npm run dev
```

**Frontend:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173` with the backend API at `http://localhost:4000`.

## Usage Workflow

### Citizen Initiates Call

1. Open "My Bookings" page
2. Click "Video Call" button on an upcoming booking
3. System sends notification to lawyer
4. Wait for lawyer to respond

### Lawyer Receives & Schedules

1. Check "Video Call Alerts" section in Dashboard
2. See incoming call with citizen name
3. Click "Accept" to accept the call
4. Choose to "Start Now" or "Schedule for Later"
5. If scheduling, select date/time
6. System notifies citizen automatically

### Both Parties Join Call

1. Citizen receives notification with call time
2. Countdown timer appears 
3. "Join Call Now" button activates at scheduled time
4. Both parties' cameras and audio are enabled
5. Call duration displayed
6. Either party can end the call

## Technical Details

### WebRTC Connection Flow

1. **Initiator** creates SDP offer → sends via Socket.io
2. **Responder** receives offer → creates SDP answer → sends via Socket.io
3. **Both peers** exchange ICE candidates for optimal connection
4. **Media streams** established and displayed in video elements
5. **On disconnect**: Media tracks stopped, peer connection destroyed

### Signaling Architecture

```
┌─────────────┐          Socket.io           ┌─────────────┐
│   Lawyer    │◄──────────────────────────────►│   Citizen   │
│  (Socket)   │  offer/answer/ICE candidates   │  (Socket)   │
└─────────────┘          Real-time             └─────────────┘
       │                                              │
       │─────────────────────────────────────────────│
       │        WebRTC Peer Connection               │
       │        (Direct media transfer)              │
       └─────────────────────────────────────────────┘
```

### STUN Servers (Default)

- `stun.l.google.com:19302`
- `stun1.l.google.com:19302`

These are free public STUN servers for NAT traversal. For production, consider configuring TURN servers for better reliability.

## Error Handling

### Common Issues

**1. "Connection Failed"**
- Check Socket.io connection:  `useSocket().isConnected`
- Verify backend server is running
- Check CORS settings in `backend/config/socket.js`
- Check browser console for WebRTC errors

**2. "No Video/Audio"**
- Check browser permissions for camera/microphone
- Verify media device availability
- Check browser console for permission errors

**3. "Cannot Connect to Peer"**
- Try adding TURN server configuration
- Check firewall/NAT settings
- Verify both peers are using valid socket connections

**4. "Audio/Video Cuts Out"**
- Network latency/bandwidth issue
- Try disabling video for audio-only calls
- Move closer to router for better WiFi signal

## Browser Compatibility

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 11+)
- Edge: ✅ Full support

## Performance Optimization

### Video Resolution

Currently set to 1280x720. Adjust in `WebRTCVideo.tsx`:

```typescript
video: { width: { ideal: 1280 }, height: { ideal: 720 } }
```

For lower bandwidth:
```typescript
video: { width: { ideal: 640 }, height: { ideal: 480 } }
```

### Audio Settings

Current configuration includes:
- Auto Gain Control (AGC)
- Noise Suppression
- Echo Cancellation

For high-quality calls, disable AGC:
```javascript
audio: { autoGainControl: false, ... }
```

## Testing

### Manual Testing Checklist

- [ ] Citizen can initiate video call
- [ ] Lawyer receives alert notification
- [ ] Lawyer can accept call
- [ ] Lawyer can reject call
- [ ] Lawyer can schedule call for later
- [ ] Citizen receives schedule notification
- [ ] Countdown timer appears correctly
- [ ] Both parties can join video call
- [ ] Video and audio transfer correctly
- [ ] Mute/video toggle works
- [ ] Call duration timer displays
- [ ] End call button works

### Testing with Two Browsers

1. Open two browser windows/tabs
2. Login as lawyer in one, citizen in another
3. Create a booking via payment flow
4. Follow the workflow above

## Future Enhancements

1. **Recording**: Add call recording capability
2. **Screen Sharing**: Implement WebRTC screen share
3. **Call History**: Track call duration and quality metrics
4. **Analytics**: Monitor connection quality and failures
5. **AI Transcription**: Real-time transcription of calls
6. **Chat During Calls**: Add text chat alongside video
7. **Multiple Participants**: Conference calling support
8. **Virtual Backgrounds**: Add virtual background support

## Security Considerations

1. **Encryption**: WebRTC is encrypted by default (DTLS-SRTP)
2. **Authentication**: All endpoints require JWT token
3. **Socket.io CORS**: Limited to frontend URL
4. **Room IDs**: Randomly generated and hardto guess
5. **No Recording by Default**: Recording must be explicitly authorized

## Support

For issues or feature requests, refer to:
- WebRTC Documentation: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- Socket.io Documentation: https://socket.io/docs/
- simple-peer Documentation: https://github.com/feross/simple-peer

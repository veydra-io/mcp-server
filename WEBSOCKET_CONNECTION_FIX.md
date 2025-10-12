# WebSocket Connection Loop Fix

## Problem
The frontend was experiencing a rapid connect/disconnect loop with the WebSocket server:
- Client connects
- Immediately disconnects
- Reconnects after 1 second
- Repeats indefinitely

## Root Causes

1. **Connection Timing Issue**: The WebSocket was being initialized before we had the session ID from the backend
2. **Auto-reconnection**: The `reconnection: true` setting was causing the client to aggressively reconnect
3. **Duplicate Code**: There was duplicate API call code that was trying to start generation twice

## Solution

### Changes Made to `frontend/src/pages/ModelAutoGenerate.tsx`:

1. **Reordered Connection Flow**:
   ```typescript
   // OLD: Connect WebSocket first, then call API
   socket = io(api_url, { ... });
   const response = await fetch(...);
   
   // NEW: Call API first, get session ID, then connect WebSocket
   const response = await fetch(...);
   const newSessionId = data.session_id;
   setSessionId(newSessionId);
   socket = io(api_url, { ... });
   ```

2. **Updated Socket.IO Configuration**:
   ```typescript
   socket = io(api_url, {
     transports: ['websocket', 'polling'],
     reconnection: false, // Disabled to prevent reconnection loops
     reconnectionAttempts: 3, // Reduced attempts
     reconnectionDelay: 2000, // Increased delay
     timeout: 20000, // 20 second timeout
     forceNew: true, // Force a new connection
   });
   ```

3. **Improved Connection Handler**:
   ```typescript
   socket.on('connect', () => {
     console.log('WebSocket connected, joining session:', newSessionId);
     // Join immediately after connection with the session ID
     if (socket && newSessionId) {
       socket.emit('join_session', { session_id: newSessionId });
     }
   });
   ```

4. **Better Disconnect Handling**:
   ```typescript
   socket.on('disconnect', (reason) => {
     console.log('WebSocket disconnected:', reason);
     // Only show error if server initiated disconnect
     if (mounted && reason === 'io server disconnect') {
       setError('Server disconnected. Please refresh the page.');
     }
   });
   ```

5. **Removed Duplicate Code**: Eliminated duplicate API call that was causing issues

## Why This Works

1. **Session ID First**: We get the session ID from the REST API before opening the WebSocket, ensuring we have it when we connect
2. **No Auto-Reconnect**: Disabled automatic reconnection prevents infinite loops
3. **Immediate Room Join**: The client joins the session room as soon as it connects, ensuring it receives all events
4. **Single API Call**: Only one call to start generation prevents race conditions

## Testing

To verify the fix:
1. Open browser console
2. Navigate to `/models/:modelId/auto-generate`
3. Should see:
   - Single "WebSocket connected, joining session: <session_id>" message
   - "Joined session: <session_id>" confirmation
   - Progress updates as they come in
   - No disconnect/reconnect messages

## Backend Considerations

The backend's `connect` handler emits a "connect" event which might have been confusing the client:
```python
@socketio.on("connect")
def connected():
    print("client has connected")
    emit("connect",{"data":f"id: {request.sid} is connected"})  # This could be problematic
```

This is generally safe but could be renamed to avoid confusion with the built-in 'connect' event. However, the frontend fix resolves the immediate issue without backend changes.

## Alternative Solutions (if issues persist)

If the connection loop continues:

1. **Add connection state tracking**:
   ```typescript
   const [isConnecting, setIsConnecting] = useState(false);
   // Prevent multiple connection attempts
   if (isConnecting) return;
   setIsConnecting(true);
   ```

2. **Use Socket.IO namespaces** on the backend to isolate generation sessions

3. **Implement exponential backoff** for reconnection attempts

4. **Add ping/pong heartbeat** to detect dead connections

## Next Steps

Monitor the connection in production. If disconnections still occur:
- Check for network issues
- Verify backend timeout settings match frontend
- Consider adding connection quality monitoring

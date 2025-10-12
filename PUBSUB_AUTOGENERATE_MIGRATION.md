# Pub/Sub Migration for Model Auto-Generate

## Overview
Migrated the model auto-generation feature from using Flask-SocketIO background tasks to Google Pub/Sub worker queue pattern for better scalability and reliability.

## Changes Made

### 1. Backend API (`backend/main.py`)

#### ModelAutoGenerate Endpoint (Line ~4790)
**Before:**
- Used `socketio.start_background_task()` to run generation in Flask process
- Tracked active sessions with `_active_sessions` set
- Emitted WebSocket events directly from Flask

**After:**
- Creates a job entity in Datastore
- Publishes job to Pub/Sub topic using `shared.curator.job.new()`
- Returns job_id and session_id immediately
- Worker picks up the job and handles execution

**Key Changes:**
```python
# Create job inputs for the worker
job_inputs = {
    'report_type': 'model-auto-generate',
    'model_id': model_id,
    'session_id': session_id,
    'model_name': model_entity.get('name', f'Model {model_id}'),
    'github_url': model_entity.get('csr_url') or model_entity.get('repository_url'),
    'callback_url': request.host_url.rstrip('/')
}

# Publish to Pub/Sub queue
job_entity = shared.curator.job.new(
    user_id=decoded_token['uid'],
    project_id=model_entity.get('project_key_id'),
    inputs=job_inputs,
    paid_by_user=decoded_token['uid'],
    topic_id="run_jobs_cpu_medium_dev" if os.getenv('ENVIRONMENT') != 'prod' else "run_jobs_cpu_medium",
    callback_url=request.host_url.rstrip('/')
)
```

#### HTTP Call Endpoint (Line ~4869)
**Updated** to handle new event types:
```python
# For generation events, emit the nested data object
if event_type in ['generation_progress', 'generation_complete', 'generation_error']:
    event_data = request.json.get('data', {})
    socketio.emit(event_type, event_data, to=room)
```

### 2. Worker (`worker/worker.py`)

#### New Job Type Handler (Line ~650)
Added `model-auto-generate` report type handler:
```python
elif event['inputs']['report_type'] == 'model-auto-generate':
    # Model auto-generation job
    # This job type doesn't charge credits - it's a model feature
    
    # Emits progress updates via logger:
    # - type="progress" → generation_progress event
    # - type="complete" → generation_complete event  
    # - type="error" → generation_error event
```

**Progress Steps:**
1. **analyzing** - Analyzing repository structure
2. **extracting** - Extracting model components
3. **building** - Building component relationships
4. **generating** - Generating documentation

#### ProgressHandler Update (Line ~200)
Enhanced to map message types to WebSocket events:
```python
if type == "progress":
    requests.post(callback_url+"/http-call/"+room,
        json = {"type": "generation_progress", "data": jsonMsg.get("value")})
elif type == "complete":
    requests.post(callback_url+"/http-call/"+room,
        json = {"type": "generation_complete", "data": jsonMsg.get("value")})
elif type == "error":
    requests.post(callback_url+"/http-call/"+room,
        json = {"type": "generation_error", "data": jsonMsg.get("value")})
```

## Pub/Sub Configuration

### Topics
- **Dev**: `run_jobs_cpu_medium_dev` (project: cbot-engine)
- **Prod**: `run_jobs_cpu_medium` (project: cbot-engine)

### Subscriptions
- **Dev**: `run_jobs_cpu_medium_dev-sub`
- **Prod**: `run_jobs_cpu_medium-sub`

### Message Format
```json
{
  "job_id": 12345,
  "inputs": {
    "report_type": "model-auto-generate",
    "model_id": 6297538353168384,
    "session_id": "uuid-v4-session-id",
    "model_name": "My Model",
    "github_url": "https://github.com/...",
    "callback_url": "http://localhost:5000"
  },
  "action": "run",
  "websocket_room": "room_job_12345",
  "user_id": "firebase-uid"
}
```

## WebSocket Event Flow

### Before (Direct Emission)
```
Backend API → socketio.emit() → Client
```

### After (Worker Queue)
```
Backend API → Pub/Sub Topic → Worker Subscriber → HTTP Callback → socketio.emit() → Client
```

**Sequence:**
1. Frontend calls `POST /v1/model/{id}/auto-generate`
2. Backend creates job entity and publishes to Pub/Sub
3. Worker picks up message from subscription
4. Worker executes generation steps
5. Worker sends progress via `POST /http-call/model_{model_id}_autogen`
6. Backend emits WebSocket events to model room
7. Frontend receives real-time updates

**Room Naming:**
- Room name: `model_{model_id}_autogen` (e.g., `model_6297538353168384_autogen`)
- Frontend joins room using model_id from URL
- Worker sends to room using model_id from job inputs
- Multiple users can watch the same model generation simultaneously

## Frontend Changes

### No Changes Required! 🎉
The frontend WebSocket client (`ModelAutoGenerate.tsx`) continues to work exactly as before:
- Connects to session room using `session_id`
- Listens for same events: `generation_progress`, `generation_complete`, `generation_error`
- Event data format remains unchanged

## Benefits

### Scalability
- ✅ Workers can scale independently from API servers
- ✅ Multiple workers can process jobs in parallel
- ✅ No longer blocking Flask process with long-running tasks

### Reliability
- ✅ Jobs persist in Datastore even if worker crashes
- ✅ Pub/Sub provides at-least-once delivery guarantee
- ✅ Failed jobs can be retried automatically
- ✅ Job status tracked in Datastore for monitoring

### Flexibility
- ✅ Can deploy workers separately (different machine types, regions)
- ✅ Can add job priority, scheduling, batching
- ✅ Easy to add new job types following same pattern
- ✅ Workers can be in Cloud Run, GKE, or compute instances

## Testing

### Start Worker (Dev)
```bash
cd worker
python worker.py
```

### Test Auto-Generate
```bash
# Frontend will automatically connect and receive updates
http://localhost:3000/models/6297538353168384/auto-generate
```

### Check Logs
**Backend:**
```
DEBUG: Created job 12345 for model 6297538353168384 auto-generation (session: uuid)
```

**Worker:**
```
Starting generation for model 6297538353168384, session uuid
Step 1: Analyzing repository structure...
Step 2: Extracting model components...
...
```

## Migration Notes

### Removed Code
- `run_model_generation()` function (no longer needed)
- `_active_sessions` class variable (job tracking in Datastore now)
- Direct `socketio.emit()` calls in endpoint

### Added Dependencies
- Uses existing `shared.curator.job` module
- Uses existing Pub/Sub infrastructure
- No new Python packages required

## Future Enhancements

### Possible Improvements
1. **Add timeout handling** - Kill jobs that run too long
2. **Add progress percentage** - More granular progress tracking
3. **Add cancel functionality** - Allow users to cancel running jobs
4. **Add retry logic** - Auto-retry failed generations
5. **Add job history** - Track all generation attempts per model
6. **Add metrics** - Track job duration, success rate, etc.

### Cost Optimization
- Consider batch processing multiple models
- Add caching for frequently generated models
- Use Pub/Sub message filtering for priority jobs

## Troubleshooting

### Job Not Starting
- Check Pub/Sub topic exists: `gcloud pubsub topics list`
- Check subscription exists: `gcloud pubsub subscriptions list`
- Check worker is running: Look for "Listening for messages..." log
- Check job created in Datastore: Query 'job' kind

### No Progress Updates
- Check `/http-call` endpoint is accessible from worker
- Check WebSocket connection in browser console
- Check session room name matches: `room_job_{job_id}`
- Check callback_url in job inputs

### Worker Errors
- Check Python environment has all dependencies
- Check GCP credentials are configured
- Check Datastore access permissions
- Check worker has network access to backend

## Documentation Links

- [Google Pub/Sub Documentation](https://cloud.google.com/pubsub/docs)
- [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
- [Worker Implementation](./worker/worker.py)
- [Job Module](./shared/curator/job/__init__.py)

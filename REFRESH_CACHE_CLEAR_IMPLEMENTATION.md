# Refresh Button Cache Clear Implementation

## Summary
The refresh button in the Model Playground page has been updated to provide a complete cache clearing and re-initialization workflow when users want to sync the latest files from GitHub.

## What happens when the user clicks the refresh button:

### Step 1: Clear localStorage Cache
- **Action**: Removes the cached files from localStorage using key `model_files_{modelId}`
- **Purpose**: Ensures no stale cached files interfere with the fresh sync
- **Example**: For model `4815651826827264`, clears `model_files_4815651826827264`

### Step 2: Reset Model Initialization States
- **Actions**: 
  - Sets `modelInitialized = false`
  - Sets `autoInitializationComplete = false` 
  - Sets `autoInitializationStep = 'idle'`
  - Clears `modelResults`, `chartData`, and `multiStockChartData`
- **Purpose**: Resets the model to a fresh state for complete re-initialization

### Step 3: Backend GitHub → Cloud Storage Sync
- **Action**: Calls `POST /v1/model/{modelId}/sync-from-github`
- **Purpose**: Ensures Cloud Storage has the latest files from the GitHub repository
- **Result**: All files in Cloud Storage are updated to match GitHub repository state

### Step 4: Clear Frontend Cache State  
- **Actions**:
  - Clears `githubFileContent` state (`setGithubFileContentPersistent({})`)
  - Resets loading states (`setLoadingFiles(new Set())`)
- **Purpose**: Ensures frontend state is clean for fresh file loading

### Step 5: Refresh File List
- **Action**: Calls `getModelFileList(modelId, true)` with force refresh
- **Purpose**: Gets the updated file list from Cloud Storage
- **Follow-up**: Auto-caches all `/src/` and `/config/` files with `main/` prefix

### Step 6: Trigger Auto-Initialization
- **Action**: Sets `autoInitializationStep = 'pyodide'`
- **Purpose**: Starts the complete auto-initialization workflow:
  1. Re-initializes Pyodide WASM environment
  2. Loads fresh Python files into Pyodide
  3. Executes model initialization code
  4. Runs model with default parameters

## User Experience
1. User clicks refresh button (🔄)
2. Button shows loading spinner
3. Console logs show progress through all 6 steps
4. Model playground refreshes with latest GitHub files
5. Model automatically re-initializes and runs with fresh code

## Error Handling
- Comprehensive try/catch with specific error messages
- Graceful handling of network timeouts
- Authentication error detection and handling
- Detailed console logging for debugging

## Cache Key Format
- **Pattern**: `model_files_{modelId}`
- **Example**: `model_files_4815651826827264`
- **Storage**: Browser localStorage
- **Content**: Object containing file paths and content

## Testing
Use the test script `test_refresh_cache_clear.js` to verify cache clearing functionality works correctly.

## Benefits
- ✅ Always gets latest files from GitHub
- ✅ Completely clears stale cache data
- ✅ Re-initializes model environment cleanly
- ✅ Provides immediate feedback to user
- ✅ Handles errors gracefully
- ✅ Works for any model ID automatically
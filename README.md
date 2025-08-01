# Content Curator App

This repository contains the core components of the Content Curator App.

## Project Structure

- **`/backend`**: Contains the main Flask application, its associated tests, and backend-specific configurations.
- **`/worker`**: An independent Git repository for the worker processes, synced with `git@github.com:FrontAnalyticsInc/contentcurator-app-worker_cloud_run_from_pubsub_run_jobs_cpu_medium.git`.
- **`/shared`**: An independent Git repository containing shared modules and utilities used by both the backend and worker, synced with `git@github.com:FrontAnalyticsInc/contentcurator.git`.
- **`/orchestrator`**: Contains orchestration-related code.
- **`/frontend`**: The React application for the user interface.
- **`/react-flow-topic-map`**: Additional frontend components.

This structure promotes modularity and independent development/versioning of core services.
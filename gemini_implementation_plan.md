# Gemini AI: Model Playground Implementation Plan

This document outlines the architectural decisions and implementation steps for building the new Git-powered Model Playground feature.

## High-Level Goal

To create a robust, scalable, multi-tenant modeling environment where models are backed by Git repositories. This will allow for advanced versioning features like scenarios (branches), version history, diffing, and collaboration, all managed within the application.

## Core Architecture: Git-Powered Backend

- **Execution Engine**: The existing `backend` Flask application, running on **Google Cloud Run**, will be extended. It will act as a secure API gateway that executes Git commands.
- **Git Execution**: The backend's `Dockerfile` will be modified to install the standard `git` command-line client. The Python code will call this client to perform all Git operations.
- **Primary Storage (Source of Truth)**: **Google Cloud Source Repositories (CSR)** will be used to host a dedicated, private Git repository for each user-created model.
- **Metadata Storage**: **Google Cloud Firestore (or Datastore)** will be used to store metadata, including model ownership and the mapping between a model and its CSR repository URL.
- **Performance & Caching**: We will enable **Session Affinity** on the Cloud Run service. The backend code will maintain a local cache of repositories on the instance's temporary file system. Cache hits will use a fast `git pull`, while misses will trigger a `git clone`.

## V1 Feature Set

- **Models as Repos**: Each model is a full Git repository.
- **Scenarios as Branches**: Users can create and switch between "scenarios," which are implemented as Git branches.
- **History & Diffs**: The UI will display a Git history and allow users to see diffs between commits.
- **Simplified Merging**: Merge conflicts will be handled with a simple "accept theirs" or "accept ours" choice for the user.
- **Multi-Scenario Frontend**: The frontend will be capable of fetching and holding the state for multiple scenarios (branches) at once.
- **No Large File Support**: V1 will not implement Git LFS, as large files are not an anticipated use case.

## Implementation Steps

1.  **Log the Plan**: Create this `gemini_implementation_plan.md` file. (✓ Done)
2.  **Prepare the Backend Environment**:
    -   Modify `backend/Dockerfile` to install the `git` client.
    -   Configure the Cloud Run service to use **Session Affinity**.
3.  **Establish Data Models**:
    -   Define the necessary data structures in Firestore/Datastore to represent a `Model` and its relationship to a user and a CSR repository.
4.  **Extend the Backend API (Read Operations)**:
    -   Create a new `model` namespace in `backend/main.py`.
    -   Implement the "read" endpoints:
        -   `GET /models`: List models for the authenticated user.
        -   `POST /models`: Create a new model (which will programmatically create a new CSR repository).
        -   `GET /models/<model_id>/files?ref=<branch_or_commit>`: Get the content of all files for a given version.
        -   `GET /models/<model_id>/log`: Get the commit history.
        -   `GET /models/<model_id>/diff`: Get a diff between two commits.
5.  **Extend the Backend API (Write Operations)**:
    -   Implement the "write" endpoints:
        -   `POST /models/<model_id>/commit`: Commit staged changes.
        -   `POST /models/<model_id>/branch`: Create a new branch (scenario).
        -   `POST /models/<model_id>/merge`: Merge one branch into another.
6.  **Frontend Integration**:
    -   Update the `ModelPlaygroundPage` to communicate with the new backend API.
    -   Build the UI components for displaying history, branches, and diffs.
    -   Implement the client-side state management for handling multiple active scenarios.
7.  **Testing**:
    -   Add unit and integration tests for the new backend API endpoints and Git-related logic.
    -   Update the CI/CD pipeline to run these tests.

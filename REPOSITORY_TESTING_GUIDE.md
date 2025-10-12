# Repository Initialization and File Upload Testing Guide

## Overview

The ContentCurator backend now supports enhanced repository initialization and file upload capabilities for models. This guide explains the new features and how to test them.

## New Features

### 1. Enhanced Repository Initialization

When creating a new model, the system now automatically creates a well-structured GitHub repository with:

- **README.md**: Comprehensive documentation with model description
- **model.yaml**: Configuration file with model metadata
- **requirements.txt**: Python dependencies template
- **.gitignore**: Appropriate ignore rules for ML projects
- **Directory structure**:
  - `src/` - Model source code and implementation
  - `data/` - Data files and datasets  
  - `docs/` - Documentation and guides
  - `tests/` - Unit tests and validation scripts

### 2. File Upload API

New endpoints for managing model repository files:

#### Upload File
- **Endpoint**: `POST /v1/model/{model_id}/upload`
- **Purpose**: Upload files to the model's GitHub repository
- **Parameters**:
  - `file`: The file to upload (multipart/form-data)
  - `path`: Target directory path (optional, defaults to `data/`)
  - `message`: Commit message (optional)

#### List Files
- **Endpoint**: `GET /v1/model/{model_id}/files`
- **Purpose**: List all files in the model's repository
- **Returns**: Structured list of files and directories

## Testing Instructions

### Prerequisites

1. **Backend Running**: Ensure your backend server is running
   ```powershell
   cd C:\Users\alexa\OneDrive\Documents\GitHub\contentcurator-app\backend
   .\start_backend.bat  # or .\start_backend.ps1
   ```

2. **Valid Authentication**: You'll need a valid JWT token
3. **GitHub Access**: Ensure GITHUB_TOKEN is properly configured

### Using the Test Notebook

1. **Open the test notebook**:
   ```
   test_repository_features.ipynb
   ```

2. **Update configuration variables**:
   - Set your valid JWT token
   - Set your project ID
   - Verify backend URL (default: http://localhost:5000)

3. **Run test cells sequentially**:
   - **Cell 1**: Setup and configuration
   - **Cell 2**: Create model with enhanced repository
   - **Cell 3**: List initial repository structure
   - **Cell 4**: Upload test CSV file
   - **Cell 5**: Verify frontend accessibility
   - **Cell 6**: List files to confirm upload
   - **Cell 7**: Upload Python script to different directory
   - **Cell 8**: Test summary and manual verification steps
   - **Cell 9**: Optional cleanup (delete test model)

### Manual Verification

After running the tests, manually verify:

1. **GitHub Repository**: Visit the created repository URL to see:
   - Proper initialization files
   - Uploaded test files in correct directories
   - Repository is private by default

2. **Frontend Integration**: Test file accessibility:
   - Use the download URLs provided by the API
   - Verify files are accessible from your frontend
   - Test different file types (CSV, Python, etc.)

## API Usage Examples

### Create Model with Repository
```python
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}
model_data = {
    "name": "My ML Model",
    "description": "A machine learning model",
    "project_id": "your_project_id"
}

response = requests.post(
    "http://localhost:5000/v1/model", 
    headers=headers, 
    json=model_data
)
```

### Upload File
```python
files = {'file': ('data.csv', open('data.csv', 'rb'), 'text/csv')}
data = {
    'path': 'data/',
    'message': 'Upload training data'
}

response = requests.post(
    f"http://localhost:5000/v1/model/{model_id}/upload",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    files=files,
    data=data
)
```

### List Repository Files
```python
response = requests.get(
    f"http://localhost:5000/v1/model/{model_id}/files",
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
```

## File Upload Best Practices

### Recommended Directory Structure
- `data/` - CSV files, datasets, raw data
- `src/` - Python scripts, model code
- `docs/` - Documentation, notebooks, guides
- `tests/` - Unit tests, validation scripts

### Supported File Types
- **Data files**: CSV, JSON, Excel, Parquet
- **Code files**: Python, R, SQL, Jupyter notebooks
- **Documentation**: Markdown, text files, PDFs
- **Configuration**: YAML, JSON, configuration files

### File Size Considerations
- GitHub has file size limits (100MB for regular files)
- For large files, consider using Git LFS
- The API will report file sizes in the response

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify JWT token is valid and not expired
   - Check token format: "Bearer YOUR_TOKEN"

2. **Repository Creation Failures**:
   - Ensure GITHUB_TOKEN has proper permissions
   - Verify GitHub organization access
   - Check for repository name conflicts

3. **File Upload Failures**:
   - Verify file size limits
   - Check file permissions
   - Ensure target directory path is valid

4. **Frontend Accessibility Issues**:
   - GitHub repositories are private by default
   - Use the provided download URLs
   - Verify raw file access permissions

### Debug Information
The backend provides extensive DEBUG logging. Check the console output for detailed information about:
- Repository creation process
- File upload status
- GitHub API interactions
- Error details

## Next Steps

### Enhanced Frontend Integration
Consider implementing:
1. **File browser widget** to display repository contents
2. **Drag-and-drop upload interface** for easy file management
3. **File preview capabilities** for common file types
4. **Version control integration** to track file changes

### Advanced Features
Future enhancements could include:
1. **File validation** based on model requirements
2. **Automated testing** when files are uploaded
3. **Collaborative editing** features
4. **Integration with data pipelines**

## Support

For issues or questions:
1. Check the DEBUG output in backend console
2. Verify GitHub token permissions
3. Test with the provided notebook
4. Review the API documentation in the backend code

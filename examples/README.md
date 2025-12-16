# Upload Engine Examples

This directory contains example implementations of the upload engine.

## React Example

See `react-example.tsx` for a complete React component that demonstrates:
- File selection with multiple files
- Progress tracking with visual progress bars
- Cancel and remove upload functionality
- Status display for each upload
- Integration with the UploadProvider

## Vanilla JavaScript Example

See `vanilla-js-example.js` for a plain JavaScript implementation that shows:
- Direct usage of the UploadEngine class
- Automatic selection between single and chunked upload
- Progress tracking
- Cancel functionality
- Error handling

## Running the Examples

### React Example

```bash
# In your React application
npm install @bugfix2020/upload-engine

# Import and use the component
import App from './examples/react-example';
```

### Vanilla JS Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Upload Engine Example</title>
    <style>
        #progressBar {
            width: 0%;
            height: 20px;
            background-color: #2196F3;
            transition: width 0.3s;
        }
        .progress-container {
            width: 100%;
            background-color: #e0e0e0;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>File Upload</h1>
    <input type="file" id="fileInput" />
    <button id="uploadButton">Upload</button>
    <button id="cancelButton">Cancel</button>
    <div class="progress-container">
        <div id="progressBar"></div>
    </div>
    <p id="statusText"></p>

    <script type="module" src="vanilla-js-example.js"></script>
</body>
</html>
```

## Server-Side Implementation

When using chunked uploads, your server should handle the chunk headers:

```javascript
// Example Node.js/Express server
app.post('/upload', (req, res) => {
  const chunkIndex = parseInt(req.headers['x-chunk-index']);
  const totalChunks = parseInt(req.headers['x-total-chunks']);
  const fileName = req.headers['x-file-name'];
  const fileSize = parseInt(req.headers['x-file-size']);

  // Save chunk to temporary location
  // When all chunks received, reassemble the file
  
  if (chunkIndex === totalChunks - 1) {
    // Last chunk - reassemble file
    reassembleFile(fileName, totalChunks);
  }

  res.json({ success: true, chunk: chunkIndex });
});
```

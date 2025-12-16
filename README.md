# upload-engine

A powerful browser-based file upload engine with support for both single and chunked uploads, featuring a React provider for easy integration.

## Features

- 🚀 **Single File Upload** - For smaller files, upload in one request
- 📦 **Chunked Upload** - Automatically splits large files into chunks for reliable uploads
- ⚛️ **React Provider** - Easy integration with React applications via Context API
- 📊 **Progress Tracking** - Real-time upload progress for both single and chunked uploads
- 🔄 **Retry Logic** - Automatic retry on network failures
- ❌ **Cancellation** - Cancel uploads in progress
- 🎯 **TypeScript** - Full TypeScript support with type definitions

## Installation

```bash
npm install @bugfix2020/upload-engine
```

## Usage

### React Provider

Wrap your application with the `UploadProvider`:

```tsx
import React from 'react';
import { UploadProvider } from '@bugfix2020/upload-engine';

function App() {
  return (
    <UploadProvider chunkThreshold={10 * 1024 * 1024}>
      <YourComponents />
    </UploadProvider>
  );
}
```

### Using the useUpload Hook

```tsx
import React from 'react';
import { useUpload } from '@bugfix2020/upload-engine';

function FileUploader() {
  const { uploadFile, uploads, cancelUpload } = useUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadFile(file, {
      url: 'https://api.example.com/upload',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
      },
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
      onSuccess: (response) => {
        console.log('Upload successful:', response);
      },
      onError: (error) => {
        console.error('Upload failed:', error);
      },
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      
      {Object.values(uploads).map((upload) => (
        <div key={upload.id}>
          <p>{upload.file.name}</p>
          <p>Status: {upload.status}</p>
          <p>Progress: {upload.progress.toFixed(2)}%</p>
          {upload.status === 'uploading' && (
            <button onClick={() => cancelUpload(upload.id)}>Cancel</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Direct Upload Engine Usage

For non-React applications, use the `UploadEngine` directly:

```typescript
import { UploadEngine } from '@bugfix2020/upload-engine';

const engine = new UploadEngine();
const file = document.querySelector('input[type="file"]').files[0];

// Single upload
await engine.uploadSingle(file, {
  url: 'https://api.example.com/upload',
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
  onSuccess: (response) => console.log('Success:', response),
  onError: (error) => console.error('Error:', error),
});

// Chunked upload
await engine.uploadChunked(file, {
  url: 'https://api.example.com/upload',
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  onProgress: (progress) => console.log(`Overall progress: ${progress}%`),
  onChunkProgress: (chunkIndex, totalChunks, progress) => {
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks}: ${progress}%`);
  },
  onSuccess: (response) => console.log('Success:', response),
  onError: (error) => console.error('Error:', error),
});
```

## API Reference

### UploadProvider

Props:
- `children: ReactNode` - Child components
- `chunkThreshold?: number` - File size threshold (in bytes) to use chunked upload. Default: 10MB

### useUpload Hook

Returns:
- `uploads: Record<string, UploadState>` - Current upload states
- `uploadFile(file, options, useChunked?)` - Upload a file
- `cancelUpload(id)` - Cancel an upload
- `removeUpload(id)` - Remove upload from state
- `clearCompleted()` - Clear all completed uploads

### UploadEngine

Methods:
- `uploadSingle(file, options)` - Upload file in single request
- `uploadChunked(file, options)` - Upload file in chunks
- `cancel()` - Cancel current upload
- `static shouldUseChunkedUpload(file, threshold?)` - Determine if file should be chunked

### UploadOptions

```typescript
interface UploadOptions {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  chunkSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  onProgress?: (progress: number) => void;
  onChunkProgress?: (chunkIndex: number, totalChunks: number, progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}
```

### ChunkUploadOptions

Extends `UploadOptions` with:
- `chunkContentType?: string` - Content-Type header for chunks. Default: 'application/octet-stream'
- `getChunkUrl?: (chunkIndex: number, totalChunks: number) => string` - Custom URL for each chunk
- `getChunkHeaders?: (chunkIndex: number, totalChunks: number) => Record<string, string>` - Custom headers for each chunk

## Chunked Upload Headers

When uploading chunks, the following headers are automatically added:
- `X-Chunk-Index` - Current chunk index (0-based)
- `X-Total-Chunks` - Total number of chunks
- `X-File-Name` - Original file name
- `X-File-Size` - Total file size in bytes

Your server should use these headers to reassemble the file.

## License

MIT
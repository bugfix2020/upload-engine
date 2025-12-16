import React, { useState } from 'react';
import { UploadProvider, useUpload, UploadStatus } from '@bugfix2020/upload-engine';

/**
 * Example React component demonstrating the upload engine
 */
function FileUploadComponent() {
  const { uploadFile, uploads, cancelUpload, removeUpload, clearCompleted } = useUpload();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      uploadFile(file, {
        url: 'https://api.example.com/upload',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        onProgress: (progress) => {
          console.log(`${file.name}: ${progress.toFixed(2)}%`);
        },
        onChunkProgress: (chunkIndex, totalChunks, progress) => {
          console.log(`${file.name}: Chunk ${chunkIndex + 1}/${totalChunks} - ${progress.toFixed(2)}%`);
        },
        onSuccess: (response) => {
          console.log(`${file.name}: Upload successful!`, response);
        },
        onError: (error) => {
          console.error(`${file.name}: Upload failed!`, error);
        },
      });
    });

    setSelectedFiles(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case UploadStatus.Uploading:
        return '#2196F3';
      case UploadStatus.Completed:
        return '#4CAF50';
      case UploadStatus.Error:
        return '#F44336';
      case UploadStatus.Cancelled:
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>File Upload Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ marginRight: '10px' }}
        />
        <button 
          onClick={handleUpload}
          disabled={!selectedFiles || selectedFiles.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Upload Files
        </button>
        <button 
          onClick={clearCompleted}
          style={{
            padding: '10px 20px',
            marginLeft: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Completed
        </button>
      </div>

      <div>
        <h2>Upload Queue ({Object.keys(uploads).length})</h2>
        {Object.values(uploads).length === 0 ? (
          <p style={{ color: '#999' }}>No uploads in progress</p>
        ) : (
          Object.values(uploads).map((upload) => (
            <div
              key={upload.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <strong>{upload.file.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Size: {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getStatusColor(upload.status),
                    }}
                  >
                    {upload.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {upload.status === UploadStatus.Uploading && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${upload.progress}%`,
                        height: '100%',
                        backgroundColor: '#2196F3',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    {upload.progress.toFixed(2)}%
                  </div>
                </div>
              )}

              {upload.error && (
                <div style={{ marginTop: '10px', color: '#F44336', fontSize: '12px' }}>
                  Error: {upload.error.message}
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                {upload.status === UploadStatus.Uploading && (
                  <button
                    onClick={() => cancelUpload(upload.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Cancel
                  </button>
                )}
                {(upload.status === UploadStatus.Completed ||
                  upload.status === UploadStatus.Error ||
                  upload.status === UploadStatus.Cancelled) && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#9E9E9E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Example App with UploadProvider
 */
export default function App() {
  return (
    <UploadProvider chunkThreshold={10 * 1024 * 1024}>
      <FileUploadComponent />
    </UploadProvider>
  );
}

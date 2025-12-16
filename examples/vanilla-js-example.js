/**
 * Example of using the UploadEngine without React
 */
import { UploadEngine } from '@bugfix2020/upload-engine';

// Get file input element
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');

let currentEngine = null;

uploadButton.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  currentEngine = new UploadEngine();

  try {
    // Determine if we should use chunked upload
    const useChunked = UploadEngine.shouldUseChunkedUpload(file, 10 * 1024 * 1024); // 10MB threshold

    statusText.textContent = `Uploading ${file.name}...`;
    progressBar.style.width = '0%';

    if (useChunked) {
      console.log('Using chunked upload');
      await currentEngine.uploadChunked(file, {
        url: 'https://api.example.com/upload',
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        onProgress: (progress) => {
          progressBar.style.width = `${progress}%`;
          statusText.textContent = `Uploading: ${progress.toFixed(2)}%`;
        },
        onChunkProgress: (chunkIndex, totalChunks, progress) => {
          console.log(`Chunk ${chunkIndex + 1}/${totalChunks}: ${progress.toFixed(2)}%`);
        },
        onSuccess: (response) => {
          statusText.textContent = 'Upload completed!';
          progressBar.style.width = '100%';
          progressBar.style.backgroundColor = '#4CAF50';
          console.log('Upload successful:', response);
        },
        onError: (error) => {
          statusText.textContent = `Upload failed: ${error.message}`;
          progressBar.style.backgroundColor = '#F44336';
          console.error('Upload error:', error);
        },
      });
    } else {
      console.log('Using single upload');
      await currentEngine.uploadSingle(file, {
        url: 'https://api.example.com/upload',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        onProgress: (progress) => {
          progressBar.style.width = `${progress}%`;
          statusText.textContent = `Uploading: ${progress.toFixed(2)}%`;
        },
        onSuccess: (response) => {
          statusText.textContent = 'Upload completed!';
          progressBar.style.width = '100%';
          progressBar.style.backgroundColor = '#4CAF50';
          console.log('Upload successful:', response);
        },
        onError: (error) => {
          statusText.textContent = `Upload failed: ${error.message}`;
          progressBar.style.backgroundColor = '#F44336';
          console.error('Upload error:', error);
        },
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
});

// Example: Cancel upload
const cancelButton = document.getElementById('cancelButton');
cancelButton.addEventListener('click', () => {
  if (currentEngine) {
    currentEngine.cancel();
    statusText.textContent = 'Upload cancelled';
    progressBar.style.backgroundColor = '#FF9800';
  }
});

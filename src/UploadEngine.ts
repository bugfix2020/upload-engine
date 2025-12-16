import { UploadOptions, ChunkUploadOptions } from './types';

export class UploadEngine {
  private abortController: AbortController | null = null;
  private retryCount = 0;

  /**
   * Upload a file using a single request
   */
  async uploadSingle(file: File, options: UploadOptions): Promise<any> {
    const {
      url,
      method = 'POST',
      headers = {},
      maxRetries = 3,
      onProgress,
      onSuccess,
      onError,
    } = options;

    this.abortController = new AbortController();
    this.retryCount = 0;

    return this.attemptUpload(file, url, method, headers, maxRetries, onProgress, onSuccess, onError);
  }

  private async attemptUpload(
    file: File,
    url: string,
    method: string,
    headers: Record<string, string>,
    maxRetries: number,
    onProgress?: (progress: number) => void,
    onSuccess?: (response: any) => void,
    onError?: (error: Error) => void
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = (event.loaded / event.total) * 100;
            onProgress?.(percentage);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
              response = JSON.parse(xhr.responseText);
            } catch {
              response = xhr.responseText;
            }
            onSuccess?.(response);
            resolve(response);
          } else {
            const error = new Error(`Upload failed with status ${xhr.status}`);
            onError?.(error);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          const error = new Error('Network error during upload');
          
          if (this.retryCount < maxRetries) {
            this.retryCount++;
            setTimeout(() => {
              this.attemptUpload(
                file,
                url,
                method,
                headers,
                maxRetries,
                onProgress,
                onSuccess,
                onError
              ).then(resolve).catch(reject);
            }, 1000 * this.retryCount);
          } else {
            onError?.(error);
            reject(error);
          }
        });

        xhr.addEventListener('abort', () => {
          const error = new Error('Upload cancelled');
          onError?.(error);
          reject(error);
        });

        xhr.open(method, url);
        
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        if (this.abortController) {
          this.abortController.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }

        xhr.send(formData);
      });
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload a file in chunks
   */
  async uploadChunked(file: File, options: ChunkUploadOptions): Promise<any> {
    const {
      url,
      method = 'POST',
      headers = {},
      chunkSize = 1024 * 1024 * 5, // 5MB default
      maxRetries = 3,
      onProgress,
      onChunkProgress,
      onSuccess,
      onError,
      getChunkUrl,
      getChunkHeaders,
    } = options;

    this.abortController = new AbortController();
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedBytes = 0;

    try {
      const responses = [];

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (this.abortController?.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const chunkUrl = getChunkUrl ? getChunkUrl(chunkIndex, totalChunks) : url;
        const chunkHeaders = {
          ...headers,
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': chunkIndex.toString(),
          'X-Total-Chunks': totalChunks.toString(),
          'X-File-Name': file.name,
          'X-File-Size': file.size.toString(),
          ...(getChunkHeaders ? getChunkHeaders(chunkIndex, totalChunks) : {}),
        };

        const response = await this.uploadChunk(
          chunk,
          chunkUrl,
          method,
          chunkHeaders,
          maxRetries,
          (chunkProgress) => {
            const totalProgress = ((uploadedBytes + (chunk.size * chunkProgress / 100)) / file.size) * 100;
            onProgress?.(totalProgress);
            onChunkProgress?.(chunkIndex, totalChunks, chunkProgress);
          }
        );

        responses.push(response);
        uploadedBytes += chunk.size;
        onProgress?.((uploadedBytes / file.size) * 100);
      }

      onSuccess?.(responses);
      return responses;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Chunked upload failed');
      onError?.(uploadError);
      throw uploadError;
    }
  }

  private async uploadChunk(
    chunk: Blob,
    url: string,
    method: string,
    headers: Record<string, string>,
    maxRetries: number,
    onProgress?: (progress: number) => void,
    retryCount = 0
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = (event.loaded / event.total) * 100;
          onProgress?.(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch {
            response = xhr.responseText;
          }
          resolve(response);
        } else {
          reject(new Error(`Chunk upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        if (retryCount < maxRetries) {
          setTimeout(() => {
            this.uploadChunk(
              chunk,
              url,
              method,
              headers,
              maxRetries,
              onProgress,
              retryCount + 1
            ).then(resolve).catch(reject);
          }, 1000 * (retryCount + 1));
        } else {
          reject(new Error('Network error during chunk upload'));
        }
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Chunk upload cancelled'));
      });

      xhr.open(method, url);

      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.send(chunk);
    });
  }

  /**
   * Cancel the current upload
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Determine if a file should be uploaded in chunks
   */
  static shouldUseChunkedUpload(file: File, threshold: number = 1024 * 1024 * 10): boolean {
    return file.size > threshold;
  }
}

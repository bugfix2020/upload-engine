export interface UploadOptions {
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

export interface ChunkUploadOptions extends UploadOptions {
  chunkContentType?: string;
  getChunkUrl?: (chunkIndex: number, totalChunks: number) => string;
  getChunkHeaders?: (chunkIndex: number, totalChunks: number) => Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export enum UploadStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Completed = 'completed',
  Error = 'error',
  Cancelled = 'cancelled',
}

export interface UploadState {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: Error;
}

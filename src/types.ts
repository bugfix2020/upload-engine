export interface UploadOptions {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
  onChunkProgress?: (chunkIndex: number, totalChunks: number, progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

export interface ChunkUploadOptions extends UploadOptions {
  getChunkUrl?: (chunkIndex: number, totalChunks: number) => string;
  getChunkHeaders?: (chunkIndex: number, totalChunks: number) => Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  error?: Error;
}

export enum UploadStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Completed = 'completed',
  Error = 'error',
  Cancelled = 'cancelled',
}

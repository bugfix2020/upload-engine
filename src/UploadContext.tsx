import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UploadEngine } from './UploadEngine';
import { UploadOptions, ChunkUploadOptions, UploadState, UploadStatus } from './types';

interface UploadContextValue {
  uploads: Record<string, UploadState>;
  uploadFile: (file: File, options: UploadOptions | ChunkUploadOptions, useChunked?: boolean) => string;
  cancelUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

interface UploadProviderProps {
  children: ReactNode;
  chunkThreshold?: number;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ 
  children, 
  chunkThreshold = 1024 * 1024 * 10 // 10MB default
}) => {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [engines] = useState<Record<string, UploadEngine>>({});

  const generateId = useCallback(() => {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const uploadFile = useCallback(
    (file: File, options: UploadOptions | ChunkUploadOptions, useChunked?: boolean) => {
      const id = generateId();
      const engine = new UploadEngine();
      engines[id] = engine;

      const shouldChunk = useChunked ?? UploadEngine.shouldUseChunkedUpload(file, chunkThreshold);

      setUploads((prev) => ({
        ...prev,
        [id]: {
          id,
          file,
          status: UploadStatus.Uploading,
          progress: 0,
        },
      }));

      const uploadOptions = {
        ...options,
        onProgress: (progress: number) => {
          setUploads((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              progress,
            },
          }));
          options.onProgress?.(progress);
        },
        onSuccess: (response: any) => {
          setUploads((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              status: UploadStatus.Completed,
              progress: 100,
            },
          }));
          options.onSuccess?.(response);
          delete engines[id];
        },
        onError: (error: Error) => {
          setUploads((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              status: UploadStatus.Error,
              error,
            },
          }));
          options.onError?.(error);
          delete engines[id];
        },
      };

      if (shouldChunk) {
        engine.uploadChunked(file, uploadOptions as ChunkUploadOptions).catch(() => {
          // Error already handled in onError callback
        });
      } else {
        engine.uploadSingle(file, uploadOptions).catch(() => {
          // Error already handled in onError callback
        });
      }

      return id;
    },
    [generateId, engines, chunkThreshold]
  );

  const cancelUpload = useCallback(
    (id: string) => {
      const engine = engines[id];
      if (engine) {
        engine.cancel();
        setUploads((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            status: UploadStatus.Cancelled,
          },
        }));
        delete engines[id];
      }
    },
    [engines]
  );

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    delete engines[id];
  }, [engines]);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const filtered: Record<string, UploadState> = {};
      Object.entries(prev).forEach(([id, upload]) => {
        if (upload.status !== UploadStatus.Completed) {
          filtered[id] = upload;
        }
      });
      return filtered;
    });
  }, []);

  const value: UploadContextValue = {
    uploads,
    uploadFile,
    cancelUpload,
    removeUpload,
    clearCompleted,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export const useUpload = (): UploadContextValue => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

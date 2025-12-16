import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UploadProvider, useUpload } from './UploadContext';
import { UploadStatus } from './types';

describe('UploadContext', () => {
  let mockXHR: any;

  beforeEach(() => {
    mockXHR = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      upload: {
        addEventListener: jest.fn(),
      },
      addEventListener: jest.fn(),
      abort: jest.fn(),
      status: 200,
      responseText: '{"success": true}',
    };

    (global as any).XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should provide upload functionality', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UploadProvider>{children}</UploadProvider>
    );

    const { result } = renderHook(() => useUpload(), { wrapper });

    expect(result.current.uploads).toEqual({});
    expect(typeof result.current.uploadFile).toBe('function');
    expect(typeof result.current.cancelUpload).toBe('function');
    expect(typeof result.current.removeUpload).toBe('function');
    expect(typeof result.current.clearCompleted).toBe('function');
  });

  it('should upload a file and track progress', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UploadProvider>{children}</UploadProvider>
    );

    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    let uploadId: string;

    act(() => {
      uploadId = result.current.uploadFile(file, {
        url: 'https://example.com/upload',
      });
    });

    expect(result.current.uploads[uploadId!]).toBeDefined();
    expect(result.current.uploads[uploadId!].status).toBe(UploadStatus.Uploading);
    expect(result.current.uploads[uploadId!].file).toBe(file);
  });

  it('should cancel an upload', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UploadProvider>{children}</UploadProvider>
    );

    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    let uploadId: string;

    act(() => {
      uploadId = result.current.uploadFile(file, {
        url: 'https://example.com/upload',
      });
    });

    act(() => {
      result.current.cancelUpload(uploadId!);
    });

    expect(result.current.uploads[uploadId!].status).toBe(UploadStatus.Cancelled);
  });

  it('should remove an upload', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UploadProvider>{children}</UploadProvider>
    );

    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    let uploadId: string;

    act(() => {
      uploadId = result.current.uploadFile(file, {
        url: 'https://example.com/upload',
      });
    });

    expect(result.current.uploads[uploadId!]).toBeDefined();

    act(() => {
      result.current.removeUpload(uploadId!);
    });

    expect(result.current.uploads[uploadId!]).toBeUndefined();
  });

  it('should clear completed uploads', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UploadProvider>{children}</UploadProvider>
    );

    const { result } = renderHook(() => useUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    let uploadId: string;

    act(() => {
      uploadId = result.current.uploadFile(file, {
        url: 'https://example.com/upload',
      });
    });

    // Simulate success
    const loadHandler = mockXHR.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'load'
    )?.[1];

    act(() => {
      loadHandler?.();
    });

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.uploads[uploadId!]).toBeUndefined();
  });

  it('should throw error when useUpload is used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useUpload();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useUpload must be used within an UploadProvider');
  });
});

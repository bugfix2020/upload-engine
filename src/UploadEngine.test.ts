import { UploadEngine } from './UploadEngine';
import { UploadOptions } from './types';

describe('UploadEngine', () => {
  let mockXHR: any;
  let xhrInstances: any[];

  beforeEach(() => {
    xhrInstances = [];
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

    // Mock XMLHttpRequest
    (global as any).XMLHttpRequest = jest.fn(() => {
      xhrInstances.push(mockXHR);
      return mockXHR;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadSingle', () => {
    it('should upload a file successfully', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const options: UploadOptions = {
        url: 'https://example.com/upload',
        onSuccess: jest.fn(),
        onProgress: jest.fn(),
      };

      const engine = new UploadEngine();
      const uploadPromise = engine.uploadSingle(file, options);

      // Simulate progress
      const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'progress'
      )[1];
      progressHandler({ lengthComputable: true, loaded: 50, total: 100 });

      // Simulate success
      const loadHandler = mockXHR.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'load'
      )[1];
      loadHandler();

      await uploadPromise;

      expect(mockXHR.open).toHaveBeenCalledWith('POST', 'https://example.com/upload');
      expect(mockXHR.send).toHaveBeenCalled();
      expect(options.onProgress).toHaveBeenCalledWith(50);
      expect(options.onSuccess).toHaveBeenCalledWith({ success: true });
    });

    it('should handle upload errors', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const options: UploadOptions = {
        url: 'https://example.com/upload',
        onError: jest.fn(),
        maxRetries: 0,
      };

      const engine = new UploadEngine();
      const uploadPromise = engine.uploadSingle(file, options);

      // Simulate error
      const errorHandler = mockXHR.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'error'
      )[1];
      errorHandler();

      await expect(uploadPromise).rejects.toThrow();
      expect(options.onError).toHaveBeenCalled();
    });

    it('should cancel upload', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const options: UploadOptions = {
        url: 'https://example.com/upload',
      };

      const engine = new UploadEngine();
      const uploadPromise = engine.uploadSingle(file, options);

      engine.cancel();

      // Simulate abort
      const abortHandler = mockXHR.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'abort'
      )[1];
      abortHandler();

      await expect(uploadPromise).rejects.toThrow('Upload cancelled');
    });
  });

  describe('shouldUseChunkedUpload', () => {
    it('should return true for large files', () => {
      const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.txt');
      expect(UploadEngine.shouldUseChunkedUpload(largeFile)).toBe(true);
    });

    it('should return false for small files', () => {
      const smallFile = new File(['small content'], 'small.txt');
      expect(UploadEngine.shouldUseChunkedUpload(smallFile)).toBe(false);
    });

    it('should use custom threshold', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'medium.txt');
      expect(UploadEngine.shouldUseChunkedUpload(file, 3 * 1024 * 1024)).toBe(true);
      expect(UploadEngine.shouldUseChunkedUpload(file, 10 * 1024 * 1024)).toBe(false);
    });
  });

  describe('uploadChunked', () => {
    it('should upload file in chunks', async () => {
      // Create a simpler test with smaller file
      const content = 'x'.repeat(15 * 1024); // 15KB to make test faster
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const options: UploadOptions = {
        url: 'https://example.com/upload',
        chunkSize: 5 * 1024, // 5KB chunks
        onSuccess: jest.fn(),
        onChunkProgress: jest.fn(),
      };

      const engine = new UploadEngine();
      
      // Mock multiple XHR instances for chunks
      let chunkCount = 0;
      const expectedChunks = Math.ceil(file.size / options.chunkSize!);
      
      (global as any).XMLHttpRequest = jest.fn(() => {
        const mockInstance = {
          open: jest.fn(),
          send: jest.fn(function(this: any) {
            // Immediately simulate success for this chunk
            setTimeout(() => {
              this.status = 200;
              this.responseText = JSON.stringify({ chunk: chunkCount++ });
              const loadHandler = this.addEventListener.mock.calls.find(
                (call: any) => call[0] === 'load'
              )?.[1];
              loadHandler?.();
            }, 0);
          }),
          setRequestHeader: jest.fn(),
          upload: {
            addEventListener: jest.fn(),
          },
          addEventListener: jest.fn(),
          abort: jest.fn(),
          status: 200,
          responseText: '{"success": true}',
        };
        return mockInstance;
      });

      await engine.uploadChunked(file, options);

      // Should create 3 chunks (15KB / 5KB)
      expect(chunkCount).toBe(expectedChunks);
      expect(options.onSuccess).toHaveBeenCalled();
    });
  });
});

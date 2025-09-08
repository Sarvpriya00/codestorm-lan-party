import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Request Configuration', () => {
    it('should include authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should not include authorization header when no token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });

    it('should include content-type header for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET requests correctly', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests correctly', async () => {
      const mockResponse = { success: true, data: { id: 2 } };
      const postData = { name: 'New User', email: 'test@example.com' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.post('/users', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make PUT requests correctly', async () => {
      const mockResponse = { success: true, data: { id: 1, updated: true } };
      const putData = { name: 'Updated User' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.put('/users/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make DELETE requests correctly', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make PATCH requests correctly', async () => {
      const mockResponse = { success: true, data: { id: 1, patched: true } };
      const patchData = { status: 'active' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.patch('/users/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Query Parameters', () => {
    it('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await api.get('/users', { page: 1, limit: 10, status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users?page=1&limit=10&status=active'),
        expect.any(Object)
      );
    });

    it('should handle empty query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await api.get('/users', {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.any(Object)
      );
    });

    it('should handle undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await api.get('/users', { page: 1, filter: undefined, limit: 10 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).not.toContain('filter=');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(api.get('/users/999')).rejects.toThrow('User not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.get('/users')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.get('/users')).rejects.toThrow('Invalid JSON');
    });

    it('should handle 401 unauthorized responses', async () => {
      const errorResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token expired' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(api.get('/protected')).rejects.toThrow('Token expired');
      
      // Should clear token from localStorage on 401
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle 403 forbidden responses', async () => {
      const errorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(api.get('/admin/users')).rejects.toThrow('Insufficient permissions');
    });

    it('should handle 500 server errors', async () => {
      const errorResponse = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Server error' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(api.get('/users')).rejects.toThrow('Server error');
    });
  });

  describe('Request Interceptors', () => {
    it('should add request timestamp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-Time': expect.any(String),
          }),
        })
      );
    });

    it('should add request ID for tracking', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Response Interceptors', () => {
    it('should log response times for performance monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Request'),
        expect.objectContaining({
          url: expect.stringContaining('/test'),
          method: 'GET',
          duration: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests up to 3 times', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });

      const result = await api.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true, data: {} });
    });

    it('should not retry 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Invalid data' }
        }),
      });

      await expect(api.get('/test')).rejects.toThrow('Invalid data');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Server error' }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });

      const result = await api.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true, data: {} });
    });
  });

  describe('Request Timeout', () => {
    it('should timeout long-running requests', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
      );

      await expect(api.get('/slow-endpoint')).rejects.toThrow('Request timeout');
    });
  });

  describe('Base URL Configuration', () => {
    it('should use correct base URL for API requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^http.*\/api\/test$/),
        expect.any(Object)
      );
    });

    it('should handle absolute URLs correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await api.get('https://external-api.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.any(Object)
      );
    });
  });
});
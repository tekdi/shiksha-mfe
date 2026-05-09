/**
 * Security utilities for input validation, sanitization, and XSS prevention
 */

export const SecurityUtils = {
  /**
   * Sanitize HTML to prevent XSS attacks
   */
  sanitizeHtml: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Validate file uploads
   */
  validateFile: (file: File, maxSizeMB: number = 50, allowedTypes: string[] = ['text/plain', 'application/pdf']): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
    }

    // Check file name
    if (!/^[a-zA-Z0-9\-_.()]+$/.test(file.name)) {
      return { valid: false, error: 'File name contains invalid characters' };
    }

    return { valid: true };
  },

  /**
   * Validate text input
   */
  validateText: (text: string, minLength: number = 10, maxLength: number = 10000): { valid: boolean; error?: string } => {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }

    if (text.length < minLength) {
      return { valid: false, error: `Text must be at least ${minLength} characters` };
    }

    if (text.length > maxLength) {
      return { valid: false, error: `Text must not exceed ${maxLength} characters` };
    }

    return { valid: true };
  },

  /**
   * Escape JSON for safe display
   */
  escapeJson: (obj: any): string => {
    return JSON.stringify(obj, null, 2)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Validate API response
   */
  validateResponse: (response: any, expectedFields: string[]): { valid: boolean; error?: string } => {
    if (!response) {
      return { valid: false, error: 'Response is empty' };
    }

    for (const field of expectedFields) {
      if (!(field in response)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  },

  /**
   * Rate limiting helper
   */
  createRateLimiter: (maxRequests: number = 10, windowMs: number = 60000) => {
    const requests: number[] = [];

    return {
      isAllowed: (): boolean => {
        const now = Date.now();
        const recentRequests = requests.filter((time) => now - time < windowMs);

        if (recentRequests.length >= maxRequests) {
          return false;
        }

        requests.push(now);
        // Clean old requests
        while (requests.length > 0 && now - requests[0] > windowMs) {
          requests.shift();
        }

        return true;
      },
    };
  },
};

class OfflineService {
  isOnline(): boolean {
    if (typeof window !== "undefined") {
      return window.navigator.onLine;
    }
    return true;
  }

  async resolveOfflineURL(url: string): Promise<string> {
    return url;
  }

  async getStoredMetadata(identifier: string): Promise<any> {
    return null;
  }

  async downloadContentMetadata(identifier: string, content: any): Promise<void> {
    // Mock implementation
  }

  async downloadAsset(url: string): Promise<void> {
    // Mock implementation
  }

  async queueTelemetry(type: string, data: any): Promise<void> {
    // Mock implementation
  }
}

export const offlineService = new OfflineService();

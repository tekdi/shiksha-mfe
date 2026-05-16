import { AIGatewayService } from '../AIGatewayService';

describe('AIGatewayService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploadDocument sends FormData POST to correct URL', async () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const mockResponse = { file_id: '123' };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await AIGatewayService.uploadDocument(mockFile);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/ingestion/upload'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('getPipelineStreamUrl returns correct URL with job_id', () => {
    const jobId = 'test-job-id';
    const url = AIGatewayService.getPipelineStreamUrl(jobId);
    expect(url).toContain(`/api/v1/pipeline/stream?job_id=${jobId}`);
  });
});

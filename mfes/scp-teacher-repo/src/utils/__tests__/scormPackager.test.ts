import { downloadSCORM } from '../scormPackager';
import * as fflate from 'fflate';

// Mock fflate.zip
jest.mock('fflate', () => ({
  ...jest.requireActual('fflate'),
  zip: jest.fn((data, cb) => cb(null, new Uint8Array())),
  strToU8: jest.fn((s) => new Uint8Array(Buffer.from(s)))
}));


// Mock DOM elements and URL
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

global.document.createElement = mockCreateElement;
global.document.body.appendChild = mockAppendChild;
global.document.body.removeChild = mockRemoveChild;
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('downloadSCORM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateElement.mockReturnValue({
      setAttribute: jest.fn(),
      click: mockClick,
      remove: jest.fn()
    });
  });

  it('generates a zip containing imsmanifest.xml, scorm-api.js, index.html', async () => {
    const generatedOutputs = {
      quiz: {
        type: 'quiz',
        questionType: 'mcq',
        questions: []
      }
    };

    await downloadSCORM(generatedOutputs, "Test Quiz");

    expect(fflate.zip).toHaveBeenCalledWith(
      expect.objectContaining({
        'imsmanifest.xml': expect.any(Uint8Array),
        'scorm-api.js': expect.any(Uint8Array),
        'index.html': expect.any(Uint8Array)
      }),
      expect.any(Function)
    );
  });

  it('throws if no quiz content is provided', async () => {
    await expect(downloadSCORM({}, "Test")).rejects.toThrow("No quiz content to pack");
  });

  it('triggers a download for the generated zip', async () => {
    const generatedOutputs = {
      quiz: {
        type: 'quiz',
        questionType: 'mcq',
        questions: []
      }
    };

    await downloadSCORM(generatedOutputs, "Test Quiz");

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
  });
});

import * as fflate from 'fflate';

/**
 * Packs data into a zip and triggers a browser download.
 */
export const packageAndDownload = async (
  zipData: fflate.Zippable,
  filename: string
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    fflate.zip(zipData, (err, data) => {
      if (err) return reject(err);
      
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    });
  });
};

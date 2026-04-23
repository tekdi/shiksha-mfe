import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Save CSV to a temporary location
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const csvPath = path.join(tempDir, 'content.csv');
    await fs.copyFile(file.filepath, csvPath);

    // Run Python script
    const scriptPath = path.join(
      process.cwd(),
      'scripts',
      'import_excel_to_mysql.py'
    );
    const { stdout, stderr } = await execPromise(`python3 ${scriptPath}`);

    if (stderr) {
      console.error('Python script error:', stderr);
      throw new Error('Failed to import data to MySQL');
    }

    console.log('Python script output:', stdout);

    // Clean up
    await fs.unlink(file.filepath);
    await fs.unlink(csvPath);

    return res.status(200).json({
      message: 'Data imported successfully',
      details: stdout,
    });
  } catch (error) {
    console.error('Error in import handler:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

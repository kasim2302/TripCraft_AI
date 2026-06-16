import fs from 'fs';
import { createRequire } from 'module';
import Tesseract from 'tesseract.js';

// pdf-parse is a CommonJS module — must use createRequire in ESM context
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export const extractText = async (filePathOrUrl, fileType) => {
  try {
    let buffer;
    
    // Check if path is a remote URL (S3) or local file
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
      console.log(`Downloading S3 document for OCR: ${filePathOrUrl}`);
      const res = await fetch(filePathOrUrl);
      if (!res.ok) {
        throw new Error(`Failed to retrieve file from S3: ${res.statusText}`);
      }
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      console.log(`Reading local file for OCR: ${filePathOrUrl}`);
      buffer = fs.readFileSync(filePathOrUrl);
    }

    // Process PDF documents
    if (fileType === 'application/pdf' || filePathOrUrl.toLowerCase().endsWith('.pdf')) {
      console.log('Parsing PDF contents...');
      const parser = new PDFParse({ data: buffer });
      const parsedData = await parser.getText();
      await parser.destroy();
      return parsedData.text;
    } 
    // Process image uploads (PNG/JPG/JPEG)
    else {
      console.log('Running Tesseract OCR scanner on image buffer...');
      const result = await Tesseract.recognize(buffer, 'eng');
      return result.data.text;
    }
  } catch (error) {
    console.error('OCR Extraction Failure:', error);
    throw new Error(`OCR parsing failure: ${error.message}`);
  }
};

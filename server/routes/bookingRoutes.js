import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';
import { extractText } from '../services/ocrService.js';
import { parseTravelDocument } from '../services/geminiService.js';
import { generateItineraryFromBooking } from '../services/itineraryGenerator.js';
import Itinerary from '../models/Itinerary.js';

const router = express.Router();

// Define allowed mime-types and limits
const ALLOWED_MIMETYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PNG, JPG, and JPEG are allowed.'), false);
  }
};

// Configure AWS S3 Client
const hasAwsConfig = 
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_S3_BUCKET_NAME;

let s3Client = null;
let upload = null;

if (hasAwsConfig) {
  console.log('AWS S3 credentials found. Initializing S3 uploader storage...');
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      metadata: (req, file, cb) => {
        cb(null, { fieldname: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `bookings/${uniqueSuffix}-${file.originalname}`);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  });
} else {
  console.log('No S3 credentials found. Falling back to local disk storage...');
  
  // Ensure local uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  });
}

// @desc    Upload booking document & run OCR + Gemini parsing
// @route   POST /api/bookings/upload
// @access  Private
router.post('/upload', protect, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      let fileUrl = '';
      let fileKey = '';

      if (hasAwsConfig) {
        fileUrl = req.file.location; // S3 File URL
        fileKey = req.file.key;      // S3 File Key
      } else {
        fileUrl = `/uploads/${req.file.filename}`; // Local static URL
        fileKey = req.file.filename;               // Local filename
      }

      console.log(`File uploaded successfully. Url: ${fileUrl}, Key: ${fileKey}`);

      // 1. Run OCR Extraction
      const absolutePathOrUrl = hasAwsConfig ? fileUrl : req.file.path;
      console.log(`Triggering OCR parsing on path: ${absolutePathOrUrl}`);
      const rawText = await extractText(absolutePathOrUrl, req.file.mimetype);

      // 2. Query Gemini API for structure
      console.log('Triggering Gemini booking details extraction...');
      const extractedData = await parseTravelDocument(rawText);

      // 3. Save Booking details to database
      const booking = await Booking.create({
        userId: req.user._id,
        fileUrl,
        fileKey,
        fileType: req.file.mimetype,
        extractedData,
      });

      return res.status(201).json({
        _id: booking._id,
        fileUrl,
        fileType: req.file.mimetype,
        extractedData,
      });
    } catch (ocrError) {
      console.error('OCR/Gemini processing failure:', ocrError.message);
      return res.status(500).json({
        message: 'File uploaded, but failed to extract OCR text details.',
        error: ocrError.message,
      });
    }
  });
});

// @desc    Delete booking document & remove from S3 / local storage
// @route   DELETE /api/bookings/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }

    // Remove file object from storage
    if (hasAwsConfig && s3Client) {
      console.log(`Deleting file object from AWS S3 bucket: ${booking.fileKey}`);
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: booking.fileKey,
        })
      );
    } else {
      const localPath = path.join('uploads', booking.fileKey);
      if (fs.existsSync(localPath)) {
        console.log(`Deleting local file from disk: ${localPath}`);
        fs.unlinkSync(localPath);
      }
    }

    // Remove DB document
    await Booking.deleteOne({ _id: booking._id });
    return res.json({ message: 'Booking and file object deleted successfully' });
  } catch (error) {
    console.error('Booking deletion failed:', error);
    return res.status(500).json({ message: 'Server error deleting booking' });
  }
});

// @desc    Auto-generate full itinerary from booking fields
// @route   POST /api/bookings/generate-itinerary
// @access  Private
router.post('/generate-itinerary', protect, async (req, res) => {
  const { departure, arrival, hotel, checkIn, checkOut } = req.body;

  try {
    console.log(`Generating itinerary from booking data for destination: ${arrival}`);
    const generated = await generateItineraryFromBooking({
      departure,
      arrival,
      hotel,
      checkIn,
      checkOut,
    });

    // Generate unique shareId for public page mapping
    const uniqueShareId = 'share-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    const itinerary = await Itinerary.create({
      userId: req.user._id,
      title: generated.title || `Trip to ${arrival}`,
      destination: generated.destination || arrival,
      itinerary: generated.days || [],
      shareId: uniqueShareId,
    });

    return res.status(201).json(itinerary);
  } catch (error) {
    console.error('Itinerary generation endpoint failed:', error);
    return res.status(500).json({ message: 'Failed to compile itinerary from bookings' });
  }
});

export default router;

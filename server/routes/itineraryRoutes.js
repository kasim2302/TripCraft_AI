import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Itinerary from '../models/Itinerary.js';

const router = express.Router();

// @desc    Get all itineraries for logged-in user
// @route   GET /api/itinerary
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(itineraries);
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return res.status(500).json({ message: 'Server error fetching itineraries' });
  }
});

// @desc    Get public shared itinerary by shareId (No login/auth required)
// @route   GET /api/itinerary/share/:shareId
// @access  Public
router.get('/share/:shareId', async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ shareId: req.params.shareId });
    if (!itinerary) {
      return res.status(404).json({ message: 'Shared itinerary not found' });
    }
    return res.json(itinerary);
  } catch (error) {
    console.error('Error fetching shared itinerary:', error);
    return res.status(500).json({ message: 'Server error fetching shared itinerary' });
  }
});

// @desc    Get itinerary details by ID
// @route   GET /api/itinerary/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ _id: req.params.id, userId: req.user._id });
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    return res.json(itinerary);
  } catch (error) {
    console.error('Error fetching itinerary details:', error);
    return res.status(500).json({ message: 'Server error fetching itinerary details' });
  }
});

export default router;

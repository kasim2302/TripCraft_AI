import Trip from '../models/Trip.js';
import { generateItinerary } from '../services/aiService.js';

// @desc    Get all trips for logged in user
// @route   GET /api/trips
// @access  Private
const getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ startDate: 1 });
    return res.json(trips);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return res.status(500).json({ message: 'Server error fetching trips' });
  }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({ message: 'Server error fetching trip' });
  }
};

// @desc    Create a new AI-generated trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  const { destination, startDate, endDate, budgetLimit, companion, interests } = req.body;

  try {
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide destination, start date, and end date' });
    }

    // Call service to generate travel plans
    const { itinerary, packingList, budgetLedger } = await generateItinerary(
      destination,
      startDate,
      endDate,
      budgetLimit || 0,
      companion || 'solo',
      interests || []
    );

    const trip = await Trip.create({
      user: req.user._id,
      destination,
      startDate,
      endDate,
      budgetLimit: budgetLimit || 0,
      companion: companion || 'solo',
      interests: interests || [],
      itinerary,
      packingList,
      budgetLedger,
    });

    return res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    return res.status(500).json({ message: 'Server error generating trip itinerary' });
  }
};

// @desc    Update a trip (general updates)
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Update allowable fields
    const fieldsToUpdate = [
      'destination',
      'startDate',
      'endDate',
      'budgetLimit',
      'companion',
      'interests',
      'itinerary',
      'packingList',
      'budgetLedger',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    const updatedTrip = await trip.save();
    return res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    return res.status(500).json({ message: 'Server error updating trip' });
  }
};

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const result = await Trip.deleteOne({ _id: req.params.id, user: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    return res.json({ message: 'Trip removed successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({ message: 'Server error deleting trip' });
  }
};

// @desc    Toggle packing list item status
// @route   PUT /api/trips/:id/packing/:itemId
// @access  Private
const togglePackingItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = trip.packingList.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    item.packed = !item.packed;
    await trip.save();

    return res.json(trip);
  } catch (error) {
    console.error('Error toggling packing item:', error);
    return res.status(500).json({ message: 'Server error toggling packing item' });
  }
};

// @desc    Add item to budget ledger
// @route   POST /api/trips/:id/budget
// @access  Private
const addBudgetItem = async (req, res) => {
  const { title, amount, category, date } = req.body;

  try {
    if (!title || amount === undefined) {
      return res.status(400).json({ message: 'Please provide title and amount' });
    }

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.budgetLedger.push({ title, amount, category, date });
    await trip.save();

    return res.json(trip);
  } catch (error) {
    console.error('Error adding budget item:', error);
    return res.status(500).json({ message: 'Server error adding budget item' });
  }
};

// @desc    Delete item from budget ledger
// @route   DELETE /api/trips/:id/budget/:itemId
// @access  Private
const deleteBudgetItem = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = trip.budgetLedger.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Budget item not found' });
    }

    trip.budgetLedger.pull(req.params.itemId);
    await trip.save();

    return res.json(trip);
  } catch (error) {
    console.error('Error deleting budget item:', error);
    return res.status(500).json({ message: 'Server error deleting budget item' });
  }
};

// @desc    Chat about trip itinerary
// @route   POST /api/trips/:id/chat
// @access  Private
const chatAboutTrip = async (req, res) => {
  const { message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'Gemini API is not configured on the server' });
    }

    // Format trip data into a compact summary for prompt context
    const itinerarySummary = trip.itinerary.map(day => {
      const activities = day.activities.map(act => `- ${act.time}: ${act.title} (${act.category}, cost: $${act.cost}): ${act.description}`).join('\n');
      return `Day ${day.dayNumber} (${day.date}):\n${activities}`;
    }).join('\n\n');

    const contextPrompt = `
You are a personal travel guide and local concierge for a trip to ${trip.destination}.
Here is the travel plan details:
- Destination: ${trip.destination}
- Dates: ${trip.startDate.toISOString().split('T')[0]} to ${trip.endDate.toISOString().split('T')[0]}
- Companion: ${trip.companion}
- Interests: ${trip.interests.join(', ')}
- Budget Limit: $${trip.budgetLimit}
- Current Logged Expense Total: $${trip.totalCost || 0}

Itinerary details:
${itinerarySummary}

The user is asking a question about their trip: "${message}"

Provide a friendly, highly helpful, and conversational response. Answer any questions the user has about their trip, the destination, local tips, general recommendations, custom activities, or anything else, dynamically drawing from both the itinerary context and your general travel knowledge about ${trip.destination}. Give specific, useful tips (like romantic spots, dress codes, restaurant options, routing advice, local customs, or weather recommendations).
Keep the response relatively concise (maximum 4-5 sentences). Do not use markdown code block formatting or markdown headers, just plain bold/italic styling where appropriate.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: contextPrompt }]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API connection error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "I couldn't generate a response. Please try again.";

    return res.json({ reply });
  } catch (error) {
    console.error('Error in trip chat:', error);
    return res.status(500).json({ message: 'Server error processing chat request' });
  }
};

export {
  getUserTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  togglePackingItem,
  addBudgetItem,
  deleteBudgetItem,
  chatAboutTrip,
};

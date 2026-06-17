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
      'groupMembers',
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
  const { title, amount, category, date, paidBy, splitWith } = req.body;

  try {
    if (!title || amount === undefined) {
      return res.status(400).json({ message: 'Please provide title and amount' });
    }

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.budgetLedger.push({ title, amount, category, date, paidBy, splitWith });
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
      const activities = day.activities.map(act => `- ${act.time}: ${act.title} (${act.category}, cost: $${act.cost}, lat: ${act.latitude || 'N/A'}, lon: ${act.longitude || 'N/A'}): ${act.description || ''}`).join('\n');
      return `Day ${day.dayNumber} (${day.date}):\n${activities}`;
    }).join('\n\n');

    const contextPrompt = `
You are an intelligent travel concierge and planning assistant for a trip to ${trip.destination}.
Your role is to both converse with the user and execute modifications to their travel itinerary when requested.

Here are the current travel plan details:
- Destination: ${trip.destination}
- Dates: ${trip.startDate.toISOString().split('T')[0]} to ${trip.endDate.toISOString().split('T')[0]}
- Companion: ${trip.companion}
- Interests: ${trip.interests.join(', ')}
- Budget Limit: $${trip.budgetLimit}
- Current Logged Expense Total: $${trip.totalCost || 0}

Itinerary details:
${itinerarySummary}

The user's message is: "${message}"

Determine if the user is asking to add, delete, edit, or modify an activity in their itinerary.
1. If they want to MODIFY (add, remove, or edit) the itinerary:
   - Formulate a brief, friendly reply confirming the change.
   - Formulate a structured action object representing the edit.
     Supported actions:
     - { "type": "ADD_ACTIVITY", "dayNumber": 1, "activity": { "time": "09:00 AM", "title": "Sushi Lunch", "description": "Local food tasting", "cost": 25, "category": "Food", "latitude": 35.6762, "longitude": 139.6503 } }
     - { "type": "DELETE_ACTIVITY", "dayNumber": 1, "activityTitle": "Sushi Lunch" }
     - { "type": "EDIT_ACTIVITY", "dayNumber": 1, "oldTitle": "Sushi Lunch", "updatedFields": { "title": "Fine Dining Sushi", "time": "01:00 PM", "cost": 80 } }
     (Note: Category must be one of: Sightseeing, Food, Transport, Lodging, Activities, Other. Ensure latitude and longitude are valid numbers for physical spots in ${trip.destination}.)

2. If they are just asking a QUESTION or having a chat:
   - Formulate a friendly, highly helpful response.
   - Set the action field to null.

You MUST respond strictly with a valid JSON object matching this schema (do not wrap in markdown fences or comments, just output raw JSON):
{
  "reply": "Conversational reply to the user.",
  "action": null | { "type": "ADD_ACTIVITY" | "DELETE_ACTIVITY" | "EDIT_ACTIVITY", ... }
}
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
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API connection error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!textResponse) {
      throw new Error('Received empty response from Gemini API');
    }

    const parsedResponse = JSON.parse(textResponse);
    let reply = parsedResponse.reply || "I've processed your request.";

    if (parsedResponse.action) {
      const { type, dayNumber, activity, activityTitle, oldTitle, updatedFields } = parsedResponse.action;
      
      if (type === 'ADD_ACTIVITY' && dayNumber && activity) {
        const day = trip.itinerary.find(d => d.dayNumber === Number(dayNumber));
        if (day) {
          day.activities.push(activity);
        }
      } else if (type === 'DELETE_ACTIVITY' && dayNumber && activityTitle) {
        const day = trip.itinerary.find(d => d.dayNumber === Number(dayNumber));
        if (day) {
          day.activities = day.activities.filter(
            a => a.title.toLowerCase() !== activityTitle.toLowerCase() &&
                 !a.title.toLowerCase().includes(activityTitle.toLowerCase())
          );
        }
      } else if (type === 'EDIT_ACTIVITY' && dayNumber && oldTitle && updatedFields) {
        const day = trip.itinerary.find(d => d.dayNumber === Number(dayNumber));
        if (day) {
          const act = day.activities.find(
            a => a.title.toLowerCase() === oldTitle.toLowerCase() ||
                 a.title.toLowerCase().includes(oldTitle.toLowerCase())
          );
          if (act) {
            Object.assign(act, updatedFields);
          }
        }
      }

      await trip.save();
    }

    return res.json({ reply, trip });
  } catch (error) {
    console.error('Error in trip chat:', error);
    return res.status(500).json({ message: 'Server error processing chat request', error: error.message });
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

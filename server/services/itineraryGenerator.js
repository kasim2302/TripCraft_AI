const getDaysDiff = (startStr, endStr) => {
  const start = new Date(startStr || new Date());
  const end = new Date(endStr || new Date());
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getMockBaseCoords = (dest = '') => {
  const d = dest.toLowerCase();
  if (d.includes('tokyo') || d.includes('japan')) return { lat: 35.6762, lon: 139.6503 };
  if (d.includes('paris') || d.includes('france')) return { lat: 48.8566, lon: 2.3522 };
  if (d.includes('london') || d.includes('uk')) return { lat: 51.5074, lon: -0.1278 };
  if (d.includes('bali')) return { lat: -8.4095, lon: 115.1889 };
  if (d.includes('greece') || d.includes('athens')) return { lat: 37.9838, lon: 23.7275 };
  return { lat: 40.7128, lon: -74.0060 }; // Default to New York
};

// Offline Mock Itinerary Generator Fallback
const fallbackGenerateItinerary = (input) => {
  const destination = input.arrival || 'Amalfi Coast, Italy';
  const numDays = getDaysDiff(input.checkIn, input.checkOut) || 3;
  const base = getMockBaseCoords(destination);
  
  const days = [];
  for (let i = 1; i <= numDays; i++) {
    const getOffsetCoords = (activityIndex) => {
      const angle = (((i * 4) + activityIndex) / 16) * 2 * Math.PI;
      const radius = 0.015 + (activityIndex * 0.003);
      return {
        latitude: Number((base.lat + Math.cos(angle) * radius * 0.6).toFixed(6)),
        longitude: Number((base.lon + Math.sin(angle) * radius).toFixed(6))
      };
    };

    const c1 = getOffsetCoords(0);
    const c2 = getOffsetCoords(1);
    const c3 = getOffsetCoords(2);
    const c4 = getOffsetCoords(3);

    days.push({
      day: i,
      activities: [
        {
          time: '09:00 AM',
          title: `Explore Scenic Landmarks in ${destination}`,
          description: `Stroll through iconic alleys, monuments, and viewing decks. Grab photos of local travel spots.`,
          cost: 20,
          category: 'Sightseeing',
          latitude: c1.latitude,
          longitude: c1.longitude,
        },
        {
          time: '01:00 PM',
          title: `Lunch at local Bistro`,
          description: `Savor traditional pasta, seafood, and fresh refreshments recommended by regional food guides.`,
          cost: 30,
          category: 'Food',
          latitude: c2.latitude,
          longitude: c2.longitude,
        },
        {
          time: '04:00 PM',
          title: `Sightseeing & Main Attractions`,
          description: `Enjoy standard guided museum excursions or relaxation tours mapping regional highlights.`,
          cost: 0,
          category: 'Sightseeing',
          latitude: c3.latitude,
          longitude: c3.longitude,
        },
        {
          time: '07:30 PM',
          title: `Dinner near ${input.hotel || 'resort lodging'}`,
          description: `Enjoy fine local dining with fresh regional ingredients. Travel Tip: Make reservations early.`,
          cost: 50,
          category: 'Food',
          latitude: c4.latitude,
          longitude: c4.longitude,
        },
      ],
    });
  }

  return {
    title: `AI Trip: Escape to ${destination}`,
    destination: destination,
    days: days,
  };
};

export const generateItineraryFromBooking = async (input) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const destination = input.arrival || 'Kyoto, Japan';

  if (!apiKey) {
    console.log('No GEMINI_API_KEY found, using local fallback itinerary compiler.');
    return fallbackGenerateItinerary(input);
  }

  try {
    const prompt = `
Generate a structured day-by-day travel itinerary based on this booking detail:
- Departure location: ${input.departure}
- Destination: ${input.arrival}
- Hotel stay: ${input.hotel}
- Check-in Date: ${input.checkIn}
- Check-out Date: ${input.checkOut}

Return ONLY a raw valid JSON object. Do not wrap in markdown quotes. The JSON structure must exactly match:
{
  "title": "A catchy trip title",
  "destination": "${destination}",
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity Title",
          "description": "Vivid detail containing attractions, food advice, and travel tips",
          "cost": 15,
          "category": "Sightseeing",
          "latitude": 35.6762,
          "longitude": 139.6503
        }
      ]
    }
  ]
}
For categories, choose from: Sightseeing, Food, Transport, Lodging, Activities, Other. Provide 3-4 activities per day.
Each activity MUST have precise, real latitude and longitude numbers (numerical float values, not strings) mapping to actual physical locations in ${destination} so they can be routed correctly on a map.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
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
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (textResponse) {
      const parsed = JSON.parse(textResponse);
      if (parsed.days && Array.isArray(parsed.days)) {
        return parsed;
      }
    }
    throw new Error('Received invalid JSON from Gemini API');
  } catch (err) {
    console.error('Gemini Itinerary Generation failed, using fallback:', err.message);
    return fallbackGenerateItinerary(input);
  }
};

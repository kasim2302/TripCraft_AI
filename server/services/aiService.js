

// A list of interesting activities by category and budget to build robust mock itineraries dynamically
const MOCK_ACTIVITIES = {
  adventure: [
    { title: 'Hiking & Scenic Outlook', description: 'Explore local wilderness trails and capture panoramic views of the area.', costLow: 0, costHigh: 15, category: 'Sightseeing' },
    { title: 'Zipline Canopy Tour', description: 'Soar through the treetops on a guided eco-adventure zipline course.', costLow: 45, costHigh: 90, category: 'Activities' },
    { title: 'Bike Rental Exploration', description: 'Rent a mountain bike or e-bike to explore the coastline and rugged terrain.', costLow: 15, costHigh: 40, category: 'Transport' },
    { title: 'Water Sports Experience', description: 'Try kayaking, paddleboarding, or surfing at a local bay.', costLow: 20, costHigh: 60, category: 'Activities' },
  ],
  food: [
    { title: 'Local Street Food Walk', description: 'Savor regional specialties, sweet treats, and iconic beverages from historic stalls.', costLow: 10, costHigh: 25, category: 'Food' },
    { title: 'Culinary Masterclass', description: 'Learn to cook traditional regional recipes from an expert local chef.', costLow: 40, costHigh: 80, category: 'Activities' },
    { title: 'Premium Fine Dining', description: 'Enjoy a multi-course tasting menu paired with local wines and scenic views.', costLow: 60, costHigh: 150, category: 'Food' },
    { title: 'Artisanal Coffee & Pastry Crawl', description: 'Visit independent roasters and standard bakeries for breakfast.', costLow: 8, costHigh: 18, category: 'Food' },
  ],
  culture: [
    { title: 'Historical Landmarks Tour', description: 'Visit iconic structures, museums, and learning centers mapping local heritage.', costLow: 5, costHigh: 20, category: 'Sightseeing' },
    { title: 'Art Gallery & Workshop', description: 'Admire contemporary masterpieces and try creating your own keepsake.', costLow: 10, costHigh: 35, category: 'Activities' },
    { title: 'Traditional Music Performance', description: 'Attend an evening show featuring traditional folk music and storytelling.', costLow: 25, costHigh: 55, category: 'Activities' },
    { title: 'Architectural Photo Walk', description: 'Walk through historic neighborhoods detailing unique building designs.', costLow: 0, costHigh: 0, category: 'Sightseeing' },
  ],
  relaxation: [
    { title: 'Spa & Wellness Session', description: 'Relax with signature massages, thermal pools, and aromatherapy.', costLow: 50, costHigh: 120, category: 'Activities' },
    { title: 'Sunset Coastline Cruise', description: 'Board a catamaran to watch the sun dip below the horizon with refreshments.', costLow: 30, costHigh: 75, category: 'Activities' },
    { title: 'Botanical Gardens Stroll', description: 'Wander through greenhouses, ponds, and flower exhibits in tranquil quiet.', costLow: 0, costHigh: 12, category: 'Sightseeing' },
    { title: 'Beachside Picnic & Reading', description: 'Unwind on pristine sands with local cheeses, fresh fruit, and a book.', costLow: 12, costHigh: 30, category: 'Food' },
  ],
};

const COMMON_PACKING_ITEMS = [
  'Passport & Travel Documents',
  'Universal Power Adapter',
  'First Aid Kit & Medications',
  'Reusable Water Bottle',
  'Weather-appropriate Clothing',
  'Comfortable Walking Shoes',
  'Toiletries & Sunscreen',
  'Phone Charger & Power Bank',
];

// Helper to generate dynamic mock plans
const generateMockItinerary = (destination, startDate, endDate, budgetLimit, companion, interests) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const itinerary = [];
  const isBudgetHigh = budgetLimit > 150 * numDays;

  // Compile pool of activities based on interests (or all if none specified)
  let pool = [];
  const selectedInterests = interests && interests.length > 0 ? interests : ['culture', 'relaxation'];
  selectedInterests.forEach(interest => {
    const list = MOCK_ACTIVITIES[interest.toLowerCase()];
    if (list) pool = [...pool, ...list];
  });
  if (pool.length === 0) {
    pool = [...MOCK_ACTIVITIES.culture, ...MOCK_ACTIVITIES.relaxation];
  }

  // Generate days
  for (let i = 1; i <= numDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (i - 1));
    const dateStr = currentDate.toISOString().split('T')[0];

    // Pick activities from pool
    const dayActivities = [];
    
    // 1. Morning Activity
    const act1 = pool[i % pool.length];
    const cost1 = isBudgetHigh ? act1.costHigh : act1.costLow;
    dayActivities.push({
      time: '09:00 AM',
      title: `${act1.title}`,
      description: `${act1.description} Perfect for ${companion} traveler(s).`,
      cost: cost1,
      category: act1.category,
    });

    // 2. Afternoon Lunch
    const foodList = MOCK_ACTIVITIES.food;
    const food1 = foodList[(i + 1) % foodList.length];
    const costFood1 = isBudgetHigh ? food1.costHigh : food1.costLow;
    dayActivities.push({
      time: '01:00 PM',
      title: `Lunch at ${destination} Bistro`,
      description: `Sample regional delicacies including fresh ingredients and custom flavors.`,
      cost: Math.round(costFood1 * 0.4),
      category: 'Food',
    });

    // 3. Late Afternoon Exploration
    const act2 = pool[(i + 2) % pool.length];
    const cost2 = isBudgetHigh ? act2.costHigh : act2.costLow;
    dayActivities.push({
      time: '03:30 PM',
      title: `${act2.title} Adventure`,
      description: `Immerse yourself in local highlights and scenic areas.`,
      cost: cost2,
      category: act2.category,
    });

    // 4. Evening Dinner
    const food2 = foodList[(i + 3) % foodList.length];
    const costFood2 = isBudgetHigh ? food2.costHigh : food2.costLow;
    dayActivities.push({
      time: '07:30 PM',
      title: `Dinner at ${destination} Signature Restaurant`,
      description: `Fine local dining with ${companion === 'couple' ? 'romantic atmosphere' : 'vibrant energy'}.`,
      cost: costFood2,
      category: 'Food',
    });

    itinerary.push({
      dayNumber: i,
      date: dateStr,
      activities: dayActivities,
    });
  }

  // Packing list
  const packingList = COMMON_PACKING_ITEMS.map(item => ({ item, packed: false }));
  if (selectedInterests.includes('adventure')) {
    packingList.push({ item: 'Dry bag & hiking gear', packed: false });
  }
  if (selectedInterests.includes('relaxation')) {
    packingList.push({ item: 'Swimwear & sunglasses', packed: false });
  }

  // Budget ledger estimates
  const lodgingCostPerNight = isBudgetHigh ? 180 : 70;
  const transitCost = isBudgetHigh ? 100 : 35;
  const budgetLedger = [
    { title: 'Accommodation (Est.)', amount: lodgingCostPerNight * (numDays - 1 || 1), category: 'Lodging', date: startDate },
    { title: 'Local Travel Pass / Fuel', amount: transitCost, category: 'Transport', date: startDate },
    { title: 'Emergency Travel Buffer', amount: isBudgetHigh ? 150 : 50, category: 'Other', date: startDate },
  ];

  return { itinerary, packingList, budgetLedger };
};

// Main AI Orchestrator
export const generateItinerary = async (destination, startDate, endDate, budgetLimit, companion, interests) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No GEMINI_API_KEY found, returning premium template itinerary.');
    return generateMockItinerary(destination, startDate, endDate, budgetLimit, companion, interests);
  }

  try {
    const prompt = `
Generate a highly detailed travel itinerary for a trip to "${destination}".
Details:
- Start Date: ${startDate}
- End Date: ${endDate}
- Companion type: ${companion}
- Budget: $${budgetLimit}
- Interests: ${interests.join(', ')}

Please return the output STRICTLY as a valid JSON object matching this schema. Do not output markdown fences or other text, just the raw JSON:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity Title",
          "description": "Short vivid description",
          "cost": 15,
          "category": "Sightseeing" 
        }
      ]
    }
  ],
  "packingList": [
    { "item": "Passport", "packed": false }
  ],
  "budgetLedger": [
    { "title": "Hotel estimation", "amount": 250, "category": "Lodging", "date": "YYYY-MM-DD" }
  ]
}
For categories, choose from: Sightseeing, Food, Transport, Lodging, Activities, Other.
Provide 3-4 activities per day (morning, lunch, afternoon, dinner). Make it match the interests and companion.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResponse) {
      const parsed = JSON.parse(textResponse);
      if (parsed.itinerary && Array.isArray(parsed.itinerary)) {
        return parsed;
      }
    }
    throw new Error('Invalid JSON format returned from Gemini');
  } catch (err) {
    console.error('Gemini API call failed, falling back to mock generator:', err.message);
    return generateMockItinerary(destination, startDate, endDate, budgetLimit, companion, interests);
  }
};

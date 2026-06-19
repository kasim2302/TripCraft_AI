const validateExtractedData = (data) => {
  const defaults = {
    type: 'other',
    airline: '',
    departure: '',
    arrival: '',
    date: '',
    hotel: '',
    checkIn: '',
    checkOut: '',
    amount: 0,
  };

  const merged = { ...defaults, ...data };

  // Enforce types
  if (!['flight', 'hotel', 'other'].includes(merged.type)) {
    merged.type = 'other';
  }

  if (merged.amount !== undefined) {
    merged.amount = Number(merged.amount) || 0;
  }

  return merged;
};

// Regex Fallback Parser for Local / Offline operations
const fallbackParse = (text) => {
  const cleanText = text || '';
  const result = {
    type: 'other',
    airline: '',
    departure: '',
    arrival: '',
    date: '',
    hotel: '',
    checkIn: '',
    checkOut: '',
    amount: 0,
  };

  // Classify Type
  if (/flight|airline|boarding|ticket|passenger|airport|departure/i.test(cleanText)) {
    result.type = 'flight';
  } else if (/hotel|lodging|check-in|checkin|checkout|resort|room|reservation/i.test(cleanText)) {
    result.type = 'hotel';
  }

  // Parse Airline
  const airlineMatch = cleanText.match(/(delta|united|american|lufthansa|emirates|singapore|air france|southwest)\s*(airlines|airways)?/i);
  if (airlineMatch) {
    result.airline = airlineMatch[0].trim();
  }

  // Parse Hotel
  const hotelMatch = cleanText.match(/(marriott|hilton|hyatt|sheraton|westin|holiday inn|ibis|ritz-carlton)\s*(hotel|resort)?/i);
  if (hotelMatch) {
    result.hotel = hotelMatch[0].trim();
  }

  // Parse Amount
  const amountMatch = cleanText.match(/total\s*:\s*\$?\s*(\d+(\.\d{2})?)/i) || 
                      cleanText.match(/price\s*:\s*\$?\s*(\d+(\.\d{2})?)/i) ||
                      cleanText.match(/\$\s*(\d+(\.\d{2})?)/);
  if (amountMatch) {
    result.amount = Math.round(parseFloat(amountMatch[1])) || 0;
  } else {
    result.amount = 180; // Standard fallback estimate
  }

  // Parse Dates
  const dateMatch = cleanText.match(/\d{4}-\d{2}-\d{2}/) || cleanText.match(/\d{2}\/\d{2}\/\d{4}/);
  if (dateMatch) {
    result.date = dateMatch[0];
    result.checkIn = dateMatch[0];
  }

  return result;
};

export const parseTravelDocument = async (rawText) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No GEMINI_API_KEY found, running fallback regex extraction.');
    return fallbackParse(rawText);
  }

  try {
    const prompt = `
Extract structured travel booking information from the following document text:
"""
${rawText}
"""

Return ONLY a raw, valid JSON object. Do not wrap in markdown tags or comments. The JSON must exactly match this format:
{
  "type": "flight" | "hotel" | "other",
  "airline": "Airline Name",
  "departure": "Departure Airport/City",
  "arrival": "Arrival Airport/City",
  "date": "YYYY-MM-DD",
  "hotel": "Hotel/Lodging Name",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "amount": 150
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
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
      return validateExtractedData(parsed);
    }
    throw new Error('Received empty text response from Gemini');
  } catch (err) {
    console.error('Gemini extraction failed, using fallback parser:', err.message);
    return fallbackParse(rawText);
  }
};

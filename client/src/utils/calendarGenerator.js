export const exportToICS = (trip) => {
  if (!trip || !trip.itinerary) return;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripCraft AI//Travel Itinerary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  trip.itinerary.forEach((day) => {
    // Format date string, e.g., "2026-06-17" -> "20260617"
    const dateClean = day.date ? day.date.replace(/-/g, '') : new Date(trip.startDate).toISOString().split('T')[0].replace(/-/g, '');
    
    day.activities.forEach((act, idx) => {
      // Parse activity time (e.g. "09:00 AM", "01:30 PM", or "07:00 PM")
      let hours = 9;
      let minutes = 0;
      if (act.time) {
        const timeParts = act.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
          hours = parseInt(timeParts[1], 10);
          minutes = parseInt(timeParts[2], 10);
          const ampm = timeParts[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
        }
      }

      const pad = (num) => String(num).padStart(2, '0');
      const dtStart = `${dateClean}T${pad(hours)}${pad(minutes)}00`;
      
      // Assume activity lasts 1.5 hours
      let endHours = hours + 1;
      let endMinutes = minutes + 30;
      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }
      endHours = endHours % 24;
      const dtEnd = `${dateClean}T${pad(endHours)}${pad(endMinutes)}00`;

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:event-${trip._id || 'trip'}-${day.dayNumber || idx}-${idx}-${Date.now()}@tripcraft.ai`);
      icsContent.push(`DTSTAMP:${dateClean}T000000Z`);
      icsContent.push(`DTSTART:${dtStart}`);
      icsContent.push(`DTEND:${dtEnd}`);
      icsContent.push(`SUMMARY:${act.title} (${act.category || 'Sightseeing'})`);
      icsContent.push(`DESCRIPTION:${(act.description || '').replace(/\r?\n/g, ' ')} \\nCost: $${act.cost || 0}`);
      icsContent.push(`LOCATION:${trip.destination}`);
      icsContent.push('END:VEVENT');
    });
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${trip.destination.replace(/[^a-z0-9]/gi, '_')}_itinerary.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

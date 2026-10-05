// Location Search & Autocomplete Service for Devcon 8 Journey
import type { CityMetadata } from './geoEngine';

export const COMPREHENSIVE_CITIES: CityMetadata[] = [
  // India - Core Metros & State Capitals
  { name: 'Jabalpur', state: 'Madhya Pradesh', country: 'India', lat: 23.1815, lon: 79.9864, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'JLR', railStationCode: 'JBP' },
  { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 23.2599, lon: 77.4126, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'BHO', railStationCode: 'BPL' },
  { name: 'Delhi', state: 'Delhi NCR', country: 'India', isCapital: true, capitalType: 'National Capital', lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'DEL', railStationCode: 'NDLS' },
  { name: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'NAG', railStationCode: 'NGP' },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'BLR', railStationCode: 'SBC' },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 17.3850, lon: 78.4867, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'HYD', railStationCode: 'SC' },
  { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'PNQ', railStationCode: 'PUNE' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'AMD', railStationCode: 'ADI' },
  { name: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lon: 72.8311, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'STV', railStationCode: 'ST' },
  { name: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lon: 75.8577, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'IDR', railStationCode: 'INDB' },
  { name: 'Jaipur', state: 'Rajasthan', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 26.9124, lon: 75.7873, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'JAI', railStationCode: 'JP' },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 26.8467, lon: 80.9462, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'LKO', railStationCode: 'LKO' },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 22.5726, lon: 88.3639, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'CCU', railStationCode: 'HWH' },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 13.0827, lon: 80.2707, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'MAA', railStationCode: 'MAS' },
  { name: 'Goa', state: 'Goa', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 15.2993, lon: 74.1240, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'GOI', railStationCode: 'MAO' },
  { name: 'Nashik', state: 'Maharashtra', country: 'India', lat: 19.9975, lon: 73.7898, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'ISK', railStationCode: 'NK' },
  { name: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.3072, lon: 73.1812, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'BDQ', railStationCode: 'BRC' },
  { name: 'Chandigarh', state: 'Punjab / Haryana', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 30.7333, lon: 76.7794, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'IXC', railStationCode: 'CDG' },
  { name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lon: 76.2673, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'COK', railStationCode: 'ERS' },
  { name: 'Patna', state: 'Bihar', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 25.5941, lon: 85.1376, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'PAT', railStationCode: 'PNBE' },
  { name: 'Bhubaneswar', state: 'Odisha', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 20.2961, lon: 85.8245, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'BBI', railStationCode: 'BBS' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.6868, lon: 83.2185, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'VTZ', railStationCode: 'VSKP' },
  { name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lon: 91.7362, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'GAU', railStationCode: 'GHY' },
  { name: 'Dehradun', state: 'Uttarakhand', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 30.3165, lon: 78.0322, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'DED', railStationCode: 'DDN' },
  { name: 'Ranchi', state: 'Jharkhand', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 23.3441, lon: 85.3096, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'IXR', railStationCode: 'RNC' },
  { name: 'Raipur', state: 'Chhattisgarh', country: 'India', isCapital: true, capitalType: 'State Capital', lat: 21.2514, lon: 81.6296, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'RPR', railStationCode: 'R' },
  { name: 'Jalgaon', state: 'Maharashtra', country: 'India', lat: 21.0077, lon: 75.5626, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'JL' },
  { name: 'Akola', state: 'Maharashtra', country: 'India', lat: 20.7002, lon: 77.0082, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'AK' },
  { name: 'Wardha', state: 'Maharashtra', country: 'India', lat: 20.7453, lon: 78.6022, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'WR' },
  { name: 'Chandrapur', state: 'Maharashtra', country: 'India', lat: 19.9615, lon: 79.2961, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'CD' },
  { name: 'Aurangabad', state: 'Maharashtra', country: 'India', lat: 19.8762, lon: 75.3433, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'AWB' },
  { name: 'Nanded', state: 'Maharashtra', country: 'India', lat: 19.1383, lon: 77.3210, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'NED' },
  { name: 'Udaipur', state: 'Rajasthan', country: 'India', lat: 24.5854, lon: 73.7125, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'UDR', railStationCode: 'UDZ' },
  { name: 'Kota', state: 'Rajasthan', country: 'India', lat: 25.2138, lon: 75.8648, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, railStationCode: 'KOTA' },
  { name: 'Gwalior', state: 'Madhya Pradesh', country: 'India', lat: 26.2183, lon: 78.1828, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'GWL', railStationCode: 'GWL' },
  { name: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.6340, lon: 74.8723, timezone: 'Asia/Kolkata', utcOffsetHours: 5.5, airportCode: 'ATQ', railStationCode: 'ASR' },

  // Global Web3 & Ethereum Hubs
  { name: 'Berlin', state: 'Berlin', country: 'Germany', isCapital: true, capitalType: 'National Capital', lat: 52.5200, lon: 13.4050, timezone: 'Europe/Berlin', utcOffsetHours: 1.0, airportCode: 'BER' },
  { name: 'London', state: 'England', country: 'United Kingdom', isCapital: true, capitalType: 'National Capital', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London', utcOffsetHours: 0.0, airportCode: 'LHR' },
  { name: 'Paris', state: 'Île-de-France', country: 'France', isCapital: true, capitalType: 'National Capital', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris', utcOffsetHours: 1.0, airportCode: 'CDG' },
  { name: 'Zurich', state: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, timezone: 'Europe/Zurich', utcOffsetHours: 1.0, airportCode: 'ZRH' },
  { name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai', utcOffsetHours: 4.0, airportCode: 'DXB' },
  { name: 'Singapore', country: 'Singapore', isCapital: true, capitalType: 'National Capital', lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore', utcOffsetHours: 8.0, airportCode: 'SIN' },
  { name: 'Tokyo', state: 'Tokyo', country: 'Japan', isCapital: true, capitalType: 'National Capital', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo', utcOffsetHours: 9.0, airportCode: 'HND' },
  { name: 'Seoul', state: 'Seoul', country: 'South Korea', isCapital: true, capitalType: 'National Capital', lat: 37.5665, lon: 126.9780, timezone: 'Asia/Seoul', utcOffsetHours: 9.0, airportCode: 'ICN' },
  { name: 'Bangkok', state: 'Bangkok', country: 'Thailand', isCapital: true, capitalType: 'National Capital', lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok', utcOffsetHours: 7.0, airportCode: 'BKK' },
  { name: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York', utcOffsetHours: -5.0, airportCode: 'JFK' },
  { name: 'San Francisco', state: 'California', country: 'United States', lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles', utcOffsetHours: -8.0, airportCode: 'SFO' },
  { name: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lon: -79.3832, timezone: 'America/Toronto', utcOffsetHours: -5.0, airportCode: 'YYZ' },
  { name: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lon: 114.1694, timezone: 'Asia/Hong_Kong', utcOffsetHours: 8.0, airportCode: 'HKG' },
  { name: 'Sydney', state: 'New South Wales', country: 'Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney', utcOffsetHours: 11.0, airportCode: 'SYD' },
  { name: 'São Paulo', state: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333, timezone: 'America/Sao_Paulo', utcOffsetHours: -3.0, airportCode: 'GRU' },
  { name: 'Rio de Janeiro', state: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729, timezone: 'America/Sao_Paulo', utcOffsetHours: -3.0, airportCode: 'GIG' },
  { name: 'Buenos Aires', country: 'Argentina', isCapital: true, capitalType: 'National Capital', lat: -34.6037, lon: -58.3816, timezone: 'America/Argentina/Buenos_Aires', utcOffsetHours: -3.0, airportCode: 'EZE' },
  { name: 'Istanbul', state: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784, timezone: 'Europe/Istanbul', utcOffsetHours: 3.0, airportCode: 'IST' },
  { name: 'Amsterdam', state: 'North Holland', country: 'Netherlands', isCapital: true, capitalType: 'National Capital', lat: 52.3676, lon: 4.9041, timezone: 'Europe/Amsterdam', utcOffsetHours: 1.0, airportCode: 'AMS' },
  { name: 'Lisbon', country: 'Portugal', isCapital: true, capitalType: 'National Capital', lat: 38.7223, lon: -9.1393, timezone: 'Europe/Lisbon', utcOffsetHours: 0.0, airportCode: 'LIS' }
];

export async function searchLocations(query: string): Promise<CityMetadata[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // 1. Instant local search from curated database
  const localMatches = COMPREHENSIVE_CITIES.filter((c) => {
    return (
      c.name.toLowerCase().includes(clean) ||
      (c.state && c.state.toLowerCase().includes(clean)) ||
      c.country.toLowerCase().includes(clean)
    );
  }).slice(0, 7);

  if (localMatches.length > 0 && clean.length <= 3) {
    return localMatches;
  }

  // 2. Query OSM Photon / Nominatim API for world-wide geocoding if query is specific
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const remoteResults: CityMetadata[] = data.features
          .filter((f: any) => f.properties && f.geometry && f.geometry.coordinates)
          .map((f: any) => {
            const props = f.properties;
            const [lon, lat] = f.geometry.coordinates;
            const isCapital = props.osm_value === 'capital' || props.type === 'city';
            const country = props.country || 'International';
            const isIndia = country.toLowerCase() === 'india' || country.toLowerCase() === 'in';

            return {
              name: props.name || query,
              state: props.state || props.county || '',
              country: country,
              isCapital: isCapital,
              capitalType: isCapital ? (isIndia ? 'State Capital' : 'National Capital') : undefined,
              lat,
              lon,
              timezone: isIndia ? 'Asia/Kolkata' : 'UTC',
              utcOffsetHours: isIndia ? 5.5 : 0
            };
          });

        // Combine unique
        const combined = [...localMatches];
        for (const rem of remoteResults) {
          if (!combined.some((c) => c.name.toLowerCase() === rem.name.toLowerCase())) {
            combined.push(rem);
          }
        }
        return combined.slice(0, 8);
      }
    }
  } catch (e) {
    // Graceful fallback to local matches
  }

  return localMatches;
}

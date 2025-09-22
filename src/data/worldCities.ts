export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
  isCapital: boolean;
  region: string;
}

export const worldCities: City[] = [
  // NORTH AMERICA
  // United States
  { name: 'Washington DC', country: 'USA', lat: 38.9072, lng: -77.0369, population: 5400000, isCapital: true, region: 'North America' },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, population: 18800000, isCapital: false, region: 'North America' },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437, population: 13200000, isCapital: false, region: 'North America' },

  // Canada
  { name: 'Ottawa', country: 'Canada', lat: 45.4215, lng: -75.6972, population: 1400000, isCapital: true, region: 'North America' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, population: 6200000, isCapital: false, region: 'North America' },
  { name: 'Montreal', country: 'Canada', lat: 45.5017, lng: -73.5673, population: 4300000, isCapital: false, region: 'North America' },

  // Mexico
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, population: 21800000, isCapital: true, region: 'North America' },
  { name: 'Guadalajara', country: 'Mexico', lat: 20.6597, lng: -103.3496, population: 5200000, isCapital: false, region: 'North America' },

  // Costa Rica
  { name: 'San José', country: 'Costa Rica', lat: 9.9281, lng: -84.0907, population: 1400000, isCapital: true, region: 'North America' },

  // Guatemala
  { name: 'Guatemala City', country: 'Guatemala', lat: 14.6349, lng: -90.5069, population: 2900000, isCapital: true, region: 'North America' },

  // Cuba
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lng: -82.3666, population: 2100000, isCapital: true, region: 'North America' },

  // Jamaica
  { name: 'Kingston', country: 'Jamaica', lat: 17.9714, lng: -76.7931, population: 1200000, isCapital: true, region: 'North America' },

  // SOUTH AMERICA
  // Brazil
  { name: 'Brasília', country: 'Brazil', lat: -15.7939, lng: -47.8828, population: 3100000, isCapital: true, region: 'South America' },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, population: 22400000, isCapital: false, region: 'South America' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, population: 13500000, isCapital: false, region: 'South America' },

  // Argentina
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6118, lng: -58.3960, population: 15000000, isCapital: true, region: 'South America' },
  { name: 'Córdoba', country: 'Argentina', lat: -31.4201, lng: -64.1888, population: 1500000, isCapital: false, region: 'South America' },

  // Colombia
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721, population: 11000000, isCapital: true, region: 'South America' },
  { name: 'Medellín', country: 'Colombia', lat: 6.2442, lng: -75.5812, population: 2500000, isCapital: false, region: 'South America' },

  // Peru
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428, population: 10700000, isCapital: true, region: 'South America' },

  // Chile
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693, population: 7100000, isCapital: true, region: 'South America' },

  // Venezuela
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lng: -66.9036, population: 2900000, isCapital: true, region: 'South America' },

  // Ecuador
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lng: -78.4678, population: 2800000, isCapital: true, region: 'South America' },

  // Bolivia
  { name: 'La Paz', country: 'Bolivia', lat: -16.4897, lng: -68.1193, population: 2300000, isCapital: true, region: 'South America' },

  // Paraguay
  { name: 'Asunción', country: 'Paraguay', lat: -25.2637, lng: -57.5759, population: 2400000, isCapital: true, region: 'South America' },

  // Uruguay
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645, population: 1700000, isCapital: true, region: 'South America' },

  // EUROPE
  // United Kingdom
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, population: 9600000, isCapital: true, region: 'Europe' },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426, population: 2700000, isCapital: false, region: 'Europe' },

  // France
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, population: 11000000, isCapital: true, region: 'Europe' },
  { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698, population: 1800000, isCapital: false, region: 'Europe' },

  // Germany
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, population: 3700000, isCapital: true, region: 'Europe' },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820, population: 1500000, isCapital: false, region: 'Europe' },

  // Italy
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, population: 4300000, isCapital: true, region: 'Europe' },
  { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900, population: 3200000, isCapital: false, region: 'Europe' },

  // Spain
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, population: 6700000, isCapital: true, region: 'Europe' },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734, population: 5600000, isCapital: false, region: 'Europe' },

  // Russia
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6176, population: 12500000, isCapital: true, region: 'Europe' },
  { name: 'Saint Petersburg', country: 'Russia', lat: 59.9311, lng: 30.3609, population: 5400000, isCapital: false, region: 'Europe' },

  // Poland
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122, population: 1800000, isCapital: true, region: 'Europe' },
  { name: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.9450, population: 800000, isCapital: false, region: 'Europe' },

  // Netherlands
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, population: 2400000, isCapital: true, region: 'Europe' },

  // Belgium
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517, population: 1200000, isCapital: true, region: 'Europe' },

  // Switzerland
  { name: 'Bern', country: 'Switzerland', lat: 46.9481, lng: 7.4474, population: 400000, isCapital: true, region: 'Europe' },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417, population: 1400000, isCapital: false, region: 'Europe' },

  // Austria
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738, population: 1900000, isCapital: true, region: 'Europe' },

  // Sweden
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686, population: 2400000, isCapital: true, region: 'Europe' },

  // Norway
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522, population: 1700000, isCapital: true, region: 'Europe' },

  // Denmark
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683, population: 2000000, isCapital: true, region: 'Europe' },

  // Finland
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384, population: 1500000, isCapital: true, region: 'Europe' },

  // Iceland
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426, population: 140000, isCapital: true, region: 'Europe' },

  // Ireland
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603, population: 1400000, isCapital: true, region: 'Europe' },
  { name: 'Cork', country: 'Ireland', lat: 51.8985, lng: -8.4756, population: 220000, isCapital: false, region: 'Europe' },

  // Estonia
  { name: 'Tallinn', country: 'Estonia', lat: 59.4370, lng: 24.7536, population: 450000, isCapital: true, region: 'Europe' },

  // Latvia
  { name: 'Riga', country: 'Latvia', lat: 56.9496, lng: 24.1052, population: 640000, isCapital: true, region: 'Europe' },

  // Lithuania
  { name: 'Vilnius', country: 'Lithuania', lat: 54.6872, lng: 25.2797, population: 590000, isCapital: true, region: 'Europe' },

  // Luxembourg
  { name: 'Luxembourg City', country: 'Luxembourg', lat: 49.6116, lng: 6.1319, population: 130000, isCapital: true, region: 'Europe' },

  // Slovakia
  { name: 'Bratislava', country: 'Slovakia', lat: 48.1486, lng: 17.1077, population: 440000, isCapital: true, region: 'Europe' },

  // Slovenia
  { name: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058, population: 290000, isCapital: true, region: 'Europe' },

  // Greece
  { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275, population: 3800000, isCapital: true, region: 'Europe' },

  // Turkey
  { name: 'Ankara', country: 'Turkey', lat: 39.9334, lng: 32.8597, population: 5700000, isCapital: true, region: 'Europe' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, population: 15500000, isCapital: false, region: 'Europe' },

  // Portugal
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393, population: 2900000, isCapital: true, region: 'Europe' },

  // Czech Republic
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, population: 1300000, isCapital: true, region: 'Europe' },

  // Hungary
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402, population: 1800000, isCapital: true, region: 'Europe' },

  // Romania
  { name: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025, population: 1900000, isCapital: true, region: 'Europe' },

  // Ukraine
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234, population: 2900000, isCapital: true, region: 'Europe' },

  // ASIA
  // China
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, population: 21500000, isCapital: true, region: 'Asia' },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, population: 28500000, isCapital: false, region: 'Asia' },
  { name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, population: 13100000, isCapital: false, region: 'Asia' },

  // India
  { name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090, population: 32900000, isCapital: true, region: 'Asia' },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, population: 20400000, isCapital: false, region: 'Asia' },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, population: 14800000, isCapital: false, region: 'Asia' },

  // Japan
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, population: 38000000, isCapital: true, region: 'Asia' },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023, population: 18900000, isCapital: false, region: 'Asia' },

  // South Korea
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, population: 25600000, isCapital: true, region: 'Asia' },
  { name: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756, population: 3400000, isCapital: false, region: 'Asia' },

  // Indonesia
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, population: 10800000, isCapital: true, region: 'Asia' },
  { name: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, population: 2800000, isCapital: false, region: 'Asia' },

  // Thailand
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, population: 10500000, isCapital: true, region: 'Asia' },

  // Philippines
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, population: 13500000, isCapital: true, region: 'Asia' },
  { name: 'Cebu City', country: 'Philippines', lat: 10.3157, lng: 123.8854, population: 900000, isCapital: false, region: 'Asia' },

  // Vietnam
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542, population: 8100000, isCapital: true, region: 'Asia' },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, population: 8600000, isCapital: false, region: 'Asia' },

  // Malaysia
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, population: 8200000, isCapital: true, region: 'Asia' },

  // Singapore
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, population: 5900000, isCapital: true, region: 'Asia' },

  // Bangladesh
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, population: 22000000, isCapital: true, region: 'Asia' },

  // Pakistan
  { name: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479, population: 1200000, isCapital: true, region: 'Asia' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, population: 16000000, isCapital: false, region: 'Asia' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5804, lng: 74.3587, population: 12600000, isCapital: false, region: 'Asia' },

  // Iran
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.3890, population: 9100000, isCapital: true, region: 'Asia' },

  // Iraq
  { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661, population: 7000000, isCapital: true, region: 'Asia' },

  // Afghanistan
  { name: 'Kabul', country: 'Afghanistan', lat: 34.5553, lng: 69.2075, population: 4600000, isCapital: true, region: 'Asia' },

  // Saudi Arabia
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, population: 7700000, isCapital: true, region: 'Asia' },

  // UAE
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.2992, lng: 54.6972, population: 1500000, isCapital: true, region: 'Asia' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, population: 3400000, isCapital: false, region: 'Asia' },

  // Israel
  { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137, population: 900000, isCapital: true, region: 'Asia' },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818, population: 4400000, isCapital: false, region: 'Asia' },

  // Jordan
  { name: 'Amman', country: 'Jordan', lat: 31.9454, lng: 35.9284, population: 2100000, isCapital: true, region: 'Asia' },

  // Lebanon
  { name: 'Beirut', country: 'Lebanon', lat: 33.8938, lng: 35.5018, population: 2400000, isCapital: true, region: 'Asia' },

  // Syria
  { name: 'Damascus', country: 'Syria', lat: 33.5138, lng: 36.2765, population: 2300000, isCapital: true, region: 'Asia' },

  // Myanmar
  { name: 'Naypyidaw', country: 'Myanmar', lat: 19.7633, lng: 96.0785, population: 1200000, isCapital: true, region: 'Asia' },
  { name: 'Yangon', country: 'Myanmar', lat: 16.8661, lng: 96.1951, population: 5200000, isCapital: false, region: 'Asia' },

  // Cambodia
  { name: 'Phnom Penh', country: 'Cambodia', lat: 11.5564, lng: 104.9282, population: 2200000, isCapital: true, region: 'Asia' },

  // Laos
  { name: 'Vientiane', country: 'Laos', lat: 17.9757, lng: 102.6331, population: 700000, isCapital: true, region: 'Asia' },

  // Nepal
  { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lng: 85.3240, population: 1400000, isCapital: true, region: 'Asia' },

  // Sri Lanka
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612, population: 5600000, isCapital: true, region: 'Asia' },

  // AFRICA
  // Nigeria
  { name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986, population: 3500000, isCapital: true, region: 'Africa' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, population: 15400000, isCapital: false, region: 'Africa' },

  // Egypt
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, population: 20900000, isCapital: true, region: 'Africa' },
  { name: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187, population: 5200000, isCapital: false, region: 'Africa' },

  // South Africa
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, population: 4600000, isCapital: true, region: 'Africa' },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, population: 5600000, isCapital: false, region: 'Africa' },

  // Kenya
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, population: 4400000, isCapital: true, region: 'Africa' },

  // Ethiopia
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.1450, lng: 40.4897, population: 5200000, isCapital: true, region: 'Africa' },

  // Ghana
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870, population: 2400000, isCapital: true, region: 'Africa' },

  // Morocco
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416, population: 1900000, isCapital: true, region: 'Africa' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898, population: 3700000, isCapital: false, region: 'Africa' },

  // Algeria
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588, population: 2400000, isCapital: true, region: 'Africa' },

  // Tunisia
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815, population: 2400000, isCapital: true, region: 'Africa' },

  // Libya
  { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913, population: 1200000, isCapital: true, region: 'Africa' },

  // Sudan
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599, population: 5200000, isCapital: true, region: 'Africa' },

  // Tanzania
  { name: 'Dodoma', country: 'Tanzania', lat: -6.1630, lng: 35.7516, population: 400000, isCapital: true, region: 'Africa' },
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083, population: 6700000, isCapital: false, region: 'Africa' },

  // Uganda
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825, population: 1700000, isCapital: true, region: 'Africa' },

  // Zimbabwe
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8292, lng: 31.0522, population: 1500000, isCapital: true, region: 'Africa' },

  // Zambia
  { name: 'Lusaka', country: 'Zambia', lat: -15.3875, lng: 28.3228, population: 2500000, isCapital: true, region: 'Africa' },

  // Senegal
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677, population: 3100000, isCapital: true, region: 'Africa' },

  // Ivory Coast
  { name: 'Yamoussoukro', country: 'Ivory Coast', lat: 6.8276, lng: -5.2893, population: 300000, isCapital: true, region: 'Africa' },
  { name: 'Abidjan', country: 'Ivory Coast', lat: 5.3600, lng: -4.0083, population: 5600000, isCapital: false, region: 'Africa' },

  // Angola
  { name: 'Luanda', country: 'Angola', lat: -8.8390, lng: 13.2894, population: 8300000, isCapital: true, region: 'Africa' },

  // Democratic Republic of Congo
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.4419, lng: 15.2663, population: 14300000, isCapital: true, region: 'Africa' },

  // Cameroon
  { name: 'Yaoundé', country: 'Cameroon', lat: 3.8480, lng: 11.5021, population: 4100000, isCapital: true, region: 'Africa' },

  // Madagascar
  { name: 'Antananarivo', country: 'Madagascar', lat: -18.8792, lng: 47.5079, population: 3500000, isCapital: true, region: 'Africa' },

  // OCEANIA
  // Australia
  { name: 'Canberra', country: 'Australia', lat: -35.2809, lng: 149.1300, population: 460000, isCapital: true, region: 'Oceania' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, population: 5300000, isCapital: false, region: 'Oceania' },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631, population: 5100000, isCapital: false, region: 'Oceania' },

  // New Zealand
  { name: 'Wellington', country: 'New Zealand', lat: -41.2865, lng: 174.7762, population: 420000, isCapital: true, region: 'Oceania' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633, population: 1700000, isCapital: false, region: 'Oceania' },

  // Papua New Guinea
  { name: 'Port Moresby', country: 'Papua New Guinea', lat: -9.4438, lng: 147.1803, population: 400000, isCapital: true, region: 'Oceania' },

  // Fiji
  { name: 'Suva', country: 'Fiji', lat: -18.1248, lng: 178.4501, population: 200000, isCapital: true, region: 'Oceania' },
];

export const getCitiesByRegion = (region: string): City[] => {
  return worldCities.filter(city => city.region === region);
};

export const getCapitals = (): City[] => {
  return worldCities.filter(city => city.isCapital);
};

export const getMajorCities = (): City[] => {
  return worldCities.filter(city => !city.isCapital);
};

export const getCityCount = () => {
  const capitals = getCapitals().length;
  const majorCities = getMajorCities().length;
  const total = worldCities.length;
  
  return { capitals, majorCities, total };
};
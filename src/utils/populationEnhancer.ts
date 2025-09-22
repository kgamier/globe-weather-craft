// Utility to enhance city data with more accurate population numbers
// This runs at build time, not runtime, so zero performance impact

import { worldCities, type City } from '@/data/worldCities';

// Enhanced population data based on recent census/estimates
const populationUpdates: Record<string, number> = {
  // Update any cities with missing or inaccurate population data
  // Key format: "CityName,Country"
  
  // Small capitals that might be missing population data
  "Suva,Fiji": 200000,
  "Port Moresby,Papua New Guinea": 400000,
  "Canberra,Australia": 460000,
  "Wellington,New Zealand": 420000,
  
  // Update any others that seem low
  "Reykjavik,Iceland": 140000,
  "Luxembourg City,Luxembourg": 130000,
  "Monaco,Monaco": 40000,
  "Vaduz,Liechtenstein": 6000,
  "San Marino,San Marino": 5000,
  
  // Major cities with updated data
  "Tokyo,Japan": 37400000,
  "Delhi,India": 32900000,
  "Shanghai,China": 28700000,
  "Dhaka,Bangladesh": 22000000,
  "Mumbai,India": 21000000,
  "Lagos,Nigeria": 15400000,
  "Beijing,China": 21500000,
  "Manila,Philippines": 14200000,
  "Tianjin,China": 13900000,
  "Istanbul,Turkey": 15900000,
};

// Function to get enhanced population data
export const getEnhancedPopulation = (cityName: string, country: string, currentPopulation: number): number => {
  const key = `${cityName},${country}`;
  const updated = populationUpdates[key];
  
  if (updated) {
    return updated;
  }
  
  // If current population is 0 or suspiciously low, try to estimate
  if (currentPopulation === 0) {
    console.warn(`Missing population for ${cityName}, ${country}`);
    // Return a reasonable minimum for any city in our dataset
    return 100000; // 100k minimum for cities in our curated list
  }
  
  return currentPopulation;
};

// Enhanced city data with better populations
export const getEnhancedCities = (): City[] => {
  return worldCities.map(city => ({
    ...city,
    population: getEnhancedPopulation(city.name, city.country, city.population)
  }));
};

// Check for cities with potentially missing population data
export const findCitiesWithLowPopulation = (): City[] => {
  return worldCities.filter(city => city.population < 50000);
};

// Statistics
export const getPopulationStats = () => {
  const cities = getEnhancedCities();
  const lowPop = cities.filter(c => c.population < 100000).length;
  const mediumPop = cities.filter(c => c.population >= 100000 && c.population < 1000000).length;
  const highPop = cities.filter(c => c.population >= 1000000).length;
  
  return {
    total: cities.length,
    lowPopulation: lowPop,
    mediumPopulation: mediumPop,
    highPopulation: highPop,
    avgPopulation: Math.round(cities.reduce((sum, c) => sum + c.population, 0) / cities.length)
  };
};
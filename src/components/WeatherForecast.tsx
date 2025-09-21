import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Cloud, Sun, CloudRain, Thermometer, Wind, Droplets, Eye } from 'lucide-react';
import type { City } from '@/data/worldCities';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    relative_humidity_2m_max: number[];
  };
}

interface WeatherForecastProps {
  city: City;
  weatherData: WeatherData | null;
  isLoading: boolean;
  onClose: () => void;
}

const WeatherIcon = ({ weatherCode, size = 'w-8 h-8' }: { weatherCode: number; size?: string }) => {
  const getIcon = (code: number) => {
    if (code === 0) return <Sun className={size} />; // Clear sky
    if (code >= 1 && code <= 3) return <Cloud className={size} />; // Partly cloudy
    if (code >= 45 && code <= 48) return <Cloud className={size} />; // Fog
    if (code >= 51 && code <= 67) return <CloudRain className={size} />; // Rain
    if (code >= 71 && code <= 77) return <CloudRain className={size} />; // Snow
    if (code >= 80 && code <= 82) return <CloudRain className={size} />; // Rain showers
    if (code >= 95 && code <= 99) return <CloudRain className={size} />; // Thunderstorm
    return <Cloud className={size} />;
  };

  const getDescription = (code: number) => {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
  };
  
  return (
    <div className="text-primary" title={getDescription(weatherCode)}>
      {getIcon(weatherCode)}
    </div>
  );
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({ city, weatherData, isLoading, onClose }) => {
  if (!weatherData && !isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-glass bg-card/90 border-glass-border shadow-glass">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold bg-gradient-earth bg-clip-text text-transparent">
                {city.name}, {city.country}
              </h2>
              <p className="text-sm text-muted-foreground">
                {city.isCapital ? '★ Capital City' : 'Major City'} • Population: {(city.population / 1000000).toFixed(1)}M
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading atmospheric data...</p>
              </div>
            </div>
          ) : weatherData ? (
            <>
              {/* Current Weather */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Current Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-secondary/20">
                    <div className="flex items-center space-x-4">
                      <WeatherIcon weatherCode={weatherData.current.weather_code} size="w-12 h-12" />
                      <div>
                        <p className="text-2xl font-bold">{Math.round(weatherData.current.temperature_2m)}°C</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const code = weatherData.current.weather_code;
                            const descriptions: { [key: number]: string } = {
                              0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                              45: 'Fog', 51: 'Light drizzle', 61: 'Slight rain', 63: 'Moderate rain',
                              71: 'Slight snow', 80: 'Rain showers', 95: 'Thunderstorm'
                            };
                            return descriptions[code] || 'Unknown';
                          })()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                          <p className="font-semibold">{Math.round(weatherData.current.relative_humidity_2m)}%</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pressure</p>
                          <p className="font-semibold">{Math.round(weatherData.current.surface_pressure)} hPa</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Wind</p>
                          <p className="font-semibold">{Math.round(weatherData.current.wind_speed_10m)} km/h</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Wind Dir</p>
                          <p className="font-semibold">{Math.round(weatherData.current.wind_direction_10m)}°</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">7-Day Forecast</h3>
                <div className="space-y-2">
                  {weatherData.daily.time.slice(0, 7).map((dateStr, index) => {
                    const date = new Date(dateStr);
                    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
                    const weatherCode = weatherData.daily.weather_code[index];
                    const maxTemp = weatherData.daily.temperature_2m_max[index];
                    const minTemp = weatherData.daily.temperature_2m_min[index];
                    const precipitation = weatherData.daily.precipitation_probability_max[index];
                    const windSpeed = weatherData.daily.wind_speed_10m_max[index];
                    const humidity = weatherData.daily.relative_humidity_2m_max[index];
                    
                    const getWeatherDescription = (code: number) => {
                      const descriptions: { [key: number]: string } = {
                        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                        45: 'Fog', 51: 'Light drizzle', 61: 'Slight rain', 63: 'Moderate rain',
                        71: 'Slight snow', 80: 'Rain showers', 95: 'Thunderstorm'
                      };
                      return descriptions[code] || 'Unknown';
                    };
                    
                    return (
                      <Card key={dateStr} className="p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="min-w-[60px]">
                              <p className="font-medium">{dayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <WeatherIcon weatherCode={weatherCode} />
                            <div className="flex-1">
                              <p className="text-sm">{getWeatherDescription(weatherCode)}</p>
                              <p className="text-xs text-muted-foreground">
                                Rain: {Math.round(precipitation || 0)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-right">
                            <div>
                              <p className="font-semibold">{Math.round(maxTemp)}°</p>
                              <p className="text-sm text-muted-foreground">{Math.round(minTemp)}°</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>{Math.round(windSpeed)} km/h</p>
                              <p>{Math.round(humidity)}%</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load weather data. Please try again.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WeatherForecast;
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Cloud, Sun, CloudRain, Thermometer, Wind, Droplets, Eye } from 'lucide-react';
import type { City } from '@/data/worldCities';

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
    humidity: number;
    wind_speed: number;
    pop: number; // Probability of precipitation
  }>;
}

interface WeatherForecastProps {
  city: City;
  weatherData: WeatherData | null;
  isLoading: boolean;
  onClose: () => void;
}

const WeatherIcon = ({ iconCode, size = 'w-8 h-8' }: { iconCode: string; size?: string }) => {
  const getIcon = (code: string) => {
    if (code.includes('01')) return <Sun className={size} />;
    if (code.includes('02') || code.includes('03') || code.includes('04')) return <Cloud className={size} />;
    if (code.includes('09') || code.includes('10') || code.includes('11')) return <CloudRain className={size} />;
    return <Cloud className={size} />;
  };
  
  return <div className="text-primary">{getIcon(iconCode)}</div>;
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
                      <WeatherIcon iconCode={weatherData.current.weather[0].icon} size="w-12 h-12" />
                      <div>
                        <p className="text-2xl font-bold">{Math.round(weatherData.current.temp)}°C</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {weatherData.current.weather[0].description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Feels like {Math.round(weatherData.current.feels_like)}°C
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
                          <p className="font-semibold">{weatherData.current.humidity}%</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pressure</p>
                          <p className="font-semibold">{weatherData.current.pressure} hPa</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Wind</p>
                          <p className="font-semibold">{Math.round(weatherData.current.wind_speed * 3.6)} km/h</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 bg-secondary/10">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Visibility</p>
                          <p className="font-semibold">{Math.round(weatherData.current.visibility / 1000)} km</p>
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
                  {weatherData.daily.slice(0, 7).map((day, index) => {
                    const date = new Date(day.dt * 1000);
                    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
                    
                    return (
                      <Card key={day.dt} className="p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="min-w-[60px]">
                              <p className="font-medium">{dayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <WeatherIcon iconCode={day.weather[0].icon} />
                            <div className="flex-1">
                              <p className="text-sm capitalize">{day.weather[0].description}</p>
                              <p className="text-xs text-muted-foreground">
                                Rain: {Math.round(day.pop * 100)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-right">
                            <div>
                              <p className="font-semibold">{Math.round(day.temp.max)}°</p>
                              <p className="text-sm text-muted-foreground">{Math.round(day.temp.min)}°</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>{Math.round(day.wind_speed * 3.6)} km/h</p>
                              <p>{day.humidity}%</p>
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
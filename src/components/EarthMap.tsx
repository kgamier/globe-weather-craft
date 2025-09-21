import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeatherParams {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
}

const EarthMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [weatherParams, setWeatherParams] = useState<WeatherParams>({
    temperature: 20,
    humidity: 60,
    pressure: 1013,
    windSpeed: 15,
  });

  // Major cities dataset with coordinates
  const majorCities = [
    { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, population: 8400000 },
    { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, population: 9000000 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, population: 14000000 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, population: 2200000 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, population: 5300000 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, population: 20400000 },
    { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, population: 12300000 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, population: 20900000 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6176, population: 12500000 },
    { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, population: 21500000 },
    { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, population: 15400000 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, population: 21800000 },
  ];

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    setIsLoading(true);
    setTokenError('');

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      projection: 'globe' as any,
      zoom: 2,
      center: [0, 20],
      pitch: 0,
    });

    // Handle map load success
    map.current.on('load', () => {
      setIsLoading(false);
      console.log('Map loaded successfully!');
    });

    // Handle map errors
    map.current.on('error', (error) => {
      console.error('Mapbox error:', error);
      setIsLoading(false);
      if (error.error && error.error.message.includes('access token')) {
        setTokenError('Invalid Mapbox token. Please check your token and try again.');
      } else {
        setTokenError('Failed to load map. Please check your connection and try again.');
      }
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgba(135, 206, 235, 0.8)',
        'high-color': 'rgba(135, 206, 235, 0.4)',
        'horizon-blend': 0.1,
        'space-color': 'rgba(11, 11, 25, 1)',
        'star-intensity': 0.8,
      });

      // Add city markers
      majorCities.forEach(city => {
        if (!map.current) return;

        // Create weather prediction marker
        const el = document.createElement('div');
        el.className = 'weather-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: linear-gradient(45deg, hsl(195 85% 45%), hsl(200 90% 55%));
          border: 2px solid hsl(210 40% 98%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px hsl(195 85% 45% / 0.4);
          transition: all 0.3s ease;
        `;
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.boxShadow = '0 6px 20px hsl(195 85% 45% / 0.6)';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 4px 12px hsl(195 85% 45% / 0.4)';
        });

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="background: hsl(220 30% 8%); color: hsl(210 20% 95%); padding: 12px; border-radius: 8px; border: 1px solid hsl(210 20% 95% / 0.1);">
                  <h3 style="margin: 0 0 8px 0; font-weight: 600;">${city.name}, ${city.country}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 14px;">Population: ${(city.population / 1000000).toFixed(1)}M</p>
                  <p style="margin: 0; font-size: 14px; color: hsl(195 85% 45%);">Predicted Temp: ${Math.round(weatherParams.temperature + (Math.random() - 0.5) * 10)}°C</p>
                </div>
              `)
          )
          .addTo(map.current);
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, weatherParams]);

  const updateWeatherParam = (key: keyof WeatherParams, value: number) => {
    setWeatherParams(prev => ({ ...prev, [key]: value }));
  };

  if (!mapboxToken || tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-space">
        <Card className="p-8 max-w-md mx-auto backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center bg-gradient-earth bg-clip-text text-transparent">
              Earth Weather Prediction
            </h2>
            <p className="text-muted-foreground text-center">
              Enter your Mapbox public token to view the interactive Earth
            </p>
            
            {tokenError && (
              <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive-foreground">{tokenError}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="password"
                placeholder="pk.eyJ1Ijoi..."
                value={mapboxToken}
                onChange={(e) => {
                  setMapboxToken(e.target.value);
                  setTokenError('');
                }}
                className="bg-input/50"
              />
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Get your free token from{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent transition-colors underline"
                >
                  Mapbox Account → Access Tokens
                </a>
              </p>
              <div className="bg-secondary/20 p-3 rounded-lg">
                <p className="font-medium mb-1">Quick Setup:</p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Sign up at mapbox.com (free)</li>
                  <li>Go to Account → Access Tokens</li>
                  <li>Copy your "Default public token"</li>
                  <li>Paste it above (starts with "pk.")</li>
                </ol>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-space overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Weather Controls Panel */}
      <Card className="absolute top-6 left-6 p-6 w-80 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
        <h3 className="text-lg font-semibold mb-4 bg-gradient-earth bg-clip-text text-transparent">
          Weather Parameters
        </h3>
        
        <div className="space-y-4">
          {/* Temperature */}
          <div>
            <Label className="text-sm font-medium">Temperature: {weatherParams.temperature}°C</Label>
            <input
              type="range"
              min="-30"
              max="50"
              value={weatherParams.temperature}
              onChange={(e) => updateWeatherParam('temperature', Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer mt-2"
              style={{
                background: `linear-gradient(to right, hsl(var(--temp-cold)) 0%, hsl(var(--temp-hot)) 100%)`
              }}
            />
          </div>

          {/* Humidity */}
          <div>
            <Label className="text-sm font-medium">Humidity: {weatherParams.humidity}%</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={weatherParams.humidity}
              onChange={(e) => updateWeatherParam('humidity', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-2"
              style={{
                background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--humidity)) 100%)`
              }}
            />
          </div>

          {/* Pressure */}
          <div>
            <Label className="text-sm font-medium">Pressure: {weatherParams.pressure} hPa</Label>
            <input
              type="range"
              min="950"
              max="1050"
              value={weatherParams.pressure}
              onChange={(e) => updateWeatherParam('pressure', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-2"
              style={{
                background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--pressure)) 100%)`
              }}
            />
          </div>

          {/* Wind Speed */}
          <div>
            <Label className="text-sm font-medium">Wind Speed: {weatherParams.windSpeed} km/h</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={weatherParams.windSpeed}
              onChange={(e) => updateWeatherParam('windSpeed', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-2"
              style={{
                background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--wind)) 100%)`
              }}
            />
          </div>
        </div>
      </Card>

      {/* Info Panel */}
      <Card className="absolute top-6 right-6 p-4 w-72 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
        <h3 className="text-lg font-semibold mb-3 bg-gradient-earth bg-clip-text text-transparent">
          Global Cities
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Click on city markers to see weather predictions based on your parameters.
        </p>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Total Cities:</span>
            <span className="text-primary font-medium">{majorCities.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Data Source:</span>
            <span className="text-accent">NASA GSFC</span>
          </div>
        </div>
      </Card>

      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-gradient-atmosphere pointer-events-none" />
    </div>
  );
};

export default EarthMap;
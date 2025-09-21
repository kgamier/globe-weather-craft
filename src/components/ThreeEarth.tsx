import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { worldCities, getCityCount, type City } from '@/data/worldCities';
import WeatherForecast from './WeatherForecast';
import EventPlanner from './EventPlanner';

interface WeatherParams {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
}

const ThreeEarth = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const earthRef = useRef<THREE.Mesh>();
  const cloudsRef = useRef<THREE.Mesh>();
  const frameRef = useRef<number>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const markersRef = useRef<THREE.Group>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const lastUpdateTime = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNightLights, setShowNightLights] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCapitalsOnly, setShowCapitalsOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<boolean>(false);
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);
  const [showEventPlanner, setShowEventPlanner] = useState(false);
  const [forecastCity, setForecastCity] = useState<City | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherParams, setWeatherParams] = useState<WeatherParams>({
    temperature: 20,
    humidity: 60,
    pressure: 1013,
    windSpeed: 15,
  });

  // Get filtered cities based on user preferences
  const getFilteredCities = (): City[] => {
    let cities = worldCities;
    
    if (showCapitalsOnly) {
      cities = cities.filter(city => city.isCapital);
    }
    
    if (selectedRegion !== 'All') {
      cities = cities.filter(city => city.region === selectedRegion);
    }
    
    return cities;
  };

  // Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const results = worldCities.filter(city =>
      city.name.toLowerCase().includes(term.toLowerCase()) ||
      city.country.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 8); // Limit to 8 results for better UX
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setSearchTerm(city.name);
    setShowSearchResults(false);
    setAutoRotate(false);
    
    toast.success(`Focused on ${city.name}, ${city.country}`);
  };

  // Weather API functions using Open-Meteo (free, no API key required)
  const fetchWeatherData = async (city: City) => {
    setLoadingWeather(true);
    setWeatherData(null);
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=7`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      setWeatherData(data);
      toast.success(`Weather data loaded for ${city.name}`);
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleCityClick = (city: City) => {
    setForecastCity(city);
    setShowWeatherForecast(true);
    fetchWeatherData(city);
  };

  const handleEventPlannerOpen = (city: City) => {
    setForecastCity(city);
    setShowEventPlanner(true);
  };

  // Performance optimizations
  const shouldUpdateMarker = (time: number): boolean => {
    return time - lastUpdateTime.current > (performanceMode ? 100 : 50); // Reduce update frequency in performance mode
  };

  const getVisibilityRadius = (cameraDistance: number): number => {
    // Show fewer markers when zoomed out for better performance
    if (cameraDistance > 20) return 0.3;
    if (cameraDistance > 15) return 0.5;
    return 1.0;
  };

  // Optimize marker creation with instanced geometry
  const createOptimizedMarker = (city: City, scene: THREE.Scene, earth: THREE.Mesh): THREE.Mesh => {
    const markerGeometry = new THREE.SphereGeometry(0.025, 6, 6); // Smaller, more refined dots
    
    let markerColor = city.isCapital ? 0xffd700 : 0x00ffff;
    
    if (selectedCity && selectedCity.name === city.name && selectedCity.country === city.country) {
      markerColor = 0xff4444;
    }
    
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: markerColor,
      transparent: true,
      opacity: 0.85
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    const position = latLngToVector3(city.lat, city.lng);
    marker.position.copy(position);
    
    // More conservative population scaling for refined appearance
    const populationScale = Math.max(0.6, Math.min(1.4, Math.log10(city.population) / 5));
    marker.scale.setScalar(populationScale);
    
    marker.userData = { 
      city, 
      originalScale: populationScale,
      pulsePhase: Math.random() * Math.PI * 2,
      lastUpdate: 0
    };
    
    return marker;
  };

  const regions = ['All', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const cityStats = getCityCount();

  // Convert lat/lng to 3D coordinates on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number = 5.1) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    raycasterRef.current = raycaster;
    mouseRef.current = mouse;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup with optimized settings
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer setup with performance optimizations
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !performanceMode, // Disable antialiasing in performance mode
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode ? 1.5 : 2));
    renderer.shadowMap.enabled = !performanceMode; // Disable shadows in performance mode
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
    
    // Texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Load Earth textures
    Promise.all([
      textureLoader.loadAsync('/textures/earth-day.jpg'),
      textureLoader.loadAsync('/textures/earth-night.jpg')
    ]).then(([dayTexture, nightTexture]) => {
      // Earth material with day/night cycle
      const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: dayTexture },
          nightTexture: { value: nightTexture },
          sunDirection: { value: sunLight.position.clone().normalize() },
          nightIntensity: { value: showNightLights ? 1.0 : 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 sunDirection;
          uniform float nightIntensity;
          
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vec3 dayColor = texture2D(dayTexture, vUv).rgb;
            vec3 nightColor = texture2D(nightTexture, vUv).rgb;
            
            float cosineAngle = dot(vNormal, sunDirection);
            float mixValue = smoothstep(-0.1, 0.1, cosineAngle);
            
            vec3 color = mix(nightColor * nightIntensity, dayColor, mixValue);
            
            // Add atmosphere glow
            float atmosphere = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            color += vec3(0.3, 0.6, 1.0) * atmosphere * 0.3;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.receiveShadow = true;
      if (sceneRef.current) {
        sceneRef.current.add(earth);
      }
      earthRef.current = earth;

      // Add city markers with performance optimization
      const filteredCities = getFilteredCities();
      const markersGroup = new THREE.Group();
      markersRef.current = markersGroup;
      
      // Limit markers based on performance mode
      const maxMarkers = performanceMode ? 100 : filteredCities.length;
      const citiesToRender = filteredCities.slice(0, maxMarkers);
      
      citiesToRender.forEach(city => {
        const marker = createOptimizedMarker(city, sceneRef.current!, earth);
        markersGroup.add(marker);
      });
      
      earth.add(markersGroup);

      setIsLoading(false);
      toast.success("Earth loaded successfully!");
    }).catch(error => {
      console.error('Error loading textures:', error);
      // Fallback to basic material
      const earthMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2233ff,
        wireframe: false 
      });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      if (sceneRef.current) {
        sceneRef.current.add(earth);
      }
      earthRef.current = earth;
      setIsLoading(false);
      toast.success("Earth loaded (basic mode)");
    });

    // Create clouds with performance optimization
    const cloudsGeometry = new THREE.SphereGeometry(5.1, performanceMode ? 32 : 64, performanceMode ? 32 : 64);
    const cloudsMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: performanceMode ? 0.1 : 0.2, // Reduce opacity in performance mode
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    if (sceneRef.current) {
      sceneRef.current.add(clouds);
    }
    cloudsRef.current = clouds;

    // Handle city focusing
    if (selectedCity && earthRef.current) {
      const cityPosition = latLngToVector3(selectedCity.lat, selectedCity.lng, 8);
      
      // Animate camera to look at the city
      const currentPosition = camera.position.clone();
      const targetPosition = cityPosition.clone().normalize().multiplyScalar(12);
      
      // Smooth animation to the city
      camera.position.lerp(targetPosition, 0.02);
      camera.lookAt(0, 0, 0);
    }

    // Hold left-click and drag navigation with city click detection
    let isMouseDown = false;
    let isRotating = false;
    let lastMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only left click
      isMouseDown = true;
      isRotating = false;
      lastMousePosition = { x: event.clientX, y: event.clientY };
      
      // Change cursor to indicate dragging mode
      renderer.domElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      const deltaMove = {
        x: event.clientX - lastMousePosition.x,
        y: event.clientY - lastMousePosition.y
      };

      // If mouse moved enough, consider it rotation
      if (Math.abs(deltaMove.x) > 2 || Math.abs(deltaMove.y) > 2) {
        isRotating = true;
        setAutoRotate(false);
        
        // Apply rotation based on mouse movement
        if (earthRef.current) {
          earthRef.current.rotation.y += deltaMove.x * 0.005;
          earthRef.current.rotation.x += deltaMove.y * 0.005;
          
          // Clamp vertical rotation to prevent flipping
          earthRef.current.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, earthRef.current.rotation.x));
        }
      }

      lastMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only left click
      
      // If it was just a click (no rotation), check for city clicks
      if (!isRotating && markersRef.current && cameraRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(markersRef.current.children, true);
        
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          if (clickedObject.userData && clickedObject.userData.city) {
            handleCityClick(clickedObject.userData.city);
            toast.success(`Getting forecast for ${clickedObject.userData.city.name}`);
          }
        }
      }
      
      isMouseDown = false;
      
      // Reset cursor
      renderer.domElement.style.cursor = 'grab';
      
      // If we were rotating, delay auto-rotate resumption
      if (isRotating) {
        setTimeout(() => {
          if (!isMouseDown) { // Only resume if not currently dragging
            setAutoRotate(true);
          }
        }, 3000);
      }
      
      isRotating = false;
    };

    // Set initial cursor style
    renderer.domElement.style.cursor = 'grab';
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = performanceMode ? 0.015 : 0.01;
      camera.position.z += event.deltaY * zoomSpeed;
      camera.position.z = Math.max(6, Math.min(30, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp); // Handle mouse leaving canvas
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Optimized animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      const shouldUpdate = shouldUpdateMarker(Date.now());

      // Only apply auto-rotation if not manually controlling
      if (earthRef.current && autoRotate && !isMouseDown) {
        earthRef.current.rotation.y += performanceMode ? 0.001 : 0.002;
      }

      // Optimize marker animations - only update when needed and ensure visibility
      if (shouldUpdate && markersRef.current) {
        markersRef.current.children.forEach((marker) => {
          const mesh = marker as THREE.Mesh;
          if (mesh.userData.city) {
            // Ensure markers are always visible
            mesh.visible = true;
            
            if (!performanceMode) {
              // Reduced frequency pulsing animation
              mesh.userData.pulsePhase += 0.01;
              const pulse = 1 + Math.sin(mesh.userData.pulsePhase) * 0.2;
              mesh.scale.setScalar(mesh.userData.originalScale * pulse);
            } else {
              // In performance mode, keep static scale
              mesh.scale.setScalar(mesh.userData.originalScale);
            }
          }
        });
        
        lastUpdateTime.current = Date.now();
      }

      if (cloudsRef.current && !performanceMode && !isMouseDown) {
        cloudsRef.current.rotation.y += 0.0005;
      }

      renderer.render(sceneRef.current!, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const updateWeatherParam = (key: keyof WeatherParams, value: number) => {
    setWeatherParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative w-full h-screen bg-gradient-space overflow-hidden">
      {/* Loading screen */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-space z-50">
          <Card className="p-8 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold bg-gradient-earth bg-clip-text text-transparent">
                Loading Earth...
              </h2>
              <p className="text-muted-foreground">
                Downloading NASA satellite imagery
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* 3D Earth Container */}
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Search Panel */}
      <Card className="absolute top-6 left-1/2 transform -translate-x-1/2 p-4 w-96 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
        <h3 className="text-lg font-semibold mb-3 bg-gradient-earth bg-clip-text text-transparent">
          Search Cities
        </h3>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search cities or countries..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 bg-input/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card/90 backdrop-blur-glass border border-border rounded-lg shadow-glass max-h-64 overflow-y-auto z-50">
              {searchResults.map((city, index) => (
                <button
                  key={`${city.name}-${city.country}-${index}`}
                  onClick={() => selectCity(city)}
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-b-0 focus:outline-none focus:bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {city.name}
                        {city.isCapital && <span className="ml-2 text-yellow-400 text-xs">★ CAPITAL</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {city.country} • {city.region}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(city.population / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card/90 backdrop-blur-glass border border-border rounded-lg shadow-glass p-4 z-50">
              <p className="text-muted-foreground text-center">No cities found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
        
        {/* Clear Selection */}
        {selectedCity && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Performance Mode</Label>
              <Button
                variant={performanceMode ? "default" : "outline"}
                size="sm"
                onClick={() => setPerformanceMode(!performanceMode)}
              >
                {performanceMode ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Focused on:</div>
                <div className="text-primary font-semibold">
                  {selectedCity.name}, {selectedCity.country}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCity(null);
                  setSearchTerm('');
                  setAutoRotate(true);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Weather Info Panel */}
      <Card className="absolute top-6 right-6 p-4 w-80 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass border-green-500/50 z-20">
        <h3 className="text-lg font-semibold mb-3 text-green-400">
          NASA Space Apps Challenge
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            🏆 "Will It Rain On My Parade?" Challenge
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Historical weather probability analysis
            </p>
            <p>• Click cities for current forecasts</p>
            <p>• Use Event Planner for probability analysis</p>
            <p>• NASA Earth observation data</p>
            <p>• Perfect for outdoor event planning</p>
          </div>
          <Button
            onClick={() => {
              if (selectedCity) {
                handleEventPlannerOpen(selectedCity);
              } else {
                toast.error('Please select a city first');
              }
            }}
            className="w-full text-sm"
            size="sm"
          >
            🎯 Open Event Planner
          </Button>
        </div>
      </Card>

      {/* Controls Panel */}
      {(
        <Card className="absolute top-6 left-6 p-6 w-80 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-earth bg-clip-text text-transparent">
            Weather Parameters
          </h3>
          
          <div className="space-y-6">
            {/* Temperature */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Temperature: {weatherParams.temperature}°C
              </Label>
              <Slider
                value={[weatherParams.temperature]}
                onValueChange={(value) => updateWeatherParam('temperature', value[0])}
                max={50}
                min={-30}
                step={1}
                className="w-full"
              />
            </div>

            {/* Humidity */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Humidity: {weatherParams.humidity}%
              </Label>
              <Slider
                value={[weatherParams.humidity]}
                onValueChange={(value) => updateWeatherParam('humidity', value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Pressure */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Pressure: {weatherParams.pressure} hPa
              </Label>
              <Slider
                value={[weatherParams.pressure]}
                onValueChange={(value) => updateWeatherParam('pressure', value[0])}
                max={1050}
                min={950}
                step={1}
                className="w-full"
              />
            </div>

            {/* Wind Speed */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Wind Speed: {weatherParams.windSpeed} km/h
              </Label>
              <Slider
                value={[weatherParams.windSpeed]}
                onValueChange={(value) => updateWeatherParam('windSpeed', value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Controls Panel */}
      <Card className="absolute bottom-6 right-6 p-4 w-72 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass z-10">
          <h3 className="text-lg font-semibold mb-3 bg-gradient-earth bg-clip-text text-transparent">
            Earth Controls
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto Rotate</Label>
              <Button
                variant={autoRotate ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
              >
                {autoRotate ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Night Lights</Label>
              <Button
                variant={showNightLights ? "default" : "outline"}
                size="sm"
                onClick={() => setShowNightLights(!showNightLights)}
              >
                {showNightLights ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Cities:</span>
                  <span className="text-primary font-medium">{worldCities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="text-accent">NASA Blue Marble</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

      {/* Instructions */}
      <Card className="absolute bottom-6 left-1/2 transform -translate-x-1/2 p-4 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass z-10">
        <div className="text-sm space-y-2">
          <p className="font-medium text-foreground">Controls:</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• <span className="font-medium">Hold left-click + drag</span> to rotate Earth</li>
            <li>• <span className="font-medium">Click city dots</span> for current weather</li>
            <li>• <span className="font-medium">Select city + Event Planner</span> for probability analysis</li>
            <li>• Search cities above to focus on them</li>
            <li>• Scroll to zoom in/out</li>
            <li>• <span className="text-yellow-400">Gold dots</span> = capitals</li>
            <li>• <span className="text-cyan-400">Cyan dots</span> = major cities</li>
            <li>• <span className="text-red-400">Red dot</span> = selected city</li>
            <li>• Larger dots = bigger population</li>
            <li>• <span className="text-purple-400">📡 NASA Earth data</span> for event planning</li>
          </ul>
        </div>
      </Card>

      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-gradient-atmosphere pointer-events-none" />

      {/* Weather Forecast Modal */}
      {showWeatherForecast && forecastCity && (
        <WeatherForecast
          city={forecastCity}
          weatherData={weatherData}
          isLoading={loadingWeather}
          onClose={() => {
            setShowWeatherForecast(false);
            setForecastCity(null);
            setWeatherData(null);
          }}
        />
      )}

      {/* Event Planner Modal */}
      {showEventPlanner && (
        <EventPlanner
          selectedCity={forecastCity}
          onClose={() => {
            setShowEventPlanner(false);
            setForecastCity(null);
          }}
        />
      )}
    </div>
  );
};

export default ThreeEarth;
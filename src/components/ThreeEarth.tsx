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
import HistoricalWeatherGrid from './HistoricalWeatherGrid';
import HistoricalWeatherControls from './HistoricalWeatherControls';
import { performanceMonitor } from '@/utils/PerformanceMonitor';

interface WeatherParams {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
}

interface GridCell {
  lat: number;
  lng: number;
  id: string;
  data?: HistoricalWeatherData;
  loading?: boolean;
  lastFetched?: number;
}

interface HistoricalWeatherData {
  temperature: number[];
  precipitation: number[];
  dates: string[];
  avgTemperature: number;
  avgPrecipitation: number;
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
  const autoRotateRef = useRef(true); // Ref to track auto-rotate state for animation loop
  
  // Initialize autoRotateRef with the initial state
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, []);
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
  
  // Historical weather grid state
  const [showHistoricalGrid, setShowHistoricalGrid] = useState(false);
  const [historicalDateRange, setHistoricalDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [selectedGridCell, setSelectedGridCell] = useState<GridCell | null>(null);
  
  // Surface click weather state
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

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
    // Don't disable auto-rotate when selecting cities, let user control it
    
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

  // Shared materials for better performance (reuse instead of creating new ones)
  const sharedMaterials = useRef<{
    capital: THREE.MeshBasicMaterial;
    city: THREE.MeshBasicMaterial;
    selected: THREE.MeshBasicMaterial;
  }>();

  // Initialize shared materials once
  useEffect(() => {
    sharedMaterials.current = {
      capital: new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.85 }),
      city: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 }),
      selected: new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.9 })
    };
  }, []);

  // Optimized marker creation with shared geometry and materials
  const createOptimizedMarker = (city: City, scene: THREE.Scene, earth: THREE.Mesh): THREE.Mesh => {
    // Use shared geometry for all markers (huge memory savings)
    const markerGeometry = new THREE.SphereGeometry(0.025, 8, 6);
    
    // Use shared materials
    const isSelected = selectedCity && selectedCity.name === city.name && selectedCity.country === city.country;
    let material = sharedMaterials.current?.city;
    
    if (isSelected) {
      material = sharedMaterials.current?.selected;
    } else if (city.isCapital) {
      material = sharedMaterials.current?.capital;
    }
    
    const marker = new THREE.Mesh(markerGeometry, material);
    const position = latLngToVector3(city.lat, city.lng);
    marker.position.copy(position);
    
    // More conservative population scaling for refined appearance
    const populationScale = Math.max(0.6, Math.min(1.4, Math.log10(city.population) / 5));
    marker.scale.setScalar(populationScale);
    
    marker.userData = { 
      city, 
      originalScale: populationScale,
      pulsePhase: Math.random() * Math.PI * 2,
      lastUpdate: 0,
      isVisible: true
    };
    
    return marker;
  };

  const regions = ['All', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const cityStats = getCityCount();

  // Convert lat/lng to 3D coordinates on sphere (reference implementation)
  const latLngToVector3 = (lat: number, lng: number, radius: number = 5.1) => {
    const phi = (90 - lat) * (Math.PI / 180);      // Colatitude (0 at north pole)
    const theta = (lng + 180) * (Math.PI / 180);   // Longitude shifted by 180°
    
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),  // Note: X is negated
      radius * Math.cos(phi),                       // Y points to north pole
      radius * Math.sin(phi) * Math.sin(theta)      // Z component  
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
    let userInteractionRef = { current: false }; // Ref to track user interaction state

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only left click
      isMouseDown = true;
      isRotating = false;
      userInteractionRef.current = true;
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
        userInteractionRef.current = true;
        
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
      
      // If it was just a click (no rotation), check for intersections
      if (!isRotating && markersRef.current && cameraRef.current && earthRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, cameraRef.current);
        
        // First, check for city marker clicks (higher priority)
        const markerIntersects = raycaster.intersectObjects(markersRef.current.children, true);
        
        if (markerIntersects.length > 0) {
          const clickedObject = markerIntersects[0].object;
          if (clickedObject.userData && clickedObject.userData.city) {
            handleCityClick(clickedObject.userData.city);
            toast.success(`Getting forecast for ${clickedObject.userData.city.name}`);
          }
        } else {
          // If no city marker was clicked, check for Earth surface click
          const earthIntersects = raycaster.intersectObject(earthRef.current, true);
          
          if (earthIntersects.length > 0) {
            const intersection = earthIntersects[0].point;
            // Transform the intersection point into the Earth's local space to account for rotation
            const localPoint = earthRef.current.worldToLocal(intersection.clone());
            const { lat, lng } = vector3ToLatLng(localPoint);
            
            // Validate coordinates are within Earth bounds
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              handleSurfaceClick(lat, lng);
            }
          }
        }
      }
      
      isMouseDown = false;
      userInteractionRef.current = false;
      
      // Reset cursor
      renderer.domElement.style.cursor = 'grab';
      
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

    // Optimized animation loop with performance monitoring
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Update performance monitor
      performanceMonitor.update();

      const time = Date.now() * 0.001;
      const settings = performanceMonitor.getSettings();
      const shouldUpdate = time - lastUpdateTime.current > (performanceMonitor.getAnimationFrequency() / 1000);

      // Only apply auto-rotation if enabled and not manually controlling
      if (earthRef.current && autoRotateRef.current && !userInteractionRef.current) {
        earthRef.current.rotation.y += (performanceMode ? 0.001 : 0.002) * settings.animationQuality;
      }

      // Optimized marker animations with frustum culling and batching
      if (shouldUpdate && markersRef.current && cameraRef.current) {
        const camera = cameraRef.current;
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);
        
        let visibleCount = 0;
        const maxVisibleMarkers = performanceMode ? 500 : 1000;
        
        markersRef.current.children.forEach((marker, index) => {
          const mesh = marker as THREE.Mesh;
          if (mesh.userData.city) {
            // Frustum culling - only update visible markers
            const isInFrustum = frustum.containsPoint(mesh.position);
            mesh.visible = isInFrustum && visibleCount < maxVisibleMarkers;
            
            if (mesh.visible) {
              visibleCount++;
              
              // Stagger animations across frames to prevent hitches
              if (!performanceMode && index % 3 === (Date.now() % 3)) {
                mesh.userData.pulsePhase += 0.01;
                const pulse = 1 + Math.sin(mesh.userData.pulsePhase) * 0.2;
                mesh.scale.setScalar(mesh.userData.originalScale * pulse);
              }
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

  // Sync autoRotate state with ref whenever it changes
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const updateWeatherParam = (key: keyof WeatherParams, value: number) => {
    setWeatherParams(prev => ({ ...prev, [key]: value }));
  };

  // Historical weather grid handlers
  const handleGridCellClick = (cell: GridCell) => {
    setSelectedGridCell(cell);
    toast.success(`Selected region: ${cell.lat.toFixed(1)}°, ${cell.lng.toFixed(1)}°`);
  };

  const handleHistoricalDateRangeChange = (range: { start: string; end: string }) => {
    setHistoricalDateRange(range);
    setSelectedGridCell(null); // Clear selection when date range changes
    toast.success(`Updated date range: ${range.start} to ${range.end}`);
  };

  // Convert 3D point back to lat/lng coordinates (fixed to match latLngToVector3)
  const vector3ToLatLng = (vector: THREE.Vector3): { lat: number; lng: number } => {
    const normalizedVector = vector.clone().normalize();
    
    // This must exactly invert the latLngToVector3 transformation:
    // X: -(radius * Math.sin(phi) * Math.cos(theta))
    // Y: radius * Math.cos(phi)  
    // Z: radius * Math.sin(phi) * Math.sin(theta)
    
    // From Y component: lat = 90 - phi, where phi = acos(y)
    const phi = Math.acos(Math.max(-1, Math.min(1, normalizedVector.y)));
    const lat = 90 - (phi * (180 / Math.PI));
    
    // From X and Z components: theta = atan2(z, -x) 
    // Note: we use -x because forward conversion negates x
    const theta = Math.atan2(normalizedVector.z, -normalizedVector.x);
    let lng = (theta * (180 / Math.PI)) - 180;
    
    // Normalize longitude to [-180, 180] range
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    
    return { lat, lng };
  };

  // Reverse geocoding cache for performance
  const geocodingCacheRef = useRef<Map<string, any>>(new Map());
  const pendingGeocodeRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

  // Get cached reverse geocoding result
  const getCachedGeocode = (lat: number, lng: number): any | null => {
    // Round coordinates to reduce cache size (±1km accuracy)
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const key = `${roundedLat},${roundedLng}`;
    
    // Check memory cache first
    if (geocodingCacheRef.current.has(key)) {
      return geocodingCacheRef.current.get(key);
    }
    
    // Check localStorage cache
    try {
      const cached = localStorage.getItem(`geocode_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache valid for 7 days
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          geocodingCacheRef.current.set(key, parsed.data);
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to read geocoding cache:', error);
    }
    
    return null;
  };

  const setCachedGeocode = (lat: number, lng: number, data: any): void => {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const key = `${roundedLat},${roundedLng}`;
    
    // Set memory cache
    geocodingCacheRef.current.set(key, data);
    
    // Set localStorage cache
    try {
      localStorage.setItem(`geocode_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to write geocoding cache:', error);
    }
  };

  // Optimized reverse geocode with aggressive caching and request deduplication
  const reverseGeocode = async (lat: number, lng: number): Promise<any> => {
    // Check cache first for instant response
    const cached = getCachedGeocode(lat, lng);
    if (cached) return cached;

    // Create a unique key for this request
    const requestKey = `${Math.round(lat * 100)},${Math.round(lng * 100)}`;
    
    // If request is already in flight, wait for it instead of making duplicate request
    if (pendingGeocodeRequestsRef.current.has(requestKey)) {
      return pendingGeocodeRequestsRef.current.get(requestKey);
    }

    try {
      // Create the promise for this geocoding request
      const geocodePromise = (async () => {
        // Add timeout and retry logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${lat}&lon=${lng}&format=json&` +
          `addressdetails=1&accept-language=en&` +
          `zoom=8&extratags=1`, // Reduced zoom for faster response
          {
            headers: {
              'User-Agent': 'EarthWeatherApp/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Geocoding failed');
        
        const data = await response.json();
        
        // Cache the result immediately
        setCachedGeocode(lat, lng, data);
        
        return data;
      })();

      // Store the promise so other requests can wait for it
      pendingGeocodeRequestsRef.current.set(requestKey, geocodePromise);
      
      const result = await geocodePromise;
      
      // Clean up the pending request
      pendingGeocodeRequestsRef.current.delete(requestKey);
      
      return result;
    } catch (error) {
      // Clean up on error
      pendingGeocodeRequestsRef.current.delete(requestKey);
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  };

  // Optimized location naming with performance improvements
  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      // Try reverse geocoding with timeout
      const geocodeResult = await Promise.race([
        reverseGeocode(lat, lng),
        new Promise(resolve => setTimeout(() => resolve(null), 2000)) // 2 second timeout
      ]);
      
      if (geocodeResult && geocodeResult.address) {
        const addr = geocodeResult.address;
        const parts: string[] = [];
        
        // Prioritize most specific location info
        if (addr.city || addr.town || addr.village || addr.hamlet) {
          parts.push(addr.city || addr.town || addr.village || addr.hamlet);
        }
        
        // Add administrative divisions
        if (addr.state || addr.province || addr.region || addr.county) {
          parts.push(addr.state || addr.province || addr.region || addr.county);
        }
        
        if (addr.country) {
          parts.push(addr.country);
        }
        
        // Return if we have good regional data
        if (parts.length >= 2) {
          return parts.join(', ');
        }
        
        // Fallback to cleaned display name
        if (geocodeResult.display_name) {
          const cleaned = geocodeResult.display_name
            .split(',')
            .map((part: string) => part.trim())
            .filter((part: string) => {
              // Remove house numbers, postcodes, and coordinate-like strings
              return !/^\d+$/.test(part) && 
                     !/^\d{4,}/.test(part) &&
                     !part.match(/^[\d\-\s]+$/) &&
                     part.length > 2 &&
                     !part.includes('°'); // Remove coordinate references
            })
            .slice(0, 3)
            .join(', ');
          
          if (cleaned.length > 5) {
            return cleaned;
          }
        }
      }
    } catch (error) {
      console.warn('Enhanced geocoding failed, using fallback:', error);
    }
    
    // Fast fallback to nearest city method
    return getNearestCityName(lat, lng);
  };

  // Fallback method: nearest city calculation
  const getNearestCityName = (lat: number, lng: number): string => {
    // Find nearest city for reference
    const nearestCity = worldCities.reduce((closest, city) => {
      const cityDistance = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      );
      const closestDistance = Math.sqrt(
        Math.pow(closest.lat - lat, 2) + Math.pow(closest.lng - lng, 2)
      );
      return cityDistance < closestDistance ? city : closest;
    });

    const distance = Math.sqrt(
      Math.pow(nearestCity.lat - lat, 2) + Math.pow(nearestCity.lng - lng, 2)
    );

    // If very close to a city (within ~50km), use city name
    if (distance < 0.5) {
      return `${nearestCity.name}, ${nearestCity.country}`;
    }

    // Otherwise create a descriptive name
    const direction = getDirection(lat, lng, nearestCity.lat, nearestCity.lng);
    const distanceKm = Math.round(distance * 111); // Convert to rough km
    
    return `${distanceKm}km ${direction} of ${nearestCity.name}, ${nearestCity.country}`;
  };

  const getDirection = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const dlat = lat1 - lat2;
    const dlng = lng1 - lng2;
    
    const angle = Math.atan2(dlng, dlat) * (180 / Math.PI);
    const directions = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
    const index = Math.round((angle + 360) % 360 / 45) % 8;
    
    return directions[index];
  };

  // Handle surface click for weather at any location
  const handleSurfaceClick = async (lat: number, lng: number) => {
    try {
      // Show simple loading message
      toast("Getting location info...", { 
        description: "Fetching regional data for selected location"
      });
      
      const locationName = await getLocationName(lat, lng);
      
      // Create a temporary city-like object for the clicked location
      const tempLocation = {
        name: locationName,
        country: "", // Will be populated from geocoding
        lat: lat,
        lng: lng,
        population: 0,
        isCapital: false,
        region: "Custom"
      };

      setClickedLocation({ lat, lng, name: locationName });
      setForecastCity(tempLocation);
      setShowWeatherForecast(true);
      fetchWeatherData(tempLocation);
      
      // Show success message
      toast.success(`Getting forecast for ${locationName}`, {
        description: `Lat: ${lat.toFixed(3)}, Lng: ${lng.toFixed(3)}`
      });
    } catch (error) {
      toast.error("Failed to get location info", {
        description: "Please try clicking another location"
      });
      console.error('Error getting location name:', error);
    }
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
                  // Don't force auto-rotate on, respect user's toggle setting
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

      {/* Earth Controls Panel - Show when forecast is NOT open */}
      {!showWeatherForecast && (
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
                onClick={() => {
                  const newAutoRotate = !autoRotate;
                  setAutoRotate(newAutoRotate);
                  autoRotateRef.current = newAutoRotate; // Update ref immediately
                  toast.success(`Auto-rotate ${newAutoRotate ? 'enabled' : 'disabled'}`);
                }}
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
      )}
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

      {/* Weather Controls Panel - Show when forecast is open */}
      <Card className="absolute top-6 left-6 p-6 w-80 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass z-10">
        <h3 className="text-lg font-semibold mb-4 bg-gradient-earth bg-clip-text text-transparent">
          {showWeatherForecast ? '🎛️ Interactive Weather' : '🌤️ Weather Parameters'}
        </h3>
        
        {showWeatherForecast && (
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Real-time Simulation:</strong> Adjust parameters below to see live changes in the forecast!
            </p>
          </div>
        )}
        
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
            {showWeatherForecast && (
              <p className="text-xs text-muted-foreground mt-1">
                Base: 20°C | Current: {weatherParams.temperature > 20 ? '+' : ''}{(weatherParams.temperature - 20).toFixed(1)}°C
              </p>
            )}
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
            {showWeatherForecast && weatherParams.humidity > 80 && (
              <p className="text-xs text-orange-400 mt-1">⚠️ High humidity may increase rain probability</p>
            )}
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
            {showWeatherForecast && weatherParams.pressure < 1000 && (
              <p className="text-xs text-orange-400 mt-1">⚠️ Low pressure may indicate stormy weather</p>
            )}
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
            {showWeatherForecast && weatherParams.windSpeed > 30 && (
              <p className="text-xs text-orange-400 mt-1">💨 High winds may affect outdoor activities</p>
            )}
          </div>
          
          {showWeatherForecast && (
            <div className="pt-3 border-t border-border/50">
              <Button
                onClick={() => {
                  setWeatherParams({
                    temperature: 20,
                    humidity: 60,
                    pressure: 1013,
                    windSpeed: 15,
                  });
                  toast.success('Reset to default values');
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                🔄 Reset to Defaults
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Historical Weather Grid Controls */}
      <HistoricalWeatherControls
        visible={showHistoricalGrid}
        onToggle={() => setShowHistoricalGrid(!showHistoricalGrid)}
        dateRange={historicalDateRange}
        onDateRangeChange={handleHistoricalDateRangeChange}
        selectedCell={selectedGridCell}
        onClearSelection={() => setSelectedGridCell(null)}
      />

      {/* Instructions */}
      <Card className="absolute bottom-6 left-1/2 transform -translate-x-1/2 p-4 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass z-10">
        <div className="text-sm space-y-2">
          <p className="font-medium text-foreground">Controls:</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• <span className="font-medium">Hold left-click + drag</span> to rotate Earth</li>
            <li>• <span className="font-medium">Click city dots</span> for current weather</li>
            <li>• <span className="font-medium">Click anywhere on Earth</span> for location forecast</li>
            <li>• <span className="font-medium">Select city + Event Planner</span> for probability analysis</li>
            <li>• Search cities above to focus on them</li>
            <li>• Scroll to zoom in/out</li>
            <li>• <span className="text-yellow-400">Gold dots</span> = capitals</li>
            <li>• <span className="text-cyan-400">Cyan dots</span> = major cities</li>
            <li>• <span className="text-red-400">Red dot</span> = selected city</li>
            <li>• Larger dots = bigger population</li>
            <li>• <span className="text-purple-400">📡 NASA Earth data</span> for event planning</li>
            {showHistoricalGrid && (
              <>
                <li>• <span className="text-blue-400">Blue grid</span> = cold historical temps</li>
                <li>• <span className="text-red-400">Red grid</span> = hot historical temps</li>
                <li>• <span className="font-medium">Click colored regions</span> for historical data</li>
              </>
            )}
          </ul>
        </div>
      </Card>

      {/* Historical Weather Grid */}
      {sceneRef.current && cameraRef.current && (
        <HistoricalWeatherGrid
          scene={sceneRef.current}
          camera={cameraRef.current}
          earth={earthRef.current || null}
          visible={showHistoricalGrid}
          selectedDateRange={historicalDateRange}
          onCellClick={handleGridCellClick}
        />
      )}

      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-gradient-atmosphere pointer-events-none" />

      {/* Weather Forecast Modal */}
      {showWeatherForecast && forecastCity && (
        <WeatherForecast
          city={forecastCity}
          weatherData={weatherData}
          isLoading={loadingWeather}
          weatherParams={weatherParams}
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
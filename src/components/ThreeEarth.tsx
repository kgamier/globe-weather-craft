import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface WeatherParams {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
}

interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
}

const ThreeEarth = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const earthRef = useRef<THREE.Mesh>();
  const cloudsRef = useRef<THREE.Mesh>();
  const frameRef = useRef<number>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNightLights, setShowNightLights] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [weatherParams, setWeatherParams] = useState<WeatherParams>({
    temperature: 20,
    humidity: 60,
    pressure: 1013,
    windSpeed: 15,
  });

  // Expanded cities dataset with more global coverage
  const worldCities: City[] = [
    // Major capitals and cities
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, population: 14000000 },
    { name: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, population: 32900000 },
    { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, population: 28500000 },
    { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, population: 22400000 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, population: 21800000 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, population: 20900000 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, population: 20400000 },
    { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, population: 21500000 },
    { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, population: 22000000 },
    { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023, population: 18900000 },
    { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, population: 18800000 },
    { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, population: 16000000 },
    { name: 'Buenos Aires', country: 'Argentina', lat: -34.6118, lng: -58.3960, population: 15000000 },
    { name: 'Chongqing', country: 'China', lat: 29.4316, lng: 106.9123, population: 15000000 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, population: 15500000 },
    { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, population: 14800000 },
    { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, population: 13500000 },
    { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, population: 15400000 },
    { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, population: 13500000 },
    { name: 'Tianjin', country: 'China', lat: 39.3434, lng: 117.3616, population: 13900000 },
    { name: 'Kinshasa', country: 'Congo', lat: -4.4419, lng: 15.2663, population: 14300000 },
    { name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, population: 13100000 },
    { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437, population: 13200000 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6176, population: 12500000 },
    { name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579, population: 12400000 },
    { name: 'Lahore', country: 'Pakistan', lat: 31.5804, lng: 74.3587, population: 12600000 },
    { name: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946, population: 12300000 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, population: 11000000 },
    { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721, population: 11000000 },
    { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, population: 10800000 },
    { name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, population: 10700000 },
    { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428, population: 10700000 },
    { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, population: 10500000 },
    { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, population: 9700000 },
    { name: 'Nagoya', country: 'Japan', lat: 35.1815, lng: 136.9066, population: 9500000 },
    { name: 'Hyderabad', country: 'India', lat: 17.3850, lng: 78.4867, population: 9500000 },
    { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, population: 9600000 },
    { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.3890, population: 9100000 },
    { name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298, population: 9500000 },
    { name: 'Chengdu', country: 'China', lat: 30.5728, lng: 104.0668, population: 9000000 },
    { name: 'Nanjing', country: 'China', lat: 32.0603, lng: 118.7969, population: 8800000 },
    { name: 'Wuhan', country: 'China', lat: 30.5928, lng: 114.3055, population: 8800000 },
    { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, population: 8600000 },
    { name: 'Luanda', country: 'Angola', lat: -8.8390, lng: 13.2894, population: 8300000 },
    { name: 'Ahmedabad', country: 'India', lat: 23.0225, lng: 72.5714, population: 8200000 },
    { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, population: 8200000 },
    { name: 'Xi\'an', country: 'China', lat: 34.2667, lng: 108.9000, population: 8000000 },
    { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694, population: 7500000 },
    { name: 'Dongguan', country: 'China', lat: 23.0489, lng: 113.7447, population: 7400000 },
    { name: 'Hangzhou', country: 'China', lat: 30.2741, lng: 120.1551, population: 7200000 },
    { name: 'Foshan', country: 'China', lat: 23.0218, lng: 113.1219, population: 7200000 },
    { name: 'Shenyang', country: 'China', lat: 41.8057, lng: 123.4315, population: 7100000 }
  ];

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

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
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
      scene.add(earth);
      earthRef.current = earth;

      // Add city markers
      worldCities.forEach(city => {
        const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLngToVector3(city.lat, city.lng);
        marker.position.copy(position);
        
        // Add pulsing animation
        const originalScale = marker.scale.clone();
        marker.userData = { 
          city, 
          originalScale,
          pulseTime: Math.random() * Math.PI * 2
        };
        
        earth.add(marker);
      });

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
      scene.add(earth);
      earthRef.current = earth;
      setIsLoading(false);
      toast.success("Earth loaded (basic mode)");
    });

    // Create clouds
    const cloudsGeometry = new THREE.SphereGeometry(5.1, 64, 64);
    const cloudsMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(clouds);
    cloudsRef.current = clouds;

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      setAutoRotate(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      rotationVelocity.x = deltaMove.y * 0.005;
      rotationVelocity.y = deltaMove.x * 0.005;

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      setTimeout(() => setAutoRotate(true), 2000);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(8, Math.min(25, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      if (earthRef.current) {
        if (autoRotate && !isDragging) {
          earthRef.current.rotation.y += 0.002;
        } else {
          earthRef.current.rotation.x += rotationVelocity.x;
          earthRef.current.rotation.y += rotationVelocity.y;
          rotationVelocity.x *= 0.95;
          rotationVelocity.y *= 0.95;
        }

        // Animate city markers
        earthRef.current.children.forEach(child => {
          if (child.userData.city) {
            child.userData.pulseTime += 0.02;
            const pulse = 1 + Math.sin(child.userData.pulseTime) * 0.3;
            child.scale.copy(child.userData.originalScale).multiplyScalar(pulse);
          }
        });
      }

      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.0005;
      }

      renderer.render(scene, camera);
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
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate, showNightLights]);

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
      
      {/* Weather Controls Panel */}
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

      {/* Controls Panel */}
      <Card className="absolute top-6 right-6 p-4 w-72 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
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
      <Card className="absolute bottom-6 left-6 p-4 backdrop-blur-glass bg-card/70 border-glass-border shadow-glass">
        <div className="text-sm space-y-2">
          <p className="font-medium text-foreground">Controls:</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• Click and drag to rotate Earth</li>
            <li>• Scroll to zoom in/out</li>
            <li>• Cyan dots = major cities</li>
            <li>• Weather parameters affect all cities</li>
          </ul>
        </div>
      </Card>

      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-gradient-atmosphere pointer-events-none" />
    </div>
  );
};

export default ThreeEarth;
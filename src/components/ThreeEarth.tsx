import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { worldCities, getCityCount, type City } from '@/data/worldCities';

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
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNightLights, setShowNightLights] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCapitalsOnly, setShowCapitalsOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
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
      const filteredCities = getFilteredCities();
      
      filteredCities.forEach(city => {
        const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        
        // Different colors for capitals vs major cities
        const markerColor = city.isCapital ? 0xffd700 : 0x00ffff; // Gold for capitals, cyan for major cities
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: markerColor,
          transparent: true,
          opacity: 0.9
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLngToVector3(city.lat, city.lng);
        marker.position.copy(position);
        
        // Scale marker based on population
        const populationScale = Math.max(0.5, Math.min(2.0, Math.log10(city.population) / 4));
        marker.scale.setScalar(populationScale);
        
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
  }, [autoRotate, showNightLights, showCapitalsOnly, selectedRegion]);

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
            <li>• <span className="text-yellow-400">Gold dots</span> = capitals</li>
            <li>• <span className="text-cyan-400">Cyan dots</span> = major cities</li>
            <li>• Larger dots = bigger population</li>
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
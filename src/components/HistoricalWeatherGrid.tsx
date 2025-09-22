import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Grid cell represents a 2°x2° area (~200km squares)
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

interface HistoricalWeatherGridProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  earth: THREE.Mesh | null;
  visible: boolean;
  selectedDateRange: { start: string; end: string };
  onCellClick?: (cell: GridCell) => void;
}

export const HistoricalWeatherGrid: React.FC<HistoricalWeatherGridProps> = ({
  scene,
  camera,
  earth,
  visible,
  selectedDateRange,
  onCellClick
}) => {
  const [gridCells, setGridCells] = useState<Map<string, GridCell>>(new Map());
  const [visibleCells, setVisibleCells] = useState<Set<string>>(new Set());
  const gridMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());

  // Generate grid cell ID
  const getCellId = (lat: number, lng: number): string => {
    const gridLat = Math.floor(lat / 2) * 2;
    const gridLng = Math.floor(lng / 2) * 2;
    return `${gridLat},${gridLng}`;
  };

  // Convert lat/lng to 3D position on sphere
  const latLngToVector3 = (lat: number, lng: number, radius = 1.01): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(-z, y, -x);
  };

  // Cache management
  const getCachedData = (cellId: string): HistoricalWeatherData | null => {
    const cached = localStorage.getItem(`weather_${cellId}_${selectedDateRange.start}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache valid for 24 hours
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
    return null;
  };

  const setCachedData = (cellId: string, data: HistoricalWeatherData): void => {
    localStorage.setItem(`weather_${cellId}_${selectedDateRange.start}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  // Fetch historical weather data for a grid cell
  const fetchCellData = async (cell: GridCell): Promise<void> => {
    const cachedData = getCachedData(cell.id);
    if (cachedData) {
      setGridCells(prev => new Map(prev.set(cell.id, { ...cell, data: cachedData })));
      return;
    }

    setGridCells(prev => new Map(prev.set(cell.id, { ...cell, loading: true })));

    try {
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${cell.lat}&longitude=${cell.lng}&` +
        `start_date=${selectedDateRange.start}&end_date=${selectedDateRange.end}&` +
        `daily=temperature_2m_mean,precipitation_sum&` +
        `timezone=UTC`
      );

      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();
      
      const historicalData: HistoricalWeatherData = {
        temperature: data.daily.temperature_2m_mean || [],
        precipitation: data.daily.precipitation_sum || [],
        dates: data.daily.time || [],
        avgTemperature: data.daily.temperature_2m_mean?.reduce((a: number, b: number) => a + b, 0) / (data.daily.temperature_2m_mean?.length || 1) || 0,
        avgPrecipitation: data.daily.precipitation_sum?.reduce((a: number, b: number) => a + b, 0) / (data.daily.precipitation_sum?.length || 1) || 0
      };

      setCachedData(cell.id, historicalData);
      
      setGridCells(prev => new Map(prev.set(cell.id, {
        ...cell,
        data: historicalData,
        loading: false,
        lastFetched: Date.now()
      })));
    } catch (error) {
      console.error('Failed to fetch weather data for cell:', cell.id, error);
      setGridCells(prev => new Map(prev.set(cell.id, { ...cell, loading: false })));
    }
  };

  // Generate visible grid cells based on camera position
  const updateVisibleCells = (): void => {
    if (!camera || !earth) return;

    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const visibilityRadius = Math.min(180, Math.max(20, 1000 / cameraDistance));
    
    const newVisibleCells = new Set<string>();
    const newGridCells = new Map(gridCells);

    // Generate grid cells within visibility radius
    for (let lat = -90; lat <= 90; lat += 2) {
      for (let lng = -180; lng <= 180; lng += 2) {
        const cellId = getCellId(lat, lng);
        const cellCenter = latLngToVector3(lat + 1, lng + 1);
        
        // Check if cell is within visibility radius
        const screenPosition = cellCenter.clone().project(camera);
        const isVisible = Math.abs(screenPosition.x) <= 1.5 && 
                         Math.abs(screenPosition.y) <= 1.5 && 
                         screenPosition.z <= 1;

        if (isVisible && cameraDistance < 10) {
          newVisibleCells.add(cellId);
          
          if (!newGridCells.has(cellId)) {
            const cell: GridCell = {
              lat,
              lng,
              id: cellId
            };
            newGridCells.set(cellId, cell);
            
            // Fetch data for new cells
            fetchCellData(cell);
          }
        }
      }
    }

    setVisibleCells(newVisibleCells);
    setGridCells(newGridCells);
  };

  // Create or update grid mesh for a cell
  const updateCellMesh = (cell: GridCell): void => {
    if (!scene || !visible) return;

    const existingMesh = gridMeshesRef.current.get(cell.id);
    if (existingMesh) {
      scene.remove(existingMesh);
      gridMeshesRef.current.delete(cell.id);
    }

    if (!visibleCells.has(cell.id) || !cell.data) return;

    // Color based on temperature (blue = cold, red = hot)
    const temp = cell.data.avgTemperature;
    const normalizedTemp = Math.max(0, Math.min(1, (temp + 30) / 60)); // -30°C to +30°C
    const color = new THREE.Color().setHSL(0.7 - normalizedTemp * 0.7, 0.8, 0.5);
    
    // Create grid cell geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Position on sphere surface
    const position = latLngToVector3(cell.lat + 1, cell.lng + 1, 1.005);
    mesh.position.copy(position);
    mesh.lookAt(new THREE.Vector3(0, 0, 0));
    mesh.userData = { cellId: cell.id, type: 'weatherGrid' };

    scene.add(mesh);
    gridMeshesRef.current.set(cell.id, mesh);
  };

  // Handle mouse clicks on grid cells
  const handleClick = (event: MouseEvent): void => {
    if (!scene || !camera || !onCellClick) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.current.setFromCamera(mouse, camera);
    const meshes = Array.from(gridMeshesRef.current.values());
    const intersects = raycaster.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const cellId = mesh.userData.cellId;
      const cell = gridCells.get(cellId);
      if (cell) {
        onCellClick(cell);
      }
    }
  };

  // Update grid when dependencies change
  useEffect(() => {
    updateVisibleCells();
  }, [camera, earth, selectedDateRange]);

  // Update meshes when grid cells change
  useEffect(() => {
    gridCells.forEach(cell => updateCellMesh(cell));
  }, [gridCells, visibleCells, visible, scene]);

  // Add click listener
  useEffect(() => {
    if (visible && onCellClick) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [visible, onCellClick, scene, camera]);

  // Clean up meshes when component unmounts or becomes invisible
  useEffect(() => {
    if (!visible || !scene) {
      gridMeshesRef.current.forEach(mesh => {
        scene?.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      gridMeshesRef.current.clear();
    }
  }, [visible, scene]);

  // Update visible cells on camera movement (throttled)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateVisibleCells, 100);
    };

    if (visible && camera && earth) {
      window.addEventListener('wheel', throttledUpdate);
      window.addEventListener('mousemove', throttledUpdate);
      
      return () => {
        window.removeEventListener('wheel', throttledUpdate);
        window.removeEventListener('mousemove', throttledUpdate);
        clearTimeout(timeoutId);
      };
    }
  }, [visible, camera, earth]);

  return null; // This is a pure Three.js component, no JSX rendering
};

export default HistoricalWeatherGrid;
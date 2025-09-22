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
  const requestQueueRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);

  // Generate grid cell ID with validation
  const getCellId = (lat: number, lng: number): string | null => {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    
    const gridLat = Math.floor(lat / 2) * 2;
    const gridLng = Math.floor(lng / 2) * 2;
    return `${gridLat},${gridLng}`;
  };

  // Get adaptive grid size based on camera distance
  const getGridSize = (cameraDistance: number): number => {
    if (cameraDistance > 8) return 8; // Very zoomed out - 8° grid
    if (cameraDistance > 5) return 4; // Medium zoom - 4° grid  
    return 2; // Close zoom - 2° grid
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

  // Throttled batch fetcher with max concurrent requests
  const fetchCellDataBatch = async (cells: GridCell[]): Promise<void> => {
    const MAX_CONCURRENT = 3; // Limit concurrent requests
    const DELAY_BETWEEN_BATCHES = 100; // ms delay between batches
    
    for (let i = 0; i < cells.length; i += MAX_CONCURRENT) {
      const batch = cells.slice(i, i + MAX_CONCURRENT);
      
      await Promise.all(batch.map(cell => fetchSingleCell(cell)));
      
      // Delay between batches to avoid overwhelming the API
      if (i + MAX_CONCURRENT < cells.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
  };

  // Fetch single cell with proper error handling
  const fetchSingleCell = async (cell: GridCell): Promise<void> => {
    // Skip if already loading or in queue
    if (requestQueueRef.current.has(cell.id)) return;
    
    const cachedData = getCachedData(cell.id);
    if (cachedData) {
      setGridCells(prev => new Map(prev.set(cell.id, { ...cell, data: cachedData })));
      return;
    }

    requestQueueRef.current.add(cell.id);
    setGridCells(prev => new Map(prev.set(cell.id, { ...cell, loading: true })));

    try {
      // Add center offset to grid cell for better representation
      const centerLat = cell.lat + 1;
      const centerLng = cell.lng + 1;
      
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${centerLat}&longitude=${centerLng}&` +
        `start_date=${selectedDateRange.start}&end_date=${selectedDateRange.end}&` +
        `daily=temperature_2m_mean,precipitation_sum&` +
        `timezone=UTC`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      const historicalData: HistoricalWeatherData = {
        temperature: data.daily?.temperature_2m_mean || [],
        precipitation: data.daily?.precipitation_sum || [],
        dates: data.daily?.time || [],
        avgTemperature: data.daily?.temperature_2m_mean?.reduce((a: number, b: number) => a + b, 0) / (data.daily?.temperature_2m_mean?.length || 1) || 0,
        avgPrecipitation: data.daily?.precipitation_sum?.reduce((a: number, b: number) => a + b, 0) / (data.daily?.precipitation_sum?.length || 1) || 0
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
    } finally {
      requestQueueRef.current.delete(cell.id);
    }
  };

  // Optimized visible cells calculation with frustum culling
  const updateVisibleCells = (): void => {
    if (!camera || !earth || !visible) return;

    // Throttle updates to avoid excessive recalculation
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return; // Max 5 updates per second
    lastUpdateRef.current = now;

    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    
    // Don't load data when very far away
    if (cameraDistance > 12) return;
    
    const gridSize = getGridSize(cameraDistance);
    const newVisibleCells = new Set<string>();
    const cellsToFetch: GridCell[] = [];

    // Calculate camera's forward direction for better frustum culling
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    
    // More efficient iteration - sample fewer points when far away
    const step = cameraDistance > 6 ? gridSize * 2 : gridSize;
    const latStart = Math.max(-88, -90); // Avoid poles
    const latEnd = Math.min(88, 90);

    for (let lat = latStart; lat <= latEnd; lat += step) {
      for (let lng = -180; lng <= 180; lng += step) {
        const cellId = getCellId(lat, lng);
        if (!cellId) continue;

        // Quick distance check before expensive projection
        const cellCenter = latLngToVector3(lat + step/2, lng + step/2);
        const distanceToCamera = cellCenter.distanceTo(camera.position);
        
        if (distanceToCamera > 8) continue; // Skip very distant cells
        
        // Check if cell faces the camera (back-face culling)
        const toCameraDirection = camera.position.clone().sub(cellCenter).normalize();
        const cellNormal = cellCenter.clone().normalize();
        if (toCameraDirection.dot(cellNormal) < 0.3) continue; // Skip back-facing cells
        
        // Project to screen space
        const screenPosition = cellCenter.clone().project(camera);
        const isVisible = Math.abs(screenPosition.x) <= 1.2 && 
                         Math.abs(screenPosition.y) <= 1.2 && 
                         screenPosition.z <= 1 && 
                         screenPosition.z >= -1;

        if (isVisible) {
          newVisibleCells.add(cellId);
          
          if (!gridCells.has(cellId)) {
            const cell: GridCell = {
              lat: Math.floor(lat / gridSize) * gridSize,
              lng: Math.floor(lng / gridSize) * gridSize,
              id: cellId
            };
            cellsToFetch.push(cell);
          }
        }
      }
    }

    setVisibleCells(newVisibleCells);
    
    // Update grid cells state with new cells
    if (cellsToFetch.length > 0) {
      setGridCells(prev => {
        const newMap = new Map(prev);
        cellsToFetch.forEach(cell => newMap.set(cell.id, cell));
        return newMap;
      });
      
      // Batch fetch new cells
      if (cellsToFetch.length <= 10) { // Only fetch if reasonable number
        fetchCellDataBatch(cellsToFetch);
      }
    }
  };

  // Create or update grid mesh for a cell with performance optimizations
  const updateCellMesh = (cell: GridCell): void => {
    if (!scene || !visible || !visibleCells.has(cell.id) || !cell.data) return;

    const existingMesh = gridMeshesRef.current.get(cell.id);
    if (existingMesh) {
      // Update existing mesh color instead of recreating
      const temp = cell.data.avgTemperature;
      const normalizedTemp = Math.max(0, Math.min(1, (temp + 30) / 60));
      const color = new THREE.Color().setHSL(0.7 - normalizedTemp * 0.7, 0.8, 0.5);
      (existingMesh.material as THREE.MeshBasicMaterial).color = color;
      return;
    }

    // Color based on temperature (blue = cold, red = hot)
    const temp = cell.data.avgTemperature;
    const normalizedTemp = Math.max(0, Math.min(1, (temp + 30) / 60)); // -30°C to +30°C
    const color = new THREE.Color().setHSL(0.7 - normalizedTemp * 0.7, 0.8, 0.5);
    
    // Use adaptive geometry size based on camera distance
    const cameraDistance = camera?.position.distanceTo(new THREE.Vector3(0, 0, 0)) || 5;
    const gridSize = getGridSize(cameraDistance);
    
    const geometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const material = new THREE.MeshBasicMaterial({ 
      color,
      transparent: true,
      opacity: cameraDistance > 8 ? 0.4 : 0.6, // More transparent when far
      side: THREE.DoubleSide,
      depthWrite: false // Improve transparency rendering
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Position on sphere surface
    const position = latLngToVector3(cell.lat + gridSize/2, cell.lng + gridSize/2, 1.005);
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

  // Optimized camera movement listener with better throttling
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate < 300) return; // Throttle to max 3 updates per second
      
      lastUpdate = now;
      rafId = requestAnimationFrame(updateVisibleCells);
    };

    if (visible && camera && earth) {
      window.addEventListener('wheel', throttledUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('wheel', throttledUpdate);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [visible, camera, earth]);

  return null; // This is a pure Three.js component, no JSX rendering
};

export default HistoricalWeatherGrid;
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTimeSum = 0;
  private frameTimeCount = 0;
  
  // Adaptive quality settings based on performance
  private settings = {
    targetFPS: 60,
    minFPS: 30,
    adaptiveQuality: true,
    markerLOD: 1.0,
    animationQuality: 1.0,
    renderScale: 1.0
  };

  update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.frameTimeSum += deltaTime;
    this.frameTimeCount++;
    
    // Update FPS every second
    if (this.frameTimeCount >= 60) {
      const avgFrameTime = this.frameTimeSum / this.frameTimeCount;
      this.fps = 1000 / avgFrameTime;
      
      // Adaptive quality adjustment
      if (this.settings.adaptiveQuality) {
        this.adjustQuality();
      }
      
      // Reset counters
      this.frameTimeSum = 0;
      this.frameTimeCount = 0;
    }
    
    this.lastTime = now;
    this.frameCount++;
  }

  private adjustQuality(): void {
    if (this.fps < this.settings.minFPS) {
      // Performance is poor, reduce quality
      this.settings.markerLOD = Math.max(0.3, this.settings.markerLOD - 0.1);
      this.settings.animationQuality = Math.max(0.5, this.settings.animationQuality - 0.1);
      this.settings.renderScale = Math.max(0.7, this.settings.renderScale - 0.05);
    } else if (this.fps > this.settings.targetFPS * 0.9) {
      // Performance is good, can increase quality
      this.settings.markerLOD = Math.min(1.0, this.settings.markerLOD + 0.05);
      this.settings.animationQuality = Math.min(1.0, this.settings.animationQuality + 0.05);
      this.settings.renderScale = Math.min(1.0, this.settings.renderScale + 0.02);
    }
  }

  getFPS(): number {
    return Math.round(this.fps);
  }

  getSettings() {
    return { ...this.settings };
  }

  // Get recommended marker count based on current performance
  getMaxMarkers(): number {
    if (this.fps > 50) return 1000;
    if (this.fps > 30) return 500;
    return 250;
  }

  // Get animation update frequency based on performance
  getAnimationFrequency(): number {
    if (this.fps > 50) return 16; // ~60fps
    if (this.fps > 30) return 33; // ~30fps
    return 50; // ~20fps
  }
}

export const performanceMonitor = new PerformanceMonitor();
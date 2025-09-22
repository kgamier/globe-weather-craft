import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, TrendingUp, CloudRain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface HistoricalWeatherControlsProps {
  visible: boolean;
  onToggle: () => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  selectedCell: GridCell | null;
  onClearSelection: () => void;
}

export const HistoricalWeatherControls: React.FC<HistoricalWeatherControlsProps> = ({
  visible,
  onToggle,
  dateRange,
  onDateRangeChange,
  selectedCell,
  onClearSelection
}) => {
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);

  const handleDateRangeSubmit = () => {
    if (new Date(startDate) <= new Date(endDate)) {
      onDateRangeChange({ start: startDate, end: endDate });
    }
  };

  const getQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const setQuickRange = (days: number) => {
    const range = getQuickDateRange(days);
    setStartDate(range.start);
    setEndDate(range.end);
    onDateRangeChange(range);
  };

  return (
    <Card className="absolute top-4 left-4 w-80 bg-background/95 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4" />
          Historical Weather Grid
          <Badge variant={visible ? "default" : "secondary"} className="ml-auto">
            {visible ? "ON" : "OFF"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={onToggle}
            variant={visible ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            {visible ? "Hide Grid" : "Show Grid"}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Date Range
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-date" className="text-xs">Start</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs">End</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleDateRangeSubmit}
            size="sm"
            className="w-full h-8"
          >
            Update Range
          </Button>

          <div className="flex gap-1 flex-wrap">
            <Button 
              onClick={() => setQuickRange(7)} 
              variant="outline" 
              size="sm"
              className="h-6 px-2 text-xs"
            >
              7d
            </Button>
            <Button 
              onClick={() => setQuickRange(30)} 
              variant="outline" 
              size="sm"
              className="h-6 px-2 text-xs"
            >
              30d
            </Button>
            <Button 
              onClick={() => setQuickRange(90)} 
              variant="outline" 
              size="sm"
              className="h-6 px-2 text-xs"
            >
              90d
            </Button>
            <Button 
              onClick={() => setQuickRange(365)} 
              variant="outline" 
              size="sm"
              className="h-6 px-2 text-xs"
            >
              1yr
            </Button>
          </div>
        </div>

        {selectedCell && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected Region</h4>
              <Button 
                onClick={onClearSelection}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span>
                  {selectedCell.lat.toFixed(1)}°N, {selectedCell.lng.toFixed(1)}°E
                </span>
              </div>
              
              {selectedCell.loading && (
                <div className="text-muted-foreground">Loading historical data...</div>
              )}
              
              {selectedCell.data && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-orange-500" />
                    <span>Avg Temp: {selectedCell.data.avgTemperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-3 h-3 text-blue-500" />
                    <span>Avg Rain: {selectedCell.data.avgPrecipitation.toFixed(1)}mm</span>
                  </div>
                  <div className="text-muted-foreground">
                    {selectedCell.data.dates.length} days of data
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {visible && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🎨 <strong>Color coding:</strong> Blue = Cold, Red = Hot</p>
              <p>🔍 <strong>Zoom in</strong> to see more detailed regions</p>
              <p>🖱️ <strong>Click</strong> any colored region for details</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalWeatherControls;
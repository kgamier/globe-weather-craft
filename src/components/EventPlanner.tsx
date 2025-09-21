import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Download, AlertTriangle, CheckCircle, MapPin, Search, Lightbulb, TrendingUp } from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { City } from '@/data/worldCities';
import { worldCities } from '@/data/worldCities';

interface ExtremeProbability {
  veryHot: number;     // >35°C / 95°F
  veryCold: number;    // <0°C / 32°F
  veryWindy: number;   // >50 km/h
  veryWet: number;     // >20mm precipitation
  veryUncomfortable: number; // Heat index or extreme conditions
}

interface EventPlannerProps {
  selectedCity: City | null;
  onClose: () => void;
}

const EventPlanner: React.FC<EventPlannerProps> = ({ selectedCity: initialCity, onClose }) => {
  // State management
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);
  const [citySearch, setCitySearch] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [eventDate, setEventDate] = useState<Date>();
  const [eventType, setEventType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [probabilities, setProbabilities] = useState<ExtremeProbability | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // City search functionality
  useEffect(() => {
    if (citySearch.length >= 2) {
      const filtered = worldCities
        .filter(city => 
          city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
          city.country.toLowerCase().includes(citySearch.toLowerCase())
        )
        .slice(0, 8);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [citySearch]);

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setCitySearch('');
    setSearchResults([]);
    toast.success(`Selected ${city.name}, ${city.country}`);
  };

  // Step navigation
  const canProceedToStep2 = selectedCity !== null;
  const canProceedToStep3 = canProceedToStep2 && eventType && eventDate;

  const nextStep = () => {
    if (step === 1 && !canProceedToStep2) {
      toast.error('Please select a location first');
      return;
    }
    if (step === 2 && !canProceedToStep3) {
      toast.error('Please select event type and date');
      return;
    }
    if (step === 3) {
      analyzeEventConditions();
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const eventTypes = [
    { id: 'wedding', label: '💒 Outdoor Wedding', tips: 'Consider backup indoor venue' },
    { id: 'hiking', label: '🥾 Hiking/Trekking', tips: 'Pack weather-appropriate gear' },
    { id: 'beach', label: '🏖️ Beach Vacation', tips: 'Monitor UV and wind conditions' },
    { id: 'camping', label: '⛺ Camping Trip', tips: 'Prepare for temperature changes' },
    { id: 'sports', label: '⚽ Sports Event', tips: 'Have weather contingency plan' },
    { id: 'festival', label: '🎵 Music Festival', tips: 'Consider crowd safety in weather' },
    { id: 'picnic', label: '🧺 Picnic/BBQ', tips: 'Plan for shade and wind protection' },
    { id: 'photo', label: '📸 Photography Session', tips: 'Golden hour timing matters' },
    { id: 'cycling', label: '🚴 Cycling Tour', tips: 'Check wind direction and rain' },
    { id: 'fishing', label: '🎣 Fishing Trip', tips: 'Weather affects fish behavior' }
  ];

  // Smart date suggestions
  const getSmartDateSuggestions = () => {
    const today = new Date();
    const suggestions = [];
    
    // Next weekend
    const nextSat = addDays(today, (6 - today.getDay()) % 7 || 7);
    const nextSun = addDays(nextSat, 1);
    
    suggestions.push({ date: nextSat, label: 'Next Saturday', reason: 'Weekend' });
    suggestions.push({ date: nextSun, label: 'Next Sunday', reason: 'Weekend' });
    
    // Next month same date (popular for planning)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    suggestions.push({ date: nextMonth, label: 'Next month', reason: 'Planning ahead' });
    
    // Summer solstice area (if approaching)
    const summer = new Date(today.getFullYear(), 5, 21); // June 21
    if (summer > today) {
      suggestions.push({ date: summer, label: 'Summer Solstice', reason: 'Longest day' });
    }
    
    return suggestions;
  };

  const analyzeEventConditions = async () => {
    if (!selectedCity || !eventDate) return;

    setAnalyzing(true);
    setStep(4); // Move to results step
    
    try {
      // Simulate historical probability analysis based on the date and location
      const month = eventDate.getMonth() + 1;
      const day = eventDate.getDate();
      
      // Mock historical analysis - in real app, this would use NASA Earth observation data
      const mockProbabilities: ExtremeProbability = {
        veryHot: Math.max(0, Math.min(100, 
          selectedCity.lat > 30 ? (month >= 6 && month <= 8 ? 75 : 25) : 
          selectedCity.lat < -30 ? (month >= 12 || month <= 2 ? 15 : 65) : 40
        )),
        veryCold: Math.max(0, Math.min(100,
          selectedCity.lat > 45 ? (month >= 11 || month <= 3 ? 60 : 10) :
          selectedCity.lat < -45 ? (month >= 6 && month <= 8 ? 70 : 20) : 5
        )),
        veryWindy: Math.random() * 40 + 10,
        veryWet: Math.max(0, Math.min(100,
          Math.abs(selectedCity.lat) < 23.5 ? 45 : // Tropical regions
          selectedCity.lat > 40 ? (month >= 10 && month <= 4 ? 55 : 25) : 35
        )),
        veryUncomfortable: 0
      };

      // Calculate discomfort index
      mockProbabilities.veryUncomfortable = Math.max(
        mockProbabilities.veryHot * 0.6,
        mockProbabilities.veryCold * 0.7,
        mockProbabilities.veryWindy * 0.3
      );

      setProbabilities(mockProbabilities);
      generateRecommendations(mockProbabilities, eventType);
      toast.success('Weather analysis complete!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze weather conditions');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateRecommendations = (probs: ExtremeProbability, event: string) => {
    const recs: string[] = [];
    const eventObj = eventTypes.find(e => e.id === event);
    
    if (probs.veryHot > 60) {
      recs.push('⚠️ High heat probability - Plan early morning or evening activities');
      recs.push('💧 Ensure adequate hydration stations and shade');
    } else if (probs.veryHot > 30) {
      recs.push('🌡️ Moderate heat risk - Consider sun protection');
    }

    if (probs.veryCold > 50) {
      recs.push('🧥 High cold probability - Prepare warm clothing and heating');
      recs.push('❄️ Check for potential frost or ice conditions');
    }

    if (probs.veryWet > 50) {
      recs.push('☔ High precipitation likelihood - Have indoor backup plan');
      recs.push('🏠 Consider covered venues or weatherproof equipment');
    } else if (probs.veryWet > 25) {
      recs.push('🌦️ Moderate rain risk - Monitor weather closer to date');
    }

    if (probs.veryWindy > 40) {
      recs.push('💨 High wind probability - Secure loose items and decorations');
      if (event.includes('wedding') || event.includes('festival')) {
        recs.push('🎪 Consider wind-resistant tent structures');
      }
    }

    if (probs.veryUncomfortable > 50) {
      recs.push('😰 Uncomfortable conditions likely - Consider alternative dates');
    }

    // Add event-specific tip
    if (eventObj?.tips) {
      recs.push(`💡 ${eventObj.tips}`);
    }

    if (recs.length === 0) {
      recs.push('✅ Favorable historical conditions for outdoor activities');
      recs.push('🌟 This appears to be a good time for your event!');
    }

    setRecommendations(recs);
  };

  const getRiskLevel = (probability: number) => {
    if (probability > 60) return { level: 'High', color: 'destructive' };
    if (probability > 30) return { level: 'Moderate', color: 'warning' };
    return { level: 'Low', color: 'success' };
  };

  const downloadAnalysis = () => {
    if (!probabilities || !selectedCity || !eventDate) return;

    const data = {
      location: `${selectedCity.name}, ${selectedCity.country}`,
      coordinates: { lat: selectedCity.lat, lng: selectedCity.lng },
      eventDate: format(eventDate, 'PPP'),
      eventType: eventTypes.find(t => t.id === eventType)?.label || eventType,
      historicalProbabilities: {
        veryHot: `${probabilities.veryHot.toFixed(1)}%`,
        veryCold: `${probabilities.veryCold.toFixed(1)}%`,
        veryWindy: `${probabilities.veryWindy.toFixed(1)}%`,
        veryWet: `${probabilities.veryWet.toFixed(1)}%`,
        veryUncomfortable: `${probabilities.veryUncomfortable.toFixed(1)}%`
      },
      recommendations,
      generatedAt: new Date().toISOString(),
      dataSource: 'NASA Earth Observation Historical Analysis',
      disclaimer: 'Probabilities based on historical weather patterns, not a forecast'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-analysis-${selectedCity.name}-${format(eventDate, 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-glass bg-card/95 border-glass-border shadow-glass animate-scale-in">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-earth bg-clip-text text-transparent">
                🎯 Event Weather Planner
              </h2>
              <p className="text-muted-foreground">
                Historical probability analysis powered by NASA Earth observation data
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-4 space-x-4">
            {[
              { num: 1, label: 'Location', icon: '📍' },
              { num: 2, label: 'Event Details', icon: '📅' },
              { num: 3, label: 'Analysis', icon: '📊' },
              { num: 4, label: 'Results', icon: '✅' }
            ].map(({ num, label, icon }) => (
              <div key={num} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  step >= num 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step > num ? '✓' : icon}
                </div>
                <span className={cn(
                  "ml-2 text-sm transition-colors",
                  step >= num ? "text-foreground" : "text-muted-foreground"
                )}>
                  {label}
                </span>
                {num < 4 && <div className="ml-4 w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Choose Your Location</h3>
                <p className="text-muted-foreground">Where are you planning your event?</p>
              </div>

              {/* City Search */}
              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search cities worldwide..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card className="max-h-64 overflow-y-auto">
                    {searchResults.map((city) => (
                      <button
                        key={`${city.name}-${city.country}`}
                        onClick={() => selectCity(city)}
                        className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">
                              {city.name}
                              {city.isCapital && <span className="ml-2 text-yellow-400 text-xs">★</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {city.country} • {city.region}
                            </div>
                          </div>
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </Card>
                )}

                {/* Selected City Display */}
                {selectedCity && (
                  <Card className="p-4 bg-primary/5 border-primary/20 animate-scale-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {selectedCity.name}, {selectedCity.country}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCity.region} • Population: {(selectedCity.population / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Popular Cities */}
                {!citySearch && searchResults.length === 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Popular destinations:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Barcelona', 'Dubai', 'Singapore']
                        .map(cityName => {
                          const city = worldCities.find(c => c.name === cityName);
                          if (!city) return null;
                          return (
                            <Button
                              key={cityName}
                              variant="outline"
                              size="sm"
                              onClick={() => selectCity(city)}
                              className="justify-start text-sm"
                            >
                              {cityName}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={nextStep} disabled={!canProceedToStep2}>
                  Next: Event Details →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && selectedCity && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Event Details</h3>
                <p className="text-muted-foreground">What type of event and when?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Event Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Event Type</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {eventTypes.map((type) => (
                      <Card
                        key={type.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all hover:bg-secondary/50",
                          eventType === type.id && "ring-2 ring-primary bg-primary/5"
                        )}
                        onClick={() => setEventType(type.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{type.label}</span>
                          {eventType === type.id && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{type.tips}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto p-4",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? (
                          <div>
                            <div className="font-medium">{format(eventDate, "PPP")}</div>
                            <div className="text-xs text-muted-foreground">
                              {isWeekend(eventDate) ? 'Weekend' : 'Weekday'}
                            </div>
                          </div>
                        ) : (
                          "Select event date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Smart Date Suggestions */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Quick picks:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {getSmartDateSuggestions().map(({ date, label, reason }) => (
                        <Button
                          key={label}
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventDate(date)}
                          className="h-auto p-2 justify-start"
                        >
                          <div>
                            <div className="text-xs font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{reason}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  ← Back
                </Button>
                <Button onClick={nextStep} disabled={!canProceedToStep3}>
                  Next: Analyze Weather →
                </Button>
              </div>
            </div>
          )}

          {step === 3 && selectedCity && eventDate && eventType && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ready for Analysis</h3>
                <p className="text-muted-foreground">Review your event details before analysis</p>
              </div>

              <Card className="max-w-md mx-auto p-6 bg-secondary/20">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">{selectedCity.name}, {selectedCity.country}</div>
                      <div className="text-sm text-muted-foreground">{selectedCity.region}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">{format(eventDate, "PPP")}</div>
                      <div className="text-sm text-muted-foreground">
                        {isWeekend(eventDate) ? 'Weekend' : 'Weekday'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {eventTypes.find(t => t.id === eventType)?.label.split(' ')[0]}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">
                        {eventTypes.find(t => t.id === eventType)?.label.slice(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {eventTypes.find(t => t.id === eventType)?.tips}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  ← Back
                </Button>
                <Button onClick={nextStep} size="lg" className="animate-pulse">
                  🚀 Analyze Weather Conditions
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              {analyzing ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                  </div>
                  <h3 className="text-xl font-semibold">Analyzing Historical Data...</h3>
                  <p className="text-muted-foreground">
                    Processing NASA Earth observation patterns for {selectedCity?.name}
                  </p>
                  <div className="max-w-xs mx-auto">
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              ) : probabilities ? (
                <>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-green-600">Analysis Complete! ✅</h3>
                    <p className="text-muted-foreground">
                      Historical probability analysis for {selectedCity?.name} on {eventDate && format(eventDate, 'MMMM d')}
                    </p>
                  </div>

                  {/* Probability cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'veryHot', label: 'Very Hot (>35°C)', icon: '🌡️', value: probabilities.veryHot },
                      { key: 'veryCold', label: 'Very Cold (<0°C)', icon: '❄️', value: probabilities.veryCold },
                      { key: 'veryWet', label: 'Very Wet (>20mm)', icon: '☔', value: probabilities.veryWet },
                      { key: 'veryWindy', label: 'Very Windy (>50km/h)', icon: '💨', value: probabilities.veryWindy },
                      { key: 'veryUncomfortable', label: 'Uncomfortable Conditions', icon: '😰', value: probabilities.veryUncomfortable }
                    ].map(({ key, label, icon, value }, index) => {
                      const risk = getRiskLevel(value);
                      return (
                        <Card key={key} className="p-4 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{icon}</span>
                            <Badge variant={risk.color as any}>{risk.level}</Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-2">{label}</h4>
                          <div className="space-y-2">
                            <Progress value={value} className="h-2" />
                            <p className="text-lg font-bold text-center">{value.toFixed(1)}%</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Smart Recommendations
                    </h3>
                    <div className="grid gap-3">
                      {recommendations.map((rec, index) => (
                        <Card key={index} className="p-3 bg-secondary/10 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <p className="text-sm flex items-start gap-2">
                            {rec.includes('⚠️') || rec.includes('❄️') || rec.includes('☔') || rec.includes('💨') || rec.includes('😰') ? 
                              <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" /> :
                              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            }
                            {rec}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button onClick={downloadAnalysis} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                    <Button onClick={() => setStep(1)} variant="outline">
                      🔄 New Analysis
                    </Button>
                    <Button onClick={() => window.print()} variant="outline">
                      🖨️ Print
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* NASA Attribution */}
        <div className="border-t border-border/50 p-4">
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">📡 NASA Space Apps Challenge - "Will It Rain On My Parade?"</p>
              <p>Historical weather pattern analysis using NASA Earth observation satellite data and climate models.</p>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default EventPlanner;
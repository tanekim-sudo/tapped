import React, { useState, useEffect } from 'react';

interface LocationPickerProps {
  value: string;
  latitude?: number;
  longitude?: number;
  onChange: (location: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  latitude,
  longitude,
  onChange,
  placeholder = "e.g., San Francisco, CA or New York, NY"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Simple geocoding using Nominatim (OpenStreetMap's free geocoding service)
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setSuggestions([]);
      return;
    }

    setIsGeocoding(true);
    try {
      // Use Nominatim for free geocoding (rate limited but fine for user input)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`,
        {
          headers: {
            'User-Agent': 'Tapped App' // Required by Nominatim
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const addresses = data.map((item: any) => item.display_name);
        setSuggestions(addresses);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.warn('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue, latitude, longitude);
    
    // Debounce geocoding
    if (newValue.length > 3) {
      const timer = setTimeout(() => {
        geocodeAddress(newValue);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
    onChange(suggestion, latitude, longitude);
    
    // Get coordinates for the selected address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(suggestion)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Tapped App'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          onChange(suggestion, lat, lng);
        }
      }
    } catch (error) {
      console.warn('Failed to get coordinates:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              {
                headers: {
                  'User-Agent': 'Tapped App'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setInputValue(address);
              onChange(address, lat, lng);
            } else {
              const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setInputValue(address);
              onChange(address, lat, lng);
            }
          } catch (error) {
            const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setInputValue(address);
            onChange(address, lat, lng);
          } finally {
            setIsGeocoding(false);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsGeocoding(false);
        }
      );
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 p-3 md:p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-medium"
        />
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isGeocoding}
          className="btn-brutal !bg-gray-800 !text-white px-4 text-xs md:text-sm whitespace-nowrap disabled:opacity-50"
          title="Use current location"
        >
          {isGeocoding ? '...' : '📍'}
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 z-20 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {latitude && longitude && (
        <p className="text-[8px] text-gray-400 mt-1">
          Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;

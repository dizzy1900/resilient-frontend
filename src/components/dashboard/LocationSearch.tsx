import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useMapboxGeocoder, GeocoderResult } from "@/hooks/useMapboxGeocoder";

interface LocationSearchProps {
  latitude: number | null;
  longitude: number | null;
  hasPolygon: boolean;
  locationName: string | null;
  accentColor: string;
  onSelectLocation: (lat: number, lng: number) => void;
}

export function LocationSearch({
  latitude,
  longitude,
  hasPolygon,
  locationName,
  accentColor,
  onSelectLocation,
}: LocationSearchProps) {
  const { suggestions, isSearching, forwardGeocode, clearSuggestions } =
    useMapboxGeocoder();
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) return;
    if (hasPolygon) {
      setInputValue("CUSTOM POLYGON DEFINED");
    } else if (locationName) {
      setInputValue(locationName.toUpperCase());
    } else if (latitude !== null && longitude !== null) {
      setInputValue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } else {
      setInputValue("");
    }
  }, [latitude, longitude, hasPolygon, locationName, isFocused]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      forwardGeocode(val);
      setShowDropdown(true);
    },
    [forwardGeocode]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (latitude !== null && longitude !== null) {
      setInputValue("");
    }
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  }, [latitude, longitude, suggestions.length]);

  const handleSelect = useCallback(
    (result: GeocoderResult) => {
      setInputValue(result.placeName.toUpperCase());
      setShowDropdown(false);
      setIsFocused(false);
      clearSuggestions();
      onSelectLocation(result.lat, result.lng);
    },
    [clearSuggestions, onSelectLocation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setIsFocused(false);
        (e.target as HTMLInputElement).blur();
      }
    },
    []
  );

  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="shrink-0 px-4 py-3 cb-divider" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-1">
        <span className="cb-label">Location</span>
        <div className="flex items-center gap-1.5">
          {isSearching && (
            <Loader2
              style={{ width: 10, height: 10, color: "var(--cb-secondary)" }}
              className="animate-spin"
            />
          )}
          {hasCoordinates && (
            <MapPin style={{ width: 10, height: 10, color: accentColor }} />
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search address or click map"
          className="w-full bg-transparent border-b pb-1 font-mono text-[10px] uppercase tracking-widest focus:outline-none"
          style={{
            borderColor: isFocused
              ? accentColor
              : "var(--cb-border)",
            color: hasPolygon
              ? "#10b981"
              : hasCoordinates
                ? "var(--cb-text)"
                : "var(--cb-secondary)",
            transition: "border-color 0.15s",
          }}
        />

        {showDropdown && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto"
            style={{
              backgroundColor: "var(--cb-bg)",
              border: "1px solid var(--cb-border)",
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 transition-colors"
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                  color: "var(--cb-text)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    "var(--cb-surface)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
              >
                {s.placeName}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasCoordinates && !isFocused && (
        <div
          className="mt-1.5 font-mono"
          style={{
            fontSize: 9,
            color: "var(--cb-secondary)",
            letterSpacing: "0.06em",
          }}
        >
          {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
        </div>
      )}
    </div>
  );
}

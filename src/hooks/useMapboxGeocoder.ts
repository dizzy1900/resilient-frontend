import { useState, useRef, useCallback } from "react";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZGF2aWRpemkiLCJhIjoiY21rd2dzeHN6MDFoYzNkcXYxOHZ0YXRuNCJ9.P_g5wstTHNzglNEQfHIoBg";

export interface GeocoderResult {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
}

export function useMapboxGeocoder() {
  const [suggestions, setSuggestions] = useState<GeocoderResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const forwardGeocode = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,locality,address,poi,neighborhood,district,region,country`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Geocoding request failed");
        const data = await res.json();

        const results: GeocoderResult[] = (data.features || []).map(
          (f: any) => ({
            id: f.id,
            placeName: f.place_name,
            lat: f.center[1],
            lng: f.center[0],
          })
        );
        setSuggestions(results);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=place,locality,region,country`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;
        return feature.place_name ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
    suggestions,
    isSearching,
    forwardGeocode,
    reverseGeocode,
    clearSuggestions,
  };
}

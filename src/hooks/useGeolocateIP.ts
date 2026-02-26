import { useState, useEffect } from 'react';

interface GeolocateResult {
  latitude: number;
  longitude: number;
  city: string | null;
  loading: boolean;
}

const DEFAULTS = { latitude: -0.0236, longitude: 37.9062, city: null };

export function useGeolocateIP(): GeolocateResult {
  const [result, setResult] = useState<GeolocateResult>({ ...DEFAULTS, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('ipapi failed');
        return res.json();
      })
      .then((data) => {
        if (data.latitude && data.longitude) {
          setResult({
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city ?? data.country_name ?? null,
            loading: false,
          });
        } else {
          setResult({ ...DEFAULTS, loading: false });
        }
      })
      .catch(() => {
        setResult({ ...DEFAULTS, loading: false });
      });

    return () => controller.abort();
  }, []);

  return result;
}

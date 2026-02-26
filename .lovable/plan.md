

## Plan: Auto-detect user location on first load

**Approach:** Use a free IP geolocation API (e.g., `https://ipapi.co/json/`) on app startup to get the user's approximate coordinates, then set the map's initial `viewState` to that location. No API key required.

### Steps

1. **Create a hook `src/hooks/useGeolocateIP.ts`**
   - On mount, fetch `https://ipapi.co/json/` (free, no key, returns `{ latitude, longitude, city, country_name }`)
   - Return `{ latitude, longitude, city, loading }` with fallback to current defaults (Kenya: 37.9, -0.02) if the request fails
   - Run only once via a `useEffect` with empty deps

2. **Update `src/pages/Index.tsx`**
   - Import and call `useGeolocateIP()`
   - In a `useEffect` that watches the hook's result, update `viewState` with the detected coordinates and set zoom to ~10 (city level) instead of the default ~3
   - Also optionally run `reverseGeocode` on the detected coords to populate `locationName` in the sidebar
   - Guard with a `hasGeolocated` ref so it only fires once

### Notes
- `ipapi.co/json` is free for up to 1,000 requests/day — sufficient for a demo/internal tool
- Falls back silently to the existing Kenya default if blocked or errored
- No backend changes needed


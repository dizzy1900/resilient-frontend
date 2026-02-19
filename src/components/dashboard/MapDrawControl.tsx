import { useEffect, useRef, useCallback } from 'react';

export interface DrawnPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface MapDrawControlProps {
  map: any;
  enabled: boolean;
  onPolygonCreated: (polygon: DrawnPolygon) => void;
  onPolygonDeleted: () => void;
}

const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': '#f59e0b', 'fill-outline-color': '#f59e0b', 'fill-opacity': 0.12 },
  },
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: { 'fill-color': '#f59e0b', 'fill-outline-color': '#f59e0b', 'fill-opacity': 0.18 },
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 3, 'circle-color': '#f59e0b' },
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#f59e0b', 'line-dasharray': [2, 2], 'line-width': 1.5 },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#f59e0b', 'line-width': 2 },
  },
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#f59e0b', 'line-dasharray': [2, 2], 'line-width': 1.5 },
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#f59e0b', 'line-width': 2 },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 5, 'circle-color': '#0a0a0a' },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-inactive',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 3.5, 'circle-color': '#f59e0b' },
  },
  {
    id: 'gl-draw-point-point-stroke-inactive',
    type: 'circle',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 5, 'circle-opacity': 1, 'circle-color': '#0a0a0a' },
  },
  {
    id: 'gl-draw-point-inactive',
    type: 'circle',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 3, 'circle-color': '#f59e0b' },
  },
  {
    id: 'gl-draw-point-stroke-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
    paint: { 'circle-radius': 7, 'circle-color': '#0a0a0a' },
  },
  {
    id: 'gl-draw-point-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['==', 'active', 'true']],
    paint: { 'circle-radius': 5, 'circle-color': '#f59e0b' },
  },
];

export function MapDrawControl({ map, enabled, onPolygonCreated, onPolygonDeleted }: MapDrawControlProps) {
  const drawRef = useRef<any>(null);
  const mountedRef = useRef(false);

  const handleCreate = useCallback((e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry?.type === 'Polygon') {
        onPolygonCreated(feature.geometry as DrawnPolygon);
      }
    }
  }, [onPolygonCreated]);

  const handleUpdate = useCallback((e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry?.type === 'Polygon') {
        onPolygonCreated(feature.geometry as DrawnPolygon);
      }
    }
  }, [onPolygonCreated]);

  const handleDelete = useCallback(() => {
    onPolygonDeleted();
  }, [onPolygonDeleted]);

  useEffect(() => {
    if (!map || mountedRef.current) return;

    const init = async () => {
      try {
        await import('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css');
        const MapboxDraw = (await import('@mapbox/mapbox-gl-draw')).default;

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true,
          },
          defaultMode: 'simple_select',
          styles: DRAW_STYLES,
        });

        map.addControl(draw, 'top-right');
        drawRef.current = draw;
        mountedRef.current = true;

        map.on('draw.create', handleCreate);
        map.on('draw.update', handleUpdate);
        map.on('draw.delete', handleDelete);
      } catch (err) {
        console.error('Failed to load MapboxDraw:', err);
      }
    };

    init();

    return () => {
      if (drawRef.current && map) {
        map.off('draw.create', handleCreate);
        map.off('draw.update', handleUpdate);
        map.off('draw.delete', handleDelete);
        try {
          map.removeControl(drawRef.current);
        } catch {
          // map may already be removed
        }
        drawRef.current = null;
        mountedRef.current = false;
      }
    };
  }, [map, handleCreate, handleUpdate, handleDelete]);

  useEffect(() => {
    if (!drawRef.current) return;
    if (!enabled) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
  }, [enabled]);

  return null;
}

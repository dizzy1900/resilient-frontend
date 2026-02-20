import { useEffect, useRef } from 'react';

export interface DrawnPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface MapDrawControlProps {
  map: any;
  enabled: boolean;
  onPolygonCreated: (polygon: DrawnPolygon) => void;
  onPolygonDeleted: () => void;
  onDrawModeChange?: (isDrawing: boolean) => void;
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

export function MapDrawControl({ map, enabled, onPolygonCreated, onPolygonDeleted, onDrawModeChange }: MapDrawControlProps) {
  const drawRef = useRef<any>(null);
  const callbacksRef = useRef({ onPolygonCreated, onPolygonDeleted, onDrawModeChange });

  callbacksRef.current = { onPolygonCreated, onPolygonDeleted, onDrawModeChange };

  useEffect(() => {
    if (!map) return;
    if (drawRef.current) return;

    let cancelled = false;

    const init = async () => {
      try {
        await import('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css');
        const mod = await import('@mapbox/mapbox-gl-draw');
        const MapboxDraw = (mod as any).default?.default ?? (mod as any).default ?? mod;

        if (cancelled) return;

        const draw = new (MapboxDraw as any)({
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

        const onCreate = (e: any) => {
          const feature = e.features?.[0];
          if (feature?.geometry?.type === 'Polygon') {
            callbacksRef.current.onPolygonCreated(feature.geometry as DrawnPolygon);
          }
        };

        const onUpdate = (e: any) => {
          const feature = e.features?.[0];
          if (feature?.geometry?.type === 'Polygon') {
            callbacksRef.current.onPolygonCreated(feature.geometry as DrawnPolygon);
          }
        };

        const onDelete = () => {
          callbacksRef.current.onPolygonDeleted();
        };

        const onModeChange = (e: any) => {
          const mode = e.mode;
          const isDrawing = mode === 'draw_polygon' || mode === 'draw_line_string' || mode === 'draw_point';
          callbacksRef.current.onDrawModeChange?.(isDrawing);
        };

        map.on('draw.create', onCreate);
        map.on('draw.update', onUpdate);
        map.on('draw.delete', onDelete);
        map.on('draw.modechange', onModeChange);

        (draw as any).__listeners = { onCreate, onUpdate, onDelete, onModeChange };
      } catch (err) {
        console.error('Failed to load MapboxDraw:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      const draw = drawRef.current;
      if (draw && map) {
        const listeners = (draw as any).__listeners;
        if (listeners) {
          map.off('draw.create', listeners.onCreate);
          map.off('draw.update', listeners.onUpdate);
          map.off('draw.delete', listeners.onDelete);
          map.off('draw.modechange', listeners.onModeChange);
        }
        try {
          map.removeControl(draw);
        } catch {
          // map may already be destroyed
        }
        drawRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!drawRef.current) return;
    if (!enabled) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
  }, [enabled]);

  return null;
}

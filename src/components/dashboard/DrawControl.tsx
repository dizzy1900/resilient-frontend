import { useControl } from 'react-map-gl';
import type { ControlPosition } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export interface DrawnPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface DrawControlProps {
  position?: ControlPosition;
  displayControlsDefault?: boolean;
  controls?: {
    polygon?: boolean;
    trash?: boolean;
    point?: boolean;
    line_string?: boolean;
    combine_features?: boolean;
    uncombine_features?: boolean;
  };
  defaultMode?: string;
  onCreate?: (evt: { features: GeoJSON.Feature[] }) => void;
  onUpdate?: (evt: { features: GeoJSON.Feature[] }) => void;
  onDelete?: (evt: { features: GeoJSON.Feature[] }) => void;
  onModeChange?: (evt: { mode: string }) => void;
}

const DRAW_STYLES: object[] = [
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

export default function DrawControl(props: DrawControlProps) {
  useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        displayControlsDefault: props.displayControlsDefault ?? false,
        controls: props.controls ?? { polygon: true, trash: true },
        defaultMode: props.defaultMode ?? 'simple_select',
        styles: DRAW_STYLES as any,
      }),
    ({ map }) => {
      map.on('draw.create', props.onCreate as any);
      map.on('draw.update', props.onUpdate as any);
      map.on('draw.delete', props.onDelete as any);
      if (props.onModeChange) {
        map.on('draw.modechange', props.onModeChange as any);
      }
    },
    ({ map }) => {
      map.off('draw.create', props.onCreate as any);
      map.off('draw.update', props.onUpdate as any);
      map.off('draw.delete', props.onDelete as any);
      if (props.onModeChange) {
        map.off('draw.modechange', props.onModeChange as any);
      }
    },
    { position: props.position ?? 'top-right' },
  );

  return null;
}

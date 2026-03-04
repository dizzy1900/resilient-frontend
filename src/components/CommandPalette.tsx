import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Terminal, ArrowRight, Layers, Navigation, ToggleRight, Zap } from 'lucide-react';
import { DashboardMode } from '@/components/dashboard/ModeSelector';

/** Simple coordinate dictionary for key countries / regions. */
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  kenya: { lat: -1.2921, lng: 36.8219 },
  brazil: { lat: -23.5505, lng: -46.6333 },
  usa: { lat: 40.7128, lng: -74.006 },
  'new york': { lat: 40.7128, lng: -74.006 },
  india: { lat: 20.59, lng: 78.96 },
  nigeria: { lat: 9.08, lng: 7.49 },
  ethiopia: { lat: 9.15, lng: 40.49 },
  indonesia: { lat: -0.79, lng: 113.92 },
  china: { lat: 35.86, lng: 104.20 },
  australia: { lat: -25.27, lng: 133.78 },
  mexico: { lat: 23.63, lng: -102.55 },
  colombia: { lat: 4.57, lng: -74.30 },
  tanzania: { lat: -6.37, lng: 34.89 },
  south_africa: { lat: -30.56, lng: 22.94 },
  'south africa': { lat: -30.56, lng: 22.94 },
  vietnam: { lat: 14.06, lng: 108.28 },
  thailand: { lat: 15.87, lng: 100.99 },
  philippines: { lat: 12.88, lng: 121.77 },
  bangladesh: { lat: 23.68, lng: 90.36 },
  egypt: { lat: 26.82, lng: 30.80 },
  ghana: { lat: 7.95, lng: -1.02 },
  argentina: { lat: -38.42, lng: -63.62 },
};

/** Regex to parse: /agri compare <crop1> vs <crop2> in <location> <year> */
const AGRI_COMPARE_RE = /^\/agri\s+compare\s+(\w+)\s+vs\s+(\w+)\s+in\s+(.+?)\s+(\d{4})$/i;

interface AgriComparePayload {
  crop1: string;
  crop2: string;
  location: string;
  coords: { lat: number; lng: number };
  year: number;
}

export interface CommandPaletteProps {
  onChangeMode: (mode: DashboardMode) => void;
  onToggleTwin: () => void;
  currentMode: DashboardMode;
  isSplitMode: boolean;
  /** Callback for the advanced /agri compare command. Fires all state updates + simulate. */
  onAgriCompare?: (payload: AgriComparePayload) => void;
}

interface CommandItem {
  id: string;
  label: string;
  group: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette = ({ onChangeMode, onToggleTwin, currentMode, isSplitMode, onAgriCompare }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: 'goto-agri', label: 'Go to Agriculture', group: 'Navigation', keywords: ['/goto agri', 'agriculture', 'crop'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('agriculture') },
    { id: 'goto-coastal', label: 'Go to Coastal', group: 'Navigation', keywords: ['/goto coastal', 'coastal', 'sea'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('coastal') },
    { id: 'goto-flood', label: 'Go to Flood', group: 'Navigation', keywords: ['/goto flood', 'flood', 'rain'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('flood') },
    { id: 'goto-health', label: 'Go to Health', group: 'Navigation', keywords: ['/goto health', 'health', 'heat'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('health') },
    { id: 'goto-finance', label: 'Go to Finance', group: 'Navigation', keywords: ['/goto finance', 'finance', 'cba'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('finance') },
    { id: 'goto-portfolio', label: 'Go to Portfolio', group: 'Navigation', keywords: ['/goto portfolio', 'portfolio', 'batch'], icon: <Navigation className="w-3.5 h-3.5" />, action: () => onChangeMode('portfolio') },
    { id: 'toggle-twin', label: `${isSplitMode ? 'Disable' : 'Enable'} Digital Twin`, group: 'View Modes', keywords: ['/toggle twin', 'digital twin', 'split', 'compare'], icon: <ToggleRight className="w-3.5 h-3.5" />, action: () => onToggleTwin() },
    { id: 'agri-compare-hint', label: '/agri compare [crop1] vs [crop2] in [location] [year]', group: 'Power Commands', keywords: ['/agri compare', 'compare crops', 'digital twin agri'], icon: <Zap className="w-3.5 h-3.5" />, action: () => {} },
  ];

  /** Try to parse and execute an advanced /agri compare command. Returns true if matched. */
  const tryAgriCompare = useCallback((input: string): boolean => {
    const match = input.trim().match(AGRI_COMPARE_RE);
    if (!match) return false;

    const [, crop1Raw, crop2Raw, locationRaw, yearRaw] = match;
    const locationKey = locationRaw.trim().toLowerCase();
    const coords = LOCATION_COORDS[locationKey];

    if (!coords) {
      // Unknown location — don't handle, let it fall through
      return false;
    }

    const crop1 = crop1Raw.charAt(0).toUpperCase() + crop1Raw.slice(1).toLowerCase();
    const crop2 = crop2Raw.charAt(0).toUpperCase() + crop2Raw.slice(1).toLowerCase();
    const year = parseInt(yearRaw, 10);

    if (onAgriCompare) {
      onAgriCompare({ crop1, crop2, location: locationKey, coords, year });
    }

    return true;
  }, [onAgriCompare]);

  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q));
      })
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const execute = useCallback((cmd: CommandItem) => {
    cmd.action();
    setOpen(false);
    setQuery('');
  }, []);

  /** Master execute: first try advanced parsers, then fall back to selected command. */
  const executeInput = useCallback(() => {
    const trimmed = query.trim();
    // Try advanced command parsers first
    if (trimmed.startsWith('/agri compare') && tryAgriCompare(trimmed)) {
      setOpen(false);
      setQuery('');
      return;
    }
    // Fall back to selected command from list
    if (flatFiltered[selectedIndex]) {
      execute(flatFiltered[selectedIndex]);
    }
  }, [query, tryAgriCompare, flatFiltered, selectedIndex, execute]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Autofocus input
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeInput();
    }
  };

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Show live parse feedback for /agri compare
  const agriMatch = query.trim().match(AGRI_COMPARE_RE);
  const isPartialAgri = query.trim().toLowerCase().startsWith('/agri compare') && !agriMatch;

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]" onClick={() => { setOpen(false); setQuery(''); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-[560px] border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 border-b border-white/10">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type /goto agri or /agri compare maize vs wheat in kenya 2040'
            className="w-full h-12 bg-transparent text-sm text-white/90 font-mono placeholder:text-white/25 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-white/30 border border-white/10 bg-white/5">
            ESC
          </kbd>
        </div>

        {/* Live parse feedback for /agri compare */}
        {agriMatch && (
          <div className="px-4 py-2 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">
              ✓ Parsed: <span className="text-white/80">{agriMatch[1]}</span> vs <span className="text-white/80">{agriMatch[2]}</span> in <span className="text-white/80">{agriMatch[3]}</span> @ <span className="text-white/80">{agriMatch[4]}</span>
              {LOCATION_COORDS[agriMatch[3].trim().toLowerCase()] ? '' : <span className="text-amber-400 ml-2">⚠ Unknown location</span>}
            </span>
          </div>
        )}
        {isPartialAgri && !agriMatch && (
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <span className="text-[10px] font-mono text-white/30">
              Format: /agri compare [crop1] vs [crop2] in [location] [year]
            </span>
          </div>
        )}

        {/* Command list */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-white/30 font-mono uppercase tracking-wider">
              No matching commands
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                {group}
              </div>
              {items.map(cmd => {
                itemIndex++;
                const idx = itemIndex;
                const isActive = idx === selectedIndex;
                const isCurrent = cmd.id === `goto-${currentMode}`;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-none ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <span className="shrink-0 opacity-60">{cmd.icon}</span>
                    <span className="flex-1 text-sm font-mono">{cmd.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 border border-emerald-400/20 px-1.5 py-0.5">
                        ACTIVE
                      </span>
                    )}
                    {isActive && <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10 text-[10px] font-mono text-white/20 uppercase tracking-wider">
          <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> Command Palette</span>
          <span className="ml-auto flex items-center gap-2">
            <kbd className="px-1 border border-white/10 bg-white/5">↑↓</kbd> navigate
            <kbd className="px-1 border border-white/10 bg-white/5">↵</kbd> select
          </span>
        </div>
      </div>
    </div>
  );
};

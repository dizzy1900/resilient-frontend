import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Terminal, ArrowRight, Layers, Navigation, ToggleRight } from 'lucide-react';
import { DashboardMode } from '@/components/dashboard/ModeSelector';

interface CommandPaletteProps {
  onChangeMode: (mode: DashboardMode) => void;
  onToggleTwin: () => void;
  currentMode: DashboardMode;
  isSplitMode: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  group: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette = ({ onChangeMode, onToggleTwin, currentMode, isSplitMode }: CommandPaletteProps) => {
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
  ];

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
      if (flatFiltered[selectedIndex]) execute(flatFiltered[selectedIndex]);
    }
  };

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

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
            placeholder='Type a command... (e.g., /goto agri, /toggle twin)'
            className="w-full h-12 bg-transparent text-sm text-white/90 font-mono placeholder:text-white/25 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-white/30 border border-white/10 bg-white/5">
            ESC
          </kbd>
        </div>

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

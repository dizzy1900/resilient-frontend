interface DigitalTwinToggleProps {
  isSplitMode: boolean;
  onToggle: () => void;
  hasSecondaryPanel?: boolean;
}

export function DigitalTwinToggle({ isSplitMode, onToggle, hasSecondaryPanel = false }: DigitalTwinToggleProps) {
  return (
    <div
      className="hidden md:flex absolute top-4 z-30"
      style={{
        left: hasSecondaryPanel ? 'calc(50% + 240px)' : '50%',
        transform: 'translateX(-50%)',
        transition: 'left 0.15s ease',
      }}
    >
      <button
        onClick={onToggle}
        className="flex items-stretch overflow-hidden select-none"
        style={{
          border: "1px solid var(--cb-border)",
          fontFamily: "'Inter', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
        }}
      >
        <span
          className="px-5 py-2.5"
          style={{
            backgroundColor: !isSplitMode ? "var(--cb-bg)" : "transparent",
            color: !isSplitMode ? "var(--cb-text)" : "var(--cb-secondary)",
            borderRight: "1px solid var(--cb-border)",
          }}
        >
          Single View
        </span>
        <span
          className="px-5 py-2.5"
          style={{
            backgroundColor: isSplitMode ? "rgba(16, 185, 129, 0.12)" : "transparent",
            color: isSplitMode ? "#10b981" : "var(--cb-secondary)",
          }}
        >
          Digital Twin
        </span>
      </button>
    </div>
  );
}

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      className="flex"
      style={{ border: '1px solid var(--cb-border)' }}
    >
      {options.map((option, i) => {
        const isActive = option.value === value;
        const isLast = i === options.length - 1;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex-1 py-1.5 px-2 transition-colors duration-100 font-mono uppercase tracking-widest text-[10px] font-medium"
            style={{
              backgroundColor: isActive ? 'var(--cb-text)' : 'transparent',
              color: isActive ? 'var(--cb-bg)' : 'var(--cb-secondary)',
              borderRight: isLast ? 'none' : '1px solid var(--cb-border)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cb-text)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--cb-surface)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cb-secondary)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import { Wheat, Waves, Droplets } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type DashboardMode = 'agriculture' | 'coastal' | 'flood';

interface ModeSelectorProps {
  value: DashboardMode;
  onChange: (value: DashboardMode) => void;
}

export const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DashboardMode)} className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-12 bg-secondary border border-border/50">
        <TabsTrigger 
          value="agriculture" 
          className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2"
        >
          <Wheat className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Agriculture</span>
        </TabsTrigger>
        <TabsTrigger 
          value="coastal" 
          className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2"
        >
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Coastal</span>
        </TabsTrigger>
        <TabsTrigger 
          value="flood" 
          className="flex items-center gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Flood Risk</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

import { Wheat, Waves } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type DashboardMode = 'agriculture' | 'coastal';

interface ModeSelectorProps {
  value: DashboardMode;
  onChange: (value: DashboardMode) => void;
}

export const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DashboardMode)} className="w-full">
      <TabsList className="w-full grid grid-cols-2 h-12 bg-secondary border border-border/50">
        <TabsTrigger 
          value="agriculture" 
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Wheat className="w-4 h-4" />
          <span className="text-xs font-medium">Agriculture</span>
        </TabsTrigger>
        <TabsTrigger 
          value="coastal" 
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Waves className="w-4 h-4" />
          <span className="text-xs font-medium">Coastal</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

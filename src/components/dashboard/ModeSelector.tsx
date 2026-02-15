import { Wheat, Waves, Droplets, Briefcase, HeartPulse, Landmark } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type DashboardMode = 'agriculture' | 'coastal' | 'flood' | 'health' | 'finance' | 'portfolio';

interface ModeSelectorProps {
  value: DashboardMode;
  onChange: (value: DashboardMode) => void;
}

export const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DashboardMode)} className="w-full">
      <TabsList className="w-full grid grid-cols-6 h-12 bg-secondary border border-border/50">
        <TabsTrigger 
          value="agriculture" 
          className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1.5"
        >
          <Wheat className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Agriculture</span>
        </TabsTrigger>
        <TabsTrigger 
          value="coastal" 
          className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1.5"
        >
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Coastal</span>
        </TabsTrigger>
        <TabsTrigger 
          value="flood" 
          className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1.5"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Flood</span>
        </TabsTrigger>
        <TabsTrigger 
          value="health" 
          className="flex items-center gap-1 data-[state=active]:bg-rose-600 data-[state=active]:text-white px-1.5"
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Health</span>
        </TabsTrigger>
        <TabsTrigger 
          value="finance" 
          className="flex items-center gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white px-1.5"
        >
          <Landmark className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Finance</span>
        </TabsTrigger>
        <TabsTrigger 
          value="portfolio" 
          className="flex items-center gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-1.5"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span className="text-[9px] font-medium hidden sm:inline">Portfolio</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

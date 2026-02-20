import { useState, useEffect } from 'react';
import { Shield, DollarSign, Loader2, ArrowUpFromLine, Droplets } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface DefensiveProjectParams {
  type: 'sea_wall' | 'drainage';
  capex: number;
  opex: number;
  heightIncrease?: number; // meters, for sea wall
  capacityUpgrade?: number; // cm, for drainage
}

interface DefensiveInfrastructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDefineProject: (params: DefensiveProjectParams) => void;
  projectType: 'sea_wall' | 'drainage';
  isSimulating?: boolean;
}

const projectDefaults = {
  sea_wall: { capex: 500000, opex: 10000, title: 'Sea Wall Enhancement', icon: ArrowUpFromLine },
  drainage: { capex: 500000, opex: 10000, title: 'Drainage Upgrade', icon: Droplets },
};

export const DefensiveInfrastructureModal = ({
  open,
  onOpenChange,
  onDefineProject,
  projectType,
  isSimulating = false,
}: DefensiveInfrastructureModalProps) => {
  const defaults = projectDefaults[projectType];
  const [capex, setCapex] = useState(defaults.capex);
  const [opex, setOpex] = useState(defaults.opex);
  const [heightIncrease, setHeightIncrease] = useState(1.0);
  const [capacityUpgrade, setCapacityUpgrade] = useState(30);

  useEffect(() => {
    const d = projectDefaults[projectType];
    setCapex(d.capex);
    setOpex(d.opex);
    setHeightIncrease(1.0);
    setCapacityUpgrade(30);
  }, [projectType]);

  const handleSubmit = () => {
    onDefineProject({
      type: projectType,
      capex,
      opex,
      ...(projectType === 'sea_wall' ? { heightIncrease } : { capacityUpgrade }),
    });
  };

  const Icon = defaults.icon;
  const accentColor = projectType === 'sea_wall' ? 'teal' : 'blue';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${accentColor}-400`} />
            Define Project: {defaults.title}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Configure capital and maintenance costs for your defensive infrastructure project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* CAPEX */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Project Cost (CAPEX)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="text"
                value={capex.toLocaleString()}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                  setCapex(v);
                }}
                className="pl-7 bg-white/5 border-white/10 text-white rounded-xl"
              />
            </div>
          </div>

          {/* OPEX */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Annual Maintenance (OPEX)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="text"
                value={opex.toLocaleString()}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                  setOpex(v);
                }}
                className="pl-7 bg-white/5 border-white/10 text-white rounded-xl"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">/ yr</span>
            </div>
          </div>

          {/* Technical Spec */}
          {projectType === 'sea_wall' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-white/70 flex items-center gap-1.5">
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-teal-400" />
                  Height Increase
                </Label>
                <span className="text-sm font-semibold text-teal-400 tabular-nums">+{heightIncrease.toFixed(1)}m</span>
              </div>
              <Slider
                value={[heightIncrease]}
                onValueChange={(v) => setHeightIncrease(v[0])}
                min={0.5}
                max={3.0}
                step={0.1}
                className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-teal-500 [&_[data-radix-slider-thumb]]:border-teal-500 [&_[data-radix-slider-thumb]]:bg-white"
              />
              <div className="flex justify-between text-[9px] text-white/30">
                <span>+0.5m</span>
                <span>+1.5m</span>
                <span>+3.0m</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-white/70 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Capacity Upgrade
              </Label>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-sm font-semibold text-blue-400">+{capacityUpgrade}cm</span>
                <p className="text-[10px] text-white/40 mt-0.5">Additional drainage capacity per event</p>
              </div>
              <Slider
                value={[capacityUpgrade]}
                onValueChange={(v) => setCapacityUpgrade(v[0])}
                min={10}
                max={100}
                step={5}
                className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-blue-500 [&_[data-radix-slider-thumb]]:border-blue-500 [&_[data-radix-slider-thumb]]:bg-white"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSimulating}
            className={`w-full h-11 text-sm font-semibold text-white bg-gradient-to-r ${
              projectType === 'sea_wall'
                ? 'from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                : 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
            } rounded-xl transition-all`}
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Apply & Simulate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

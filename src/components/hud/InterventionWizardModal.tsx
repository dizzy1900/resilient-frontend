import { useState, useEffect } from 'react';
import { Sprout, DollarSign, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
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

export interface ProjectParams {
  capex: number;
  opex: number;
  yieldBenefit: number;
  cropPrice: number;
}

const cropDefaults: Record<string, { capex: number; opex: number; yieldBenefit: number; cropPrice: number; title: string }> = {
  maize: { capex: 150, opex: 80, yieldBenefit: 25, cropPrice: 250, title: 'Drought-Resilient Maize' },
  cocoa: { capex: 2000, opex: 425, yieldBenefit: 30, cropPrice: 4800, title: 'Drought-Resilient Cocoa' },
};

interface InterventionWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunAnalysis: (params: ProjectParams) => void;
  isSimulating: boolean;
  cropType?: string;
}

export const InterventionWizardModal = ({
  open,
  onOpenChange,
  onRunAnalysis,
  isSimulating,
  cropType = 'cocoa',
}: InterventionWizardModalProps) => {
  const defaults = cropDefaults[cropType] || cropDefaults.cocoa;
  const [capex, setCapex] = useState(defaults.capex);
  const [opex, setOpex] = useState(defaults.opex);
  const [yieldBenefit, setYieldBenefit] = useState(defaults.yieldBenefit);
  const [cropPrice, setCropPrice] = useState(defaults.cropPrice);

  // Reset defaults when crop type changes
  useEffect(() => {
    const d = cropDefaults[cropType] || cropDefaults.cocoa;
    setCapex(d.capex);
    setOpex(d.opex);
    setYieldBenefit(d.yieldBenefit);
    setCropPrice(d.cropPrice);
  }, [cropType]);

  const handleSubmit = () => {
    onRunAnalysis({ capex, opex, yieldBenefit, cropPrice });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            Project Definition: {defaults.title}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Define your adaptation project parameters to run an ROI analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* CAPEX */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Intervention Cost (CAPEX)
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">/ ha</span>
            </div>
          </div>

          {/* OPEX */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Annual Upkeep (OPEX)
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">/ ha</span>
            </div>
          </div>

          {/* Yield Benefit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-white/70 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Yield Benefit
              </Label>
              <span className="text-sm font-semibold text-emerald-400 tabular-nums">+{yieldBenefit}%</span>
            </div>
            <Slider
              value={[yieldBenefit]}
              onValueChange={(v) => setYieldBenefit(v[0])}
              min={5}
              max={80}
              step={5}
              className="w-full [&_[data-radix-slider-track]]:bg-white/10 [&_[data-radix-slider-range]]:bg-emerald-500 [&_[data-radix-slider-thumb]]:border-emerald-500 [&_[data-radix-slider-thumb]]:bg-white"
            />
            <div className="flex justify-between text-[9px] text-white/30">
              <span>+5%</span>
              <span>+40%</span>
              <span>+80%</span>
            </div>
          </div>

          {/* Crop Price */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              Crop Price
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="text"
                value={cropPrice.toLocaleString()}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                  setCropPrice(v);
                }}
                className="pl-7 bg-white/5 border-white/10 text-white rounded-xl"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">/ tonne</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSimulating}
            className="w-full h-11 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Run ROI Analysis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

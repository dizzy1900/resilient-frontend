import { Settings } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFinancialSettings } from '@/contexts/FinancialContext';

export const FinancialSettingsModal = () => {
  const { settings, updateSettings } = useFinancialSettings();
  const [open, setOpen] = useState(false);

  // Local state for editing
  const [localDiscount, setLocalDiscount] = useState(settings.discountRate);
  const [localPeriod, setLocalPeriod] = useState(settings.analysisPeriod);
  const [localCurrency, setLocalCurrency] = useState(settings.currency);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalDiscount(settings.discountRate);
      setLocalPeriod(settings.analysisPeriod);
      setLocalCurrency(settings.currency);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    updateSettings({
      discountRate: localDiscount,
      analysisPeriod: localPeriod,
      currency: localCurrency,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white rounded-xl shadow-lg h-9 w-9"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 rounded-xl p-0.5">
            <TabsTrigger
              value="financial"
              className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
            >
              Financial Assumptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="mt-4 space-y-5">
            {/* Discount Rate */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Discount Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={localDiscount}
                onChange={(e) => setLocalDiscount(parseFloat(e.target.value) || 0)}
                className="bg-white/5 border-white/10 text-white rounded-xl"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                World Bank projects typically use 6%, Private Equity uses 15%.
              </p>
            </div>

            {/* Analysis Period */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Analysis Period (Years)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                step={1}
                value={localPeriod}
                onChange={(e) => setLocalPeriod(parseInt(e.target.value) || 1)}
                className="bg-white/5 border-white/10 text-white rounded-xl"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Currency</Label>
              <Select value={localCurrency} onValueChange={setLocalCurrency}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10">
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="KES">KES (KSh)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl"
            >
              Save Settings
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

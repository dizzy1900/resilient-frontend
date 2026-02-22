import { create } from 'zustand';

export interface ProjectData {
  interventionName: string;
  capex: number;
  opex: number;
  insurancePremium: number;
  carbonCredits: number;
  lifespan: number;
}

interface ProjectStore extends ProjectData {
  setProjectData: (data: Partial<ProjectData>) => void;
  reset: () => void;
}

const DEFAULTS: ProjectData = {
  interventionName: 'Custom Project',
  capex: 500000,
  opex: 25000,
  insurancePremium: 50000,
  carbonCredits: 0,
  lifespan: 30,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...DEFAULTS,
  setProjectData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set(DEFAULTS),
}));

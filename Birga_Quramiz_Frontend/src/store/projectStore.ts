import { create } from 'zustand';
import type { ProjectContext, AiMaterial, AiProduct } from '@/lib/chat/types';

type ProjectState = {
  context: ProjectContext;
  materials: AiMaterial[];
  products: AiProduct[];

  setField: <K extends keyof ProjectContext>(key: K, value: ProjectContext[K]) => void;
  setContext: (ctx: Partial<ProjectContext>) => void;
  setMaterials: (items: AiMaterial[]) => void;
  setProducts: (items: AiProduct[]) => void;
  reset: () => void;
  hasContext: () => boolean;
};

export const useProjectStore = create<ProjectState>()((set, get) => ({
  context: {},
  materials: [],
  products: [],

  setField: (key, value) =>
    set((state) => ({ context: { ...state.context, [key]: value } })),

  setContext: (ctx) =>
    set((state) => ({ context: { ...state.context, ...ctx } })),

  setMaterials: (materials) => set({ materials }),

  setProducts: (products) => set({ products }),

  reset: () => set({ context: {}, materials: [], products: [] }),

  hasContext: () => {
    const { area, type, budget } = get().context;
    const { materials, products } = get();
    return !!(area || type || budget || materials.length > 0 || products.length > 0);
  },
}));

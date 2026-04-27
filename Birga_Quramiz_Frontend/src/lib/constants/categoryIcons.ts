import {
  Hammer, Wrench, Flame, Zap, Droplets, Wind,
  Building2, Package, Settings2, Paintbrush, TreePine,
  Grid3x3, DoorOpen, Layers, FlaskConical, Waves,
  ShieldAlert, Cog, LayoutGrid, ThermometerSun,
  Boxes, Drill, Cable, Warehouse, HardHat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  MIX: FlaskConical, ROF: Warehouse,    INS: ThermometerSun, DRW: Layers,
  PNT: Paintbrush,   MTL: Settings2,    FAS: Wrench,         TOL: Hammer,
  PLM: Droplets,     ELC: Zap,          BLK: Building2,      FLR: LayoutGrid,
  WOD: TreePine,     VNT: Wind,         DOR: DoorOpen,       RPR: Package,
  MSH: Grid3x3,      HTG: Flame,        FPR: ShieldAlert,    PMP: Waves,
  FIN: Drill,        MCH: Cog,          DRN: Boxes,          GEN: HardHat,
  DEFAULT: Cable,
};

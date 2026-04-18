'use client';

import { useProjectStore } from '@/store/projectStore';
import type { ProjectContext } from '@/lib/chat/types';

// Keywords used only for detection, not for display
const TYPE_KEYWORDS: Record<string, string> = {
  room: 'room', комнат: 'room', хонадон: 'room', xona: 'room',
  house: 'house', дом: 'house', уй: 'house', коттедж: 'house', жило: 'house',
  floor: 'floor', пол: 'floor', полов: 'floor', floor_kw: 'floor',
  wall: 'wall', стен: 'wall', devor: 'wall',
  renovation: 'renovation', ремонт: 'renovation', remont: 'renovation',
  office: 'office', офис: 'office', ofis: 'office',
};

// Capture a human-readable label from the raw user message
function extractTypeLabel(text: string, detectedType: string): string {
  const lower = text.toLowerCase();

  // "2-этажный дом", "двухэтажный дом", "3 этажа"
  const floorPattern = text.match(/(\d+)[\s-]?этаж\w*/i);
  const floor2 = /двух\s*этаж/i.test(text) ? 2 : /трёх\s*этаж|трех\s*этаж/i.test(text) ? 3 : null;
  const floors = floorPattern ? parseInt(floorPattern[1]) : floor2;

  if (detectedType === 'house') {
    if (floors) return `${floors}-этажный дом`;
    if (lower.includes('коттедж')) return 'Коттедж';
    if (lower.includes('дача')) return 'Дача';
    return 'Жилой дом';
  }
  if (detectedType === 'room') {
    const roomMatch = text.match(/(\d+)[\s-]?комнат/i);
    if (roomMatch) return `${roomMatch[1]}-комнатная квартира`;
    if (lower.includes('квартир')) return 'Квартира';
    return 'Комната';
  }
  if (detectedType === 'renovation') return 'Ремонт';
  if (detectedType === 'wall') return 'Стены';
  if (detectedType === 'floor') return 'Пол';
  if (detectedType === 'office') return 'Офис';
  return detectedType;
}

export function useProject() {
  const { context, setField, setContext, reset, hasContext } = useProjectStore();

  function updateFromText(text: string) {
    const updates: Partial<ProjectContext> = {};
    const lower = text.toLowerCase();

    const areaMatch = text.match(/(\d+)\s*(?:м²|m²|кв\.?\s*м|sq\.?\s*m)/i);
    if (areaMatch) updates.area = parseInt(areaMatch[1], 10);

    const budgetMatch = text.match(/(\d[\d\s]*)\s*(?:uzs|сум|млн|тыс)/i);
    if (budgetMatch) {
      const raw = parseInt(budgetMatch[1].replace(/\s/g, ''), 10);
      updates.budget = lower.includes('млн') ? raw * 1_000_000
        : lower.includes('тыс') ? raw * 1_000
        : raw;
    }

    for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
      if (lower.includes(keyword)) {
        updates.type = extractTypeLabel(text, type);
        break;
      }
    }

    if (Object.keys(updates).length > 0) setContext(updates);
  }

  return { context, setField, setContext, reset, hasContext, updateFromText };
}

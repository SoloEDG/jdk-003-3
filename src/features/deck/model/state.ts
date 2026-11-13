import { reactive, readonly } from "vue";
import { starter, createCard, canRemove } from "../lib/collection";
import { upgradeCost, removalCost, campHealing } from "../lib/costs";
import { buildRecipe, fusionMaterialCost, FUSION_MATERIAL } from "../lib/fusion";
import { specOf } from "@/shared/cards";
import { uid } from "@/shared/random";
import type { CardInstance, ExpeditionSummary } from "@/shared/domain";
const state = reactive({
  cards: starter(),
  hero: { hp: 72, maxHp: 72, gold: 80, scars: 0 } as ExpeditionSummary,
  materials: { ember_core: 1 } as Record<string, number>,
  removals: 0,
  campUsed: false,
  selected: "",
  fusionMain: "",
  fusionSub: "",
});
export const deckState = readonly(state);
export function deckCards(): CardInstance[] {
  return state.cards.map((c) => ({ ...c }));
}
export function addCard(key: string) {
  state.cards.push(createCard(key));
}
export function spendGold(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.hero.gold)
    return false;
  state.hero.gold -= amount;
  return true;
}
export function earnGold(amount: number) {
  state.hero.gold += Math.max(0, amount);
}
export function setHp(hp: number) {
  state.hero.hp = Math.min(state.hero.maxHp, Math.max(0, hp));
}
export function heal(amount: number) {
  setHp(state.hero.hp + amount);
}
export function selectCard(id: string) {
  state.selected = id;
}
export function addMaterial(key: string, count = 1) {
  state.materials[key] = (state.materials[key] ?? 0) + Math.max(0, count);
}
export function setFusionSlot(slot: "main" | "sub", id: string) {
  if (slot === "main") state.fusionMain = id;
  else state.fusionSub = id;
}
export function fuseCards(mainId: string, subId: string) {
  if (!mainId || !subId || mainId === subId) return null;
  const main = state.cards.find((c) => c.id === mainId);
  const sub = state.cards.find((c) => c.id === subId);
  if (!main || !sub) return null;
  const cost = fusionMaterialCost(specOf(main), specOf(sub));
  if ((state.materials[FUSION_MATERIAL] ?? 0) < cost) return null;
  const recipe = buildRecipe(main, sub);
  state.materials[FUSION_MATERIAL] -= cost;
  state.cards = state.cards.filter((c) => c.id !== mainId && c.id !== subId);
  state.cards.push({
    id: uid("card"),
    key: main.key,
    upgraded: false,
    fusion: recipe,
  });
  if (state.selected === mainId || state.selected === subId)
    state.selected = "";
  state.fusionMain = "";
  state.fusionSub = "";
  return recipe;
}
export function upgradeCard(id: string, free = false) {
  const c = state.cards.find((c) => c.id === id);
  if (!c || c.upgraded) return false;
  if (!free && !spendGold(upgradeCost(c.upgraded, state.hero.scars)))
    return false;
  c.upgraded = true;
  return true;
}
export function removeCard(id: string) {
  if (
    !canRemove(state.cards.length) ||
    !state.cards.some((c) => c.id === id) ||
    !spendGold(removalCost(state.removals))
  )
    return false;
  state.cards = state.cards.filter((c) => c.id !== id);
  state.removals++;
  state.selected = "";
  return true;
}
export function openCamp() {
  state.campUsed = false;
}
export function useCamp(action: "rest" | "upgrade", heat: number) {
  if (state.campUsed) return false;
  if (action === "rest") heal(campHealing(state.hero.maxHp, heat));
  else if (!upgradeCard(state.selected, true)) return false;
  state.campUsed = true;
  return true;
}
export function exportDeck() {
  return JSON.parse(
    JSON.stringify({
      cards: state.cards,
      hero: state.hero,
      materials: state.materials,
      removals: state.removals,
      campUsed: state.campUsed,
    }),
  );
}
export function restoreDeck(d: ReturnType<typeof exportDeck>) {
  state.cards = d.cards;
  state.hero = d.hero;
  state.materials = { ember_core: 0, ...(d.materials ?? {}) };
  state.removals = d.removals;
  state.campUsed = d.campUsed;
  state.selected = "";
  state.fusionMain = "";
  state.fusionSub = "";
}
export function resetDeck() {
  state.cards = starter();
  state.hero = { hp: 72, maxHp: 72, gold: 80, scars: 0 };
  state.materials = { ember_core: 1 };
  state.removals = 0;
  state.campUsed = false;
  state.selected = "";
  state.fusionMain = "";
  state.fusionSub = "";
}

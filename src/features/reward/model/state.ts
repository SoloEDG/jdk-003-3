import { reactive, readonly } from "vue";
import type { BattleResult, RewardOffer } from "@/shared/domain";
import { offerFrom, validChoice } from "../lib/settlement";
const state = reactive({
  offer: null as RewardOffer | null,
  history: [] as string[],
  selected: "",
  selectedMaterial: "",
});
export const rewardState = readonly(state);
export function openReward(result: BattleResult) {
  if (!result.won || state.history.includes(result.id)) return false;
  state.offer = offerFrom(result);
  state.selected = "";
  state.selectedMaterial = "";
  return true;
}
export function chooseReward(key: string) {
  if (state.offer?.cards.includes(key)) {
    state.selected = key;
    state.selectedMaterial = "";
  }
}
export function chooseMaterial(key: string) {
  if (state.offer?.materials.includes(key)) {
    state.selectedMaterial = key;
    state.selected = "";
  }
}
export function claimReward(skip = false) {
  const card = skip ? null : state.selected || null;
  const material = skip ? null : state.selectedMaterial || null;
  if (!skip && !card && !material) return null;
  if (!validChoice(state.offer, card, material)) return null;
  const offer = state.offer!;
  offer.claimed = true;
  state.history.push(offer.source);
  return {
    card,
    material,
    materialCount: material
      ? offer.materials.filter((m) => m === material).length
      : 0,
    gold: offer.gold,
    heal: offer.heal,
  };
}
export function exportReward() {
  return JSON.parse(
    JSON.stringify({ offer: state.offer, history: state.history }),
  );
}
export function restoreReward(d: ReturnType<typeof exportReward>) {
  state.offer = d.offer ? { materials: [], ...d.offer } : null;
  state.history = d.history;
  state.selected = "";
  state.selectedMaterial = "";
}
export function resetReward() {
  state.offer = null;
  state.history = [];
  state.selected = "";
  state.selectedMaterial = "";
}

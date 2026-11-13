import type { CardSpec, Effect, FusionRecipe } from "@/shared/domain";
import { specOf, type CardSpecSource } from "@/shared/cards";
import { uid } from "@/shared/random";
export interface FusionSource extends CardSpecSource {
  readonly upgraded: boolean;
}
export const FUSION_MATERIAL = "ember_core";
export const FUSION_COST_CAP = 3;
export const DRAW_MERGE_CAP = 3;
export function fusionMaterialCost(main: CardSpec, sub: CardSpec) {
  return 1 + (main.rarity === "rare" || sub.rarity === "rare" ? 1 : 0);
}
export function mergeEffects(
  main: readonly Effect[],
  sub: readonly Effect[],
): Effect[] {
  const result: Effect[] = [];
  for (const e of [...main, ...sub]) {
    const effect = { ...e };
    if (effect.type === "strength") {
      const existing = result.find((r) => r.type === "strength");
      if (existing) {
        existing.amount += effect.amount;
        continue;
      }
    }
    if (effect.type === "draw") {
      const existing = result.find((r) => r.type === "draw");
      if (existing) {
        existing.amount = Math.min(
          DRAW_MERGE_CAP,
          existing.amount + effect.amount,
        );
        continue;
      }
      effect.amount = Math.min(DRAW_MERGE_CAP, effect.amount);
    }
    if (effect.type === "energy") {
      const existing = result.find((r) => r.type === "energy");
      if (existing) {
        existing.amount = Math.max(existing.amount, effect.amount);
        continue;
      }
    }
    result.push(effect);
  }
  return result;
}
export function fusionCostFloor(effects: readonly Effect[]) {
  if (effects.some((e) => e.type === "energy")) return 2;
  if (effects.some((e) => e.type === "draw")) return 1;
  return 0;
}
export function fusionCost(
  main: CardSpec,
  sub: CardSpec,
  effects: readonly Effect[],
) {
  return Math.min(
    FUSION_COST_CAP,
    Math.max(fusionCostFloor(effects), main.cost + sub.cost),
  );
}
const effectPhrases: Record<Effect["type"], (n: number) => string> = {
  damage: (n) => `造成 ${n} 伤害`,
  block: (n) => `获得 ${n} 格挡`,
  draw: (n) => `抽 ${n} 张牌`,
  poison: (n) => `施加 ${n} 中毒`,
  strength: (n) => `力量 +${n}`,
  heal: (n) => `回复 ${n} 生命`,
  energy: (n) => `获得 ${n} 能量`,
};
export function describeEffect(e: Effect) {
  return effectPhrases[e.type](e.amount);
}
export function describeEffects(effects: readonly Effect[]) {
  return effects.map(describeEffect).join("，") + "。";
}
export function buildRecipe(main: FusionSource, sub: FusionSource): FusionRecipe {
  const mainSpec = specOf(main);
  const subSpec = specOf(sub);
  const effects = mergeEffects(mainSpec.effects, subSpec.effects);
  return {
    id: uid("fusion"),
    name: `${mainSpec.name}·${subSpec.name}`,
    cost: fusionCost(mainSpec, subSpec, effects),
    kind: mainSpec.kind,
    text: describeEffects(effects),
    effects,
    lineage: [
      {
        role: "主卡",
        key: main.key,
        name: mainSpec.name,
        upgraded: main.upgraded,
      },
      {
        role: "辅卡",
        key: sub.key,
        name: subSpec.name,
        upgraded: sub.upgraded,
      },
    ],
    materials: fusionMaterialCost(mainSpec, subSpec),
  };
}

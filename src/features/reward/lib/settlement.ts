import type { BattleResult, RewardOffer } from "@/shared/domain";
import { rewardPool } from "./pool";
export function offerFrom(result: BattleResult): RewardOffer {
  const rich =
    result.context.kind === "elite" ||
    result.context.kind === "boss" ||
    result.context.influence.heat >= 2;
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: rewardPool(result.context),
    materials: rich ? ["ember_core", "ember_core"] : ["ember_core"],
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
  };
}
export function validChoice(
  offer: RewardOffer | null,
  card: string | null,
  material: string | null,
) {
  if (!offer || offer.claimed) return false;
  if (card === null && material === null) return true;
  if (card !== null) return offer.cards.includes(card);
  return offer.materials.includes(material!);
}

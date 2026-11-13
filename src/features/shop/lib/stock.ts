import type { JourneyContext } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
export interface StockItem {
  id: string;
  kind: "card" | "material";
  key: string;
  basePrice: number;
  sold: boolean;
}
export function makeStock(c: JourneyContext): StockItem[] {
  const cardItems = shuffle(
    ["venom", "focus", "fury", "burst", "shelter", "guard"],
    hash(c.nodeId),
  )
    .slice(0, 3)
    .map((card, i) => ({
      id: `${c.nodeId}-stock-${i}`,
      kind: "card" as const,
      key: card,
      basePrice: ["fury", "burst", "focus"].includes(card) ? 48 : 32,
      sold: false,
    }));
  return [
    ...cardItems,
    {
      id: `${c.nodeId}-stock-material`,
      kind: "material" as const,
      key: "ember_core",
      basePrice: 20,
      sold: false,
    },
  ];
}

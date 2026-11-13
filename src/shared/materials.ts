export interface MaterialSpec {
  key: string;
  name: string;
  text: string;
}
export const materials: Record<string, MaterialSpec> = {
  ember_core: {
    key: "ember_core",
    name: "余烬熔核",
    text: "融合锻造的燃料。熔铸两张牌时按配方消耗，可从战利品或商店取得。",
  },
};
export function materialLabel(key: string) {
  return materials[key]?.name ?? key;
}

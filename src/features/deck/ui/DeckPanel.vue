<script setup lang="ts">
import { computed } from "vue";
import { deckState, selectCard, setFusionSlot } from "../model/state";
import { specOf } from "@/shared/cards";
import { materials } from "@/shared/materials";
import { upgradeCost, removalCost } from "../lib/costs";
import {
  buildRecipe,
  fusionMaterialCost,
  describeEffect,
  FUSION_MATERIAL,
} from "../lib/fusion";
defineProps<{ camp: boolean; locked: boolean }>();
const emit = defineEmits<{
  upgrade: [id: string];
  remove: [id: string];
  camp: [action: "rest" | "upgrade"];
  fuse: [];
}>();
const kindNames = { attack: "攻击", skill: "技能", power: "能力" } as const;
const mainCard = computed(
  () => deckState.cards.find((c) => c.id === deckState.fusionMain) ?? null,
);
const subCard = computed(
  () => deckState.cards.find((c) => c.id === deckState.fusionSub) ?? null,
);
const samePick = computed(
  () => !!mainCard.value && mainCard.value.id === subCard.value?.id,
);
const preview = computed(() =>
  mainCard.value && subCard.value && !samePick.value
    ? buildRecipe(mainCard.value, subCard.value)
    : null,
);
const materialNeed = computed(() =>
  mainCard.value && subCard.value
    ? fusionMaterialCost(specOf(mainCard.value), specOf(subCard.value))
    : 0,
);
const materialHave = computed(() => deckState.materials[FUSION_MATERIAL] ?? 0);
const canFuse = computed(
  () => !!preview.value && materialHave.value >= materialNeed.value,
);
function pick(slot: "main" | "sub", e: Event) {
  setFusionSlot(slot, (e.target as HTMLSelectElement).value);
}
function cardOption(c: { id: string }) {
  const card = deckState.cards.find((x) => x.id === c.id)!;
  const spec = specOf(card);
  return `${spec.name}${card.upgraded ? "+" : ""} #${card.id.slice(-4)}`;
}
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">05 / YOUR ARSENAL</span
      ><span>{{ deckState.cards.length }} 张</span>
    </div>
    <h2>行囊中的可能</h2>
    <p class="muted">
      相同卡牌拥有独立身份。强化只影响选中的这一张，战斗中的牌组锁定。
    </p>
    <div v-if="camp" class="camp">
      <h3>篝火 · {{ deckState.campUsed ? "已经休整" : "选择一次休整" }}</h3>
      <button :disabled="deckState.campUsed" @click="emit('camp', 'rest')">
        休息 · 回复生命</button
      ><button
        :disabled="deckState.campUsed || !deckState.selected"
        @click="emit('camp', 'upgrade')"
      >
        免费强化选中牌
      </button>
    </div>
    <div class="forge">
      <h3>
        融合锻造 · {{ materials[FUSION_MATERIAL]?.name }} ×
        {{ materialHave }}
      </h3>
      <p class="muted">
        把主卡与辅卡熔铸成一张复合卡。确认前可预览并取消，不消耗任何东西；确认后配方封存为不可变快照，素材之后的变化不会影响它。
      </p>
      <div class="forge-slots">
        <label
          >主卡 · 继承基础类型
          <select
            :value="deckState.fusionMain"
            data-slot="main"
            @change="pick('main', $event)"
          >
            <option value="">— 选择主卡 —</option>
            <option v-for="c in deckState.cards" :key="c.id" :value="c.id">
              {{ cardOption(c) }}
            </option>
          </select> </label
        ><label
          >辅卡 · 接入效果
          <select
            :value="deckState.fusionSub"
            data-slot="sub"
            @change="pick('sub', $event)"
          >
            <option value="">— 选择辅卡 —</option>
            <option v-for="c in deckState.cards" :key="c.id" :value="c.id">
              {{ cardOption(c) }}
            </option>
          </select>
        </label>
      </div>
      <details class="forge-rules">
        <summary>融合规则 · 冲突顺序与费用下限</summary>
        <ul>
          <li>效果顺序：主卡效果在前，辅卡效果在后。</li>
          <li>力量：多处力量合并为一项，数值相加。</li>
          <li>抽牌：多处抽牌合并为一项，数值相加，至多 3。</li>
          <li>能量：冲突时只保留数值最高的一项，其余舍弃。</li>
          <li>
            费用：主辅费用之和；含能量效果下限 2，含抽牌下限 1，上限 3。
          </li>
          <li>复合卡继承主卡类型；能力牌打出后进入消耗堆，其余进弃牌堆。</li>
        </ul>
      </details>
      <div v-if="samePick" class="forge-preview">
        <p class="warn">主卡与辅卡不能是同一个实例。</p>
      </div>
      <div v-if="preview" class="forge-preview" data-preview="fusion">
        <h4>
          {{ preview.name }}
          <small
            >{{ kindNames[preview.kind] }} · 费用 {{ preview.cost }} ·
            {{ preview.materials }} 熔核</small
          >
        </h4>
        <ol>
          <li v-for="(e, i) in preview.effects" :key="i">
            {{ describeEffect(e) }}
          </li>
        </ol>
        <p>
          打出后去向：{{ preview.kind === "power" ? "消耗堆" : "弃牌堆" }}
        </p>
        <p>
          消耗去向：主卡「{{ preview.lineage[0]!.name }}」与辅卡「{{
            preview.lineage[1]!.name
          }}」这两个实例从牌组移除（同名牌不受影响），{{
            materials[FUSION_MATERIAL]?.name
          }}
          −{{ materialNeed }}。
        </p>
        <p>
          来源血缘：主卡 {{ preview.lineage[0]!.name
          }}{{ preview.lineage[0]!.upgraded ? "+" : "" }}（{{
            preview.lineage[0]!.key
          }}） · 辅卡 {{ preview.lineage[1]!.name
          }}{{ preview.lineage[1]!.upgraded ? "+" : "" }}（{{
            preview.lineage[1]!.key
          }}）
        </p>
        <p v-if="materialHave < materialNeed" class="warn">
          材料不足：需要 {{ materialNeed }} 熔核，现有 {{ materialHave }}。
        </p>
        <div class="toolbar">
          <button
            :disabled="locked || !canFuse"
            data-action="fuse"
            @click="emit('fuse')"
          >
            确认熔铸 · 消耗素材与熔核</button
          ><button
            @click="
              setFusionSlot('main', '');
              setFusionSlot('sub', '');
            "
          >
            取消预览 · 不消耗
          </button>
        </div>
      </div>
    </div>
    <div class="deck-list">
      <button
        v-for="c in deckState.cards"
        :key="c.id"
        :data-card-id="c.id"
        :class="{ selected: deckState.selected === c.id }"
        @click="selectCard(c.id)"
      >
        <span
          >{{ specOf(c).name }}{{ c.upgraded ? " +" : ""
          }}<b v-if="c.fusion" class="fusion-badge">熔</b></span
        ><small>{{ specOf(c).text }}</small
        ><small v-if="c.fusion" class="lineage"
          >血缘：{{ c.fusion.lineage.map((l) => l.name).join(" + ") }}</small
        ><em>{{ c.id.slice(-6) }}</em>
      </button>
    </div>
    <div class="toolbar">
      <button
        :disabled="locked || !deckState.selected"
        @click="emit('upgrade', deckState.selected)"
      >
        强化 · {{ upgradeCost(false, deckState.hero.scars) }} 金</button
      ><button
        :disabled="locked || !deckState.selected || deckState.cards.length <= 5"
        @click="emit('remove', deckState.selected)"
      >
        移除 · {{ removalCost(deckState.removals) }} 金
      </button>
    </div>
  </section>
</template>

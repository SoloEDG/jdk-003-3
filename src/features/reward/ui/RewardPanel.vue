<script setup lang="ts">
import { computed } from "vue";
import { rewardState, chooseReward, chooseMaterial } from "../model/state";
import { cards } from "@/shared/cards";
import { materials } from "@/shared/materials";
defineEmits<{ claim: [skip: boolean] }>();
const materialOptions = computed(() => {
  const offer = rewardState.offer;
  if (!offer) return [];
  const counts: Record<string, number> = {};
  for (const m of offer.materials) counts[m] = (counts[m] ?? 0) + 1;
  return Object.entries(counts).map(([key, count]) => ({ key, count }));
});
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">03 / THE SPOILS</span><span>三选一</span>
    </div>
    <h2>把胜利带进下一场</h2>
    <p class="muted">
      战斗结束后结算金币，并选择一张新牌或一枚熔铸材料。林地额外疗愈，险路改变奖励池。
    </p>
    <div v-if="rewardState.offer && !rewardState.offer.claimed">
      <div class="notice">
        ✦ {{ rewardState.offer.gold }} 金币 · 回复
        {{ rewardState.offer.heal }} 生命
      </div>
      <div class="reward-options">
        <button
          v-for="key in rewardState.offer.cards"
          :key="key"
          :class="{ selected: rewardState.selected === key }"
          @click="chooseReward(key)"
        >
          <b>{{ cards[key]?.name }}</b
          ><small>{{ cards[key]?.text }}</small
          ><em>{{ cards[key]?.rarity }}</em>
        </button>
        <button
          v-for="m in materialOptions"
          :key="m.key"
          :class="{ selected: rewardState.selectedMaterial === m.key }"
          @click="chooseMaterial(m.key)"
        >
          <b>{{ materials[m.key]?.name }} ×{{ m.count }}</b
          ><small>{{ materials[m.key]?.text }}</small
          ><em>熔铸材料</em>
        </button>
      </div>
      <div class="toolbar">
        <button
          :disabled="!rewardState.selected && !rewardState.selectedMaterial"
          data-action="claim"
          @click="$emit('claim', false)"
        >
          收下选中项与战利品</button
        ><button data-action="skip-reward" @click="$emit('claim', true)">
          仅收取金币
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">
      {{
        rewardState.offer?.claimed
          ? "战利品已收入行囊。下一段路线已开放。"
          : "战胜敌人，发现下一张关键卡牌。"
      }}
    </div>
  </section>
</template>

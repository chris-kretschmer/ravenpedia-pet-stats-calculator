<template>
  <div class="calculator-wrapper">
    <FormKit type="form" v-model="formInputs" :actions="false">
      <div class="input-grid">
        <FormKit
          type="number"
          name="strength"
          :label="i18n.attributes.strength"
          placeholder="0"
          v-model="formInputs.strength"
          :validation="`required|min:0|max:${maxValues.strength}`"
          min="0"
          :max="maxValues.strength"
          :validation-messages="{ max: i18n.validation.max.replace('{max}', String(maxValues.strength)) }"
        />
        <FormKit
          type="number"
          name="intellect"
          :label="i18n.attributes.intellect"
          placeholder="0"
          v-model="formInputs.intellect"
          :validation="`required|min:0|max:${maxValues.intellect}`"
          min="0"
          :max="maxValues.intellect"
          :validation-messages="{ max: i18n.validation.max.replace('{max}', String(maxValues.intellect)) }"
        />
        <FormKit
          type="number"
          name="agility"
          :label="i18n.attributes.agility"
          placeholder="0"
          v-model="formInputs.agility"
          :validation="`required|min:0|max:${maxValues.agility}`"
          min="0"
          :max="maxValues.agility"
          :validation-messages="{ max: i18n.validation.max.replace('{max}', String(maxValues.agility)) }"
        />
        <FormKit
          type="number"
          name="will"
          :label="i18n.attributes.will"
          placeholder="0"
          v-model="formInputs.will"
          :validation="`required|min:0|max:${maxValues.will}`"
          min="0"
          :max="maxValues.will"
          :validation-messages="{ max: i18n.validation.max.replace('{max}', String(maxValues.will)) }"
        />
        <FormKit
          type="number"
          name="power"
          :label="i18n.attributes.power"
          placeholder="0"
          v-model="formInputs.power"
          :validation="`required|min:0|max:${maxValues.power}`"
          min="0"
          :max="maxValues.power"
          :validation-messages="{ max: i18n.validation.max.replace('{max}', String(maxValues.power)) }"
        />
      </div>
      <button type="button" @click="clearInputs" class="clear-button">{{ i18n.clearButton }}</button>
    </FormKit>

    <div v-if="results.length > 0" class="results-container">
      <div v-for="group in results" :key="group.groupId" class="result-group">
        <h3 class="group-headline">{{ group.groupName_de }}</h3>
        <div class="result-grid">
          <div v-for="talent in group.talents" :key="talent.id" class="result-item">
            <span class="talent-name">{{ talent.name_de }}</span>
            <span class="talent-value">{{ talent.roundedValue }} <small>({{ talent.value.toFixed(2) }})</small></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="apiError" class="error-box">
      <h3>{{ i18n.errors.errorTitle }}</h3>
      <p>{{ apiError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Talent, CalculationInputs, TalentGroup } from '@/types/talent';
import de from '../i18n/de.json';

// Accept optional props: i18n (override) and preloadedData (server-injected talents)
const props = defineProps<{
  i18n?: any;
  preloadedData?: {
    maxValues?: Record<string, number>;
    talentGroups?: TalentGroup[];
  } | null;
}>();

// Provide the centralized i18n object (single source of truth). Prefer passed prop if provided.
const i18n = (props.i18n ?? de) as any;

// --- Data ---
const talentGroups = ref<TalentGroup[]>([]);

// --- maxValues (loaded from API or preloadedData) ---
const maxValues = ref({
  strength: 435,
  intellect: 430,
  agility: 440,
  will: 440,
  power: 430,
});

// --- Form State ---
const formInputs = ref<CalculationInputs>({
  strength: '',
  intellect: '',
  agility: '',
  will: '',
  power: '',
});

function clearInputs() {
  formInputs.value = {
    strength: '',
    intellect: '',
    agility: '',
    will: '',
    power: '',
  };
}

// --- Result State ---
interface Result extends Talent {
  value: number;
  roundedValue: number;
}
interface ResultGroup {
  groupId: string;
  groupName_de: string;
  talents: Result[];
}
const results = ref<ResultGroup[]>([]);

// --- API State ---
const apiError = ref<string | null>(null);

// Helper: coerce inputs to numbers
function toNumbers(inputs: CalculationInputs) {
  return {
    strength: Number(inputs.strength || 0),
    intellect: Number(inputs.intellect || 0),
    agility: Number(inputs.agility || 0),
    will: Number(inputs.will || 0),
    power: Number(inputs.power || 0),
  };
}

// --- Calculation Logic ---
function calculateTalentValue(talent: Talent, inputs: { strength: number; intellect: number; agility: number; will: number; power: number }): number {
  const { baseTalentValue, factors } = talent;
  const sumOfProducts =
    (inputs.strength * factors.strength) +
    (inputs.intellect * factors.intellect) +
    (inputs.agility * factors.agility) +
    (inputs.will * factors.will) +
    (inputs.power * factors.power);
  return baseTalentValue * sumOfProducts;
}

function recalculateResults(inputs: { strength: number; intellect: number; agility: number; will: number; power: number }) {
  const newResults: ResultGroup[] = [];
  for (const group of talentGroups.value) {
    const groupResults: Result[] = [];
    for (const talent of group.talents) {
      const value = calculateTalentValue(talent, inputs);
      const roundedValue = Math.round(Number(value.toFixed(2)));
      groupResults.push({ ...talent, value, roundedValue });
    }
    newResults.push({ groupId: group.groupId, groupName_de: group.groupName_de, talents: groupResults });
  }
  results.value = newResults;
}

// --- Lifecycle & Watcher ---
onMounted(async () => {
  try {
    // If server provided preloaded data, use it to avoid a client fetch
    if (props.preloadedData) {
      const data = props.preloadedData;
      talentGroups.value = data.talentGroups || [];
      if (data.maxValues) {
        maxValues.value = {
          strength: Number(data.maxValues.strength ?? maxValues.value.strength),
          intellect: Number(data.maxValues.intellect ?? maxValues.value.intellect),
          agility: Number(data.maxValues.agility ?? maxValues.value.agility),
          will: Number(data.maxValues.will ?? maxValues.value.will),
          power: Number(data.maxValues.power ?? maxValues.value.power),
        };
      }
      recalculateResults(toNumbers(formInputs.value));
      return;
    }

    // Fallback: fetch from API (existing behavior) but support base64-encoded responses
    const response = await fetch('/api/talents');
    if (!response.ok) {
      apiError.value = i18n.errors.fetchFailed;
      return;
    }

    // If the server encoded the payload (e.g. base64), it will set X-Content-Encoded header
    const encodedHeader = response.headers.get('X-Content-Encoded');
    let data: any;

      if (encodedHeader === 'base64') {
        const encodedText = await response.text();
        try {
          // New prefix scheme:
          // encodedText = <firstDigit><secondDigit><N random chars><base64Payload>
          // firstDigit = 1..9, secondDigit = 1..3
          // N = max(0, firstDigit - secondDigit)
          if (encodedText.length < 3) {
            throw new Error('Invalid response from API: too short');
          }

          const first = parseInt(encodedText.substring(0, 2), 10);
          const second = parseInt(encodedText.charAt(2), 10);

          if (isNaN(first) || isNaN(second) || first < 10 || first > 20 || second < 1 || second > 3) {
            throw new Error('Invalid response from API: incorrect prefix format');
          }

          const N = Math.max(0, first - second);
          const startIndex = 3 + N;

          if (encodedText.length <= startIndex) {
            throw new Error('Invalid response from API: payload missing');
          }

          const base64Payload = encodedText.slice(startIndex);
          const jsonStr = (typeof atob === 'function')
            ? atob(base64Payload)
            : Buffer.from(base64Payload, 'base64').toString('utf8');
          data = JSON.parse(jsonStr);
        } catch (e: any) {
          apiError.value = `${i18n.errors.fetchFailed}: ${e.message || 'Unknown error'}`;
          return;
        }
      } else {
      // plain JSON response
      data = await response.json();
    }

    // load talent groups
    talentGroups.value = data.talentGroups || [];
    // load maxValues from API if present
    if (data.maxValues) {
      maxValues.value = {
        strength: Number(data.maxValues.strength ?? maxValues.value.strength),
        intellect: Number(data.maxValues.intellect ?? maxValues.value.intellect),
        agility: Number(data.maxValues.agility ?? maxValues.value.agility),
        will: Number(data.maxValues.will ?? maxValues.value.will),
        power: Number(data.maxValues.power ?? maxValues.value.power),
      };
    }
    // Initial calculation using coerced numbers
    recalculateResults(toNumbers(formInputs.value));
  } catch (error: any) {
    apiError.value = i18n.errors.fetchFailed;
  }
});

watch(formInputs, (newInputs) => {
  const nums = toNumbers(newInputs);

  const isValid =
    !isNaN(nums.strength) && nums.strength >= 0 && nums.strength <= maxValues.value.strength &&
    !isNaN(nums.intellect) && nums.intellect >= 0 && nums.intellect <= maxValues.value.intellect &&
    !isNaN(nums.agility) && nums.agility >= 0 && nums.agility <= maxValues.value.agility &&
    !isNaN(nums.will) && nums.will >= 0 && nums.will <= maxValues.value.will &&
    !isNaN(nums.power) && nums.power >= 0 && nums.power <= maxValues.value.power;

  if (isValid) {
    recalculateResults(nums);
  }
}, { deep: true });
</script>

<style scoped>
.calculator-wrapper {
  background-color: #2a2a2a;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #444;
  margin-top: 2rem;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem; /* Adjusted margin */
}

.clear-button {
  background-color: #4a4a4a;
  color: white;
  border: 1px solid #666;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background-color: #5a5a5a;
}

.results-container {
  margin-top: 2rem;
}

.result-group {
  margin-bottom: 2rem;
}

.group-headline {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #444;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.talent-name {
  font-weight: 500;
}

.talent-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4ade80;
}

.talent-value small {
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-left: 0.25rem;
}

.error-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #333;
  border-radius: 8px;
  border-left: 5px solid #f87171;
  color: #f87171;
}
</style>
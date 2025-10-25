<template>
  <div class="calculator-wrapper">
    <FormKit type="form" v-model="formInputs" :actions="false">
      <div class="input-grid">
        <FormKit
          type="number"
          name="strength"
          :label="i18n.attributes.strength"
          placeholder="0"
          v-model.number="formInputs.strength"
          :validation="`required|min:0|max:${i18n.maxValues.strength}`"
          min="0"
          :max="i18n.maxValues.strength"
          :validation-messages="{ max: i18n.validation.strength }"
        />
        <FormKit
          type="number"
          name="intellect"
          :label="i18n.attributes.intellect"
          placeholder="0"
          v-model.number="formInputs.intellect"
          :validation="`required|min:0|max:${i18n.maxValues.intellect}`"
          min="0"
          :max="i18n.maxValues.intellect"
          :validation-messages="{ max: i18n.validation.intellect }"
        />
        <FormKit
          type="number"
          name="agility"
          :label="i18n.attributes.agility"
          placeholder="0"
          v-model.number="formInputs.agility"
          :validation="`required|min:0|max:${i18n.maxValues.agility}`"
          min="0"
          :max="i18n.maxValues.agility"
          :validation-messages="{ max: i18n.validation.agility }"
        />
        <FormKit
          type="number"
          name="will"
          :label="i18n.attributes.will"
          placeholder="0"
          v-model.number="formInputs.will"
          :validation="`required|min:0|max:${i18n.maxValues.will}`"
          min="0"
          :max="i18n.maxValues.will"
          :validation-messages="{ max: i18n.validation.will }"
        />
        <FormKit
          type="number"
          name="power"
          :label="i18n.attributes.power"
          placeholder="0"
          v-model.number="formInputs.power"
          :validation="`required|min:0|max:${i18n.maxValues.power}`"
          min="0"
          :max="i18n.maxValues.power"
          :validation-messages="{ max: i18n.validation.power }"
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
import { ref, onMounted, watch, withDefaults } from 'vue';
import type { Talent, CalculationInputs, TalentGroup } from '@/types/talent';

// --- Props ---
const { i18n } = withDefaults(defineProps<{
  i18n?: {
    attributes: {
      strength: string;
      intellect: string;
      agility: string;
      will: string;
      power: string;
    };
    clearButton: string;
    errors: {
      errorTitle: string;
      fetchFailed: string;
    };
    maxValues: {
      strength: number;
      intellect: number;
      agility: number;
      will: number;
      power: number;
    };
    validation: {
      strength: string;
      intellect: string;
      agility: string;
      will: string;
      power: string;
    };
  };
}>(), {
  i18n: () => ({
    attributes: {
      strength: 'Stärke',
      intellect: 'Intelligenz',
      agility: 'Geschick',
      will: 'Wille',
      power: 'Kraft',
    },
    clearButton: 'Eingaben löschen',
    errors: {
      errorTitle: 'Fehler',
      fetchFailed: 'Talente konnten nicht geladen werden.'
    },
    maxValues: {
      strength: 435,
      intellect: 430,
      agility: 440,
      will: 440,
      power: 430,
    },
    validation: {
      strength: "Darf nicht größer als 435 sein.",
      intellect: "Darf nicht größer als 430 sein.",
      agility: "Darf nicht größer als 440 sein.",
      will: "Darf nicht größer als 440 sein.",
      power: "Darf nicht größer als 430 sein."
    }
  })
});

// --- Data ---
const talentGroups = ref<TalentGroup[]>([]);

// --- Form State ---
const formInputs = ref<CalculationInputs>({
  strength: 0,
  intellect: 0,
  agility: 0,
  will: 0,
  power: 0,
});

function clearInputs() {
  formInputs.value = {
    strength: 0,
    intellect: 0,
    agility: 0,
    will: 0,
    power: 0,
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

// --- Calculation Logic ---
function calculateTalentValue(talent: Talent, inputs: CalculationInputs): number {
  const { baseTalentValue, factors } = talent;
  const sumOfProducts =
    (inputs.strength * factors.strength) +
    (inputs.intellect * factors.intellect) +
    (inputs.agility * factors.agility) +
    (inputs.will * factors.will) +
    (inputs.power * factors.power);
  return baseTalentValue * sumOfProducts;
}

function recalculateResults(inputs: CalculationInputs) {
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
    const response = await fetch('/api/talents');
    if (!response.ok) {
      throw new Error('fetch failed');
    }
    const data = await response.json();
    talentGroups.value = data.talentGroups;
    // Initial calculation
    recalculateResults(formInputs.value);
  } catch (error: any) {
    apiError.value = i18n.errors.fetchFailed;
  }
});

watch(formInputs, (newInputs) => {
  const strength = Number(newInputs.strength);
  const intellect = Number(newInputs.intellect);
  const agility = Number(newInputs.agility);
  const will = Number(newInputs.will);
  const power = Number(newInputs.power);

  const isValid =
    newInputs.strength !== null && newInputs.strength !== '' && !isNaN(strength) && strength >= 0 && strength <= i18n.maxValues.strength &&
    newInputs.intellect !== null && newInputs.intellect !== '' && !isNaN(intellect) && intellect >= 0 && intellect <= i18n.maxValues.intellect &&
    newInputs.agility !== null && newInputs.agility !== '' && !isNaN(agility) && agility >= 0 && agility <= i18n.maxValues.agility &&
    newInputs.will !== null && newInputs.will !== '' && !isNaN(will) && will >= 0 && will <= i18n.maxValues.will &&
    newInputs.power !== null && newInputs.power !== '' && !isNaN(power) && power >= 0 && power <= i18n.maxValues.power;

  if (isValid) {
    recalculateResults({ strength, intellect, agility, will, power });
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
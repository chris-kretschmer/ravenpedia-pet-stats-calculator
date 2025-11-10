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
            :validation-messages="validationMessages('strength', maxValues.strength)"
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
            :validation-messages="validationMessages('intellect', maxValues.intellect)"
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
            :validation-messages="validationMessages('agility', maxValues.agility)"
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
            :validation-messages="validationMessages('will', maxValues.will)"
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
            :validation-messages="validationMessages('power', maxValues.power)"
        />
      </div>
      <button type="button" @click="clearInputs" class="clear-button">{{ i18n.clearButton }}</button>
    </FormKit>

    <div v-if="results.length > 0" class="results-container">
      <div v-for="group in results" :key="group.groupId" class="result-group">
        <h3 class="group-headline">{{ group.groupName }}</h3>
        <div class="result-grid">
          <div v-for="talent in group.talents" :key="talent.id" class="result-item">
            <span class="talent-name">{{ talent.name }}</span>
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
import {ref, onMounted, watch} from 'vue';
import type {Talent, CalculationInputs} from '@/types/talent';
import de from '../i18n/de.json';
import en from '../i18n/en.json';

// Accept optional props: i18n (override), lang (explicit), and preloadedData
const props = defineProps<{
  i18n?: any;
  lang?: 'de' | 'en';
  preloadedData?: {
    maxValues?: Record<string, number>;
    talentGroups?: any[];
  } | null;
}>();

// Resolve language robustly: explicit prop > passed i18n.lang > client pathname > default 'de'
let resolvedLang: 'de' | 'en' = 'de';
if (props.lang === 'en') resolvedLang = 'en';
else if (props.i18n && props.i18n.lang === 'en') resolvedLang = 'en';
else if (typeof window !== 'undefined') {
  const path = window.location.pathname || '';
  if (path.startsWith('/en')) resolvedLang = 'en';
}

// Use provided i18n prop if available; otherwise pick en/de JSON based on resolvedLang
const baseLocale = resolvedLang === 'en' ? en : de;
const i18n = ({...baseLocale, ...(props.i18n ?? {})}) as any;
const lang = resolvedLang;

// --- Data ---
const talentGroups = ref<any[]>([]);

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
  name?: string;
}

interface ResultGroup {
  groupId: string;
  groupName: string;
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

// Validation messages helper: builds localized messages per field
function validationMessages(fieldKey: keyof typeof i18n.attributes, maxValue: number) {
  try {
    const fieldLabel = i18n.attributes[fieldKey] ?? String(fieldKey);
    const required = i18n.validation?.required ? i18n.validation.required.replace('{field}', fieldLabel) : `${fieldLabel} is required.`;
    const min = i18n.validation?.min ? i18n.validation.min.replace('{min}', String(0)) : `Must not be less than 0.`;
    const max = i18n.validation?.max ? i18n.validation.max.replace('{max}', String(maxValue)) : `Must not be greater than ${maxValue}.`;
    return {required, min, max};
  } catch (e) {
    return {required: 'Required', min: 'Too small', max: 'Too large'};
  }
}

// --- Calculation Logic ---
function calculateTalentValue(talent: any, inputs: {
  strength: number;
  intellect: number;
  agility: number;
  will: number;
  power: number
}): number {
  const {baseTalentValue, factors} = talent;
  const sumOfProducts =
      (inputs.strength * factors.strength) +
      (inputs.intellect * factors.intellect) +
      (inputs.agility * factors.agility) +
      (inputs.will * factors.will) +
      (inputs.power * factors.power);
  return baseTalentValue * sumOfProducts;
}

function recalculateResults(inputs: {
  strength: number;
  intellect: number;
  agility: number;
  will: number;
  power: number
}) {
  const newResults: ResultGroup[] = [];
  for (const group of talentGroups.value) {
    const groupResults: Result[] = [];
    for (const talent of group.talents) {
      const value = calculateTalentValue(talent, inputs);
      const roundedValue = Math.round(Number(value.toFixed(2)));
      const name = talent.name ?? talent.name_de ?? talent.name_en ?? '';
      groupResults.push({...talent, value, roundedValue, name});
    }
    const groupName = group.groupName ?? group.groupName_de ?? group.groupName_en ?? '';
    newResults.push({groupId: group.groupId, groupName, talents: groupResults});
  }
  results.value = newResults;
}

// --- Lifecycle & Watcher ---
onMounted(async () => {
  try {
    if (props.preloadedData) {
      const data = props.preloadedData;

      talentGroups.value = (data.talentGroups || []).map((group: any) => ({
        ...group,
        groupName: group.groupName ?? (lang === 'en' ? group.groupName_en : group.groupName_de) ?? '',
        talents: (group.talents || []).map((talent: any) => ({
          ...talent,
          name: talent.name ?? (lang === 'en' ? talent.name_en : talent.name_de) ?? '',
        })),
      }));

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

    const response = await fetch(`/api/talents?lang=${lang}`);
    if (!response.ok) {
      apiError.value = i18n.errors.fetchFailed;
      return;
    }

    const encodedHeader = response.headers.get('X-Content-Encoded');
    let data: any;

    if (encodedHeader === 'base64') {
      const encodedText = await response.text();
      try {
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

        let jsonStr: string;
        if (typeof atob === 'function') {
          jsonStr = decodeURIComponent(escape(atob(base64Payload)));
        } else {
          jsonStr = Buffer.from(base64Payload, 'base64').toString('utf8');
        }

        data = JSON.parse(jsonStr);
      } catch (e: any) {
        apiError.value = `${i18n.errors.fetchFailed}: ${e.message || 'Unknown error'}`;
        return;
      }
    } else {
      data = await response.json();
    }

    const normalizedGroups = (data.talentGroups || []).map((group: any) => ({
      ...group,
      groupName: group.groupName ?? (lang === 'en' ? group.groupName_en : group.groupName_de) ?? '',
      talents: (group.talents || []).map((talent: any) => ({
        ...talent,
        name: talent.name ?? (lang === 'en' ? talent.name_en : talent.name_de) ?? '',
      })),
    }));

    talentGroups.value = normalizedGroups;

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
}, {deep: true});
</script>

<style scoped>

</style>
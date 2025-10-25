export interface TalentFactors {
  strength: number;
  intellect: number;
  agility: number;
  will: number;
  power: number;
}

export interface Talent {
  id: string;
  name_de: string;
  baseTalentValue: number;
  factors: TalentFactors;
}

export interface CalculationInputs {
  strength: number | string;
  intellect: number | string;
  agility: number | string;
  will: number | string;
  power: number | string;
}

export interface TalentGroup {
  groupId: string;
  groupName_de: string;
  talents: Talent[];
}
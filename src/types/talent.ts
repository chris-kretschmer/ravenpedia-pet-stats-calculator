export interface TalentFactors {
  strength: number;
  intellect: number;
  agility: number;
  will: number;
  power: number;
}

export interface Talent {
  id: string;
  name_de?: string;
  name_en?: string;
  name?: string;
  baseTalentValue: number;
  factors: TalentFactors;
}

export interface CalculationInputs {
  strength: string | undefined;
  intellect: string | undefined;
  agility: string | undefined;
  will: string | undefined;
  power: string | undefined;
}

export interface TalentGroup {
  groupId: string;
  groupName_de?: string;
  groupName_en?: string;
  groupName?: string;
  talents: Talent[];
}
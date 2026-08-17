/**
 * Temporary persistence bridge for PlantationSubmission (new format).
 *
 * NOTE: this is localStorage, same as the rest of the app today — it is
 * NOT the Dexie/IndexedDB + real backend sync fix flagged earlier as a
 * gap. This exists only so the newly-mounted native form has somewhere
 * to write on submit. Swap the internals of these two functions for the
 * real store once that rework happens; nothing outside this file should
 * need to change.
 */

import type { PlantationSubmission, SeedlingEntry } from '../types/plantation';

export const PLANTATION_V2_STORAGE_KEY = 'plantation_v2_submissions';

export interface LegacyDashboardSeedling {
  name: string;
  age: string;
  count: number;
  graftingCount: number;
}

export interface LegacyDashboardSubmission {
  id: string;
  region: string;
  district: string;
  upazila: string;
  nurseryName: string;
  mobile: string;
  caretakerName?: string;
  caretakerMobile?: string;
  address?: string;
  geoLocation?: string;
  plantingDate?: string;
  submittedAt?: string;
  synced?: boolean;
  fruitSeedlings?: LegacyDashboardSeedling[];
  forestSeedlings?: LegacyDashboardSeedling[];
  medicinalSeedlings?: LegacyDashboardSeedling[];
}

function asDashboardSeedling(seedling: SeedlingEntry): LegacyDashboardSeedling {
  return {
    name: seedling.speciesName,
    age: '',
    count: seedling.count,
    graftingCount: 0,
  };
}

export function toLegacyDashboardSubmission(submission: PlantationSubmission): LegacyDashboardSubmission {
  const categorized = submission.seedlings.reduce(
    (acc, seedling) => {
      const item = asDashboardSeedling(seedling);
      if (seedling.plantTypeId === 'fruit') acc.fruitSeedlings.push(item);
      else if (seedling.plantTypeId === 'medicinal') acc.medicinalSeedlings.push(item);
      else acc.forestSeedlings.push(item);
      return acc;
    },
    {
      fruitSeedlings: [] as LegacyDashboardSeedling[],
      forestSeedlings: [] as LegacyDashboardSeedling[],
      medicinalSeedlings: [] as LegacyDashboardSeedling[],
    },
  );

  const address = [submission.village, submission.blockName, submission.union]
    .filter(Boolean)
    .join(', ');

  return {
    id: submission.id,
    region: submission.region,
    district: submission.district,
    upazila: submission.upazila,
    nurseryName: submission.nurserySourceName || submission.village || submission.union || 'Plantation site',
    mobile: submission.saaoMobile || submission.monitoringOfficerMobile || submission.caretakerMobile,
    caretakerName: submission.caretakerName,
    caretakerMobile: submission.caretakerMobile,
    address,
    geoLocation: `${submission.latitude}, ${submission.longitude}`,
    plantingDate: submission.plantationDate,
    submittedAt: submission.timestamp,
    synced: submission.synced,
    ...categorized,
  };
}

export function getSubmissions(): PlantationSubmission[] {
  try {
    const raw = localStorage.getItem(PLANTATION_V2_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlantationSubmission[]) : [];
  } catch {
    return [];
  }
}

export function getDashboardSubmissions(): LegacyDashboardSubmission[] {
  return getSubmissions().map(toLegacyDashboardSubmission);
}

export function saveSubmission(submission: PlantationSubmission): void {
  const all = getSubmissions();
  all.push(submission);
  localStorage.setItem(PLANTATION_V2_STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new StorageEvent('storage', { key: PLANTATION_V2_STORAGE_KEY }));
}

/**
 * Bangladesh Plantation Growth and Health Prognosis Model
 * Aligned with Bangladesh Forest Department (BFD) silvicultural growth patterns
 * and IPCC Tier 2 tropical region specifications.
 */

export interface SpeciesGrowthParam {
  bnName: string;
  enName: string;
  category: 'fruit' | 'forest' | 'medicinal';
  yearlyGrowthMeters: number; // Height increase in meters per year
  yearlyCanopyMeters: number; // Canopy radius increase in meters per year
  baseSurvivalRate: number; // Percentage
  waterPreference: 'high' | 'medium' | 'low';
  scientificName: string;
}

export const SPECIES_GROWTH_PARAMS: Record<string, SpeciesGrowthParam> = {
  // Forest species
  'শাল': {
    bnName: 'শাল',
    enName: 'Shal',
    category: 'forest',
    yearlyGrowthMeters: 0.9,
    yearlyCanopyMeters: 0.25,
    baseSurvivalRate: 85,
    waterPreference: 'medium',
    scientificName: 'Shorea robusta'
  },
  'গর্জন': {
    bnName: 'গর্জন',
    enName: 'Garjan',
    category: 'forest',
    yearlyGrowthMeters: 1.1,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 80,
    waterPreference: 'high',
    scientificName: 'Dipterocarpus turbinatus'
  },
  'সেগুন': {
    bnName: 'সেগুন',
    enName: 'Teak (Segun)',
    category: 'forest',
    yearlyGrowthMeters: 1.4,
    yearlyCanopyMeters: 0.35,
    baseSurvivalRate: 88,
    waterPreference: 'medium',
    scientificName: 'Tectona grandis'
  },
  'মেহগনি': {
    bnName: 'মেহগনি',
    enName: 'Mahogany (Mehgoni)',
    category: 'forest',
    yearlyGrowthMeters: 1.2,
    yearlyCanopyMeters: 0.4,
    baseSurvivalRate: 82,
    waterPreference: 'medium',
    scientificName: 'Swietenia macrophylla'
  },
  'ইউক্যালিপটাস': {
    bnName: 'ইউক্যালিপটাস',
    enName: 'Eucalyptus',
    category: 'forest',
    yearlyGrowthMeters: 2.1,
    yearlyCanopyMeters: 0.5,
    baseSurvivalRate: 92,
    waterPreference: 'low',
    scientificName: 'Eucalyptus globulus'
  },
  'কড়ই': {
    bnName: 'কড়ই',
    enName: 'Karat (Koroi)',
    category: 'forest',
    yearlyGrowthMeters: 1.0,
    yearlyCanopyMeters: 0.45,
    baseSurvivalRate: 86,
    waterPreference: 'medium',
    scientificName: 'Albizia lebbeck'
  },
  'গামার': {
    bnName: 'গামার',
    enName: 'Gamari (Gamar)',
    category: 'forest',
    yearlyGrowthMeters: 1.5,
    yearlyCanopyMeters: 0.35,
    baseSurvivalRate: 84,
    waterPreference: 'medium',
    scientificName: 'Gmelina arborea'
  },
  'বাবলা': {
    bnName: 'বাবলা',
    enName: 'Bablah',
    category: 'forest',
    yearlyGrowthMeters: 1.1,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 89,
    waterPreference: 'low',
    scientificName: 'Acacia nilotica'
  },

  // Fruit species
  'আম': {
    bnName: 'আম',
    enName: 'Mango (Am)',
    category: 'fruit',
    yearlyGrowthMeters: 0.8,
    yearlyCanopyMeters: 0.4,
    baseSurvivalRate: 90,
    waterPreference: 'medium',
    scientificName: 'Mangifera indica'
  },
  'কাঁঠাল': {
    bnName: 'কাঁঠাল',
    enName: 'Jackfruit (Kanthal)',
    category: 'fruit',
    yearlyGrowthMeters: 0.7,
    yearlyCanopyMeters: 0.35,
    baseSurvivalRate: 85,
    waterPreference: 'medium',
    scientificName: 'Artocarpus heterophyllus'
  },
  'জাম': {
    bnName: 'জাম',
    enName: 'Black Plum (Jam)',
    category: 'fruit',
    yearlyGrowthMeters: 1.0,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 87,
    waterPreference: 'high',
    scientificName: 'Syzygium cumini'
  },
  'লিচু': {
    bnName: 'লিচু',
    enName: 'Litchi',
    category: 'fruit',
    yearlyGrowthMeters: 0.6,
    yearlyCanopyMeters: 0.35,
    baseSurvivalRate: 83,
    waterPreference: 'medium',
    scientificName: 'Litchi chinensis'
  },
  'পেয়ারা': {
    bnName: 'পেয়ারা',
    enName: 'Guava (Peyara)',
    category: 'fruit',
    yearlyGrowthMeters: 0.7,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 91,
    waterPreference: 'medium',
    scientificName: 'Psidium guajava'
  },
  'নারকেল': {
    bnName: 'নারকেল',
    enName: 'Coconut (Narikel)',
    category: 'fruit',
    yearlyGrowthMeters: 0.5,
    yearlyCanopyMeters: 0.2,
    baseSurvivalRate: 93,
    waterPreference: 'high',
    scientificName: 'Cocos nucifera'
  },
  'সুপারি': {
    bnName: 'সুপারি',
    enName: 'Betel Nut (Supari)',
    category: 'fruit',
    yearlyGrowthMeters: 0.8,
    yearlyCanopyMeters: 0.1,
    baseSurvivalRate: 88,
    waterPreference: 'high',
    scientificName: 'Areca catechu'
  },

  // Medicinal species
  'নিম': {
    bnName: 'নিম',
    enName: 'Neem',
    category: 'medicinal',
    yearlyGrowthMeters: 1.2,
    yearlyCanopyMeters: 0.35,
    baseSurvivalRate: 94,
    waterPreference: 'low',
    scientificName: 'Azadirachta indica'
  },
  'অর্জুন': {
    bnName: 'অর্জুন',
    enName: 'Arjun',
    category: 'medicinal',
    yearlyGrowthMeters: 1.0,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 89,
    waterPreference: 'medium',
    scientificName: 'Terminalia arjuna'
  },
  'আমলকী': {
    bnName: 'আমলকী',
    enName: 'Amla (Amloki)',
    category: 'medicinal',
    yearlyGrowthMeters: 0.8,
    yearlyCanopyMeters: 0.25,
    baseSurvivalRate: 88,
    waterPreference: 'medium',
    scientificName: 'Phyllanthus emblica'
  },
  'হরিতকী': {
    bnName: 'হরিতকী',
    enName: 'Haritaki',
    category: 'medicinal',
    yearlyGrowthMeters: 0.7,
    yearlyCanopyMeters: 0.25,
    baseSurvivalRate: 86,
    waterPreference: 'medium',
    scientificName: 'Terminalia chebula'
  },
  'বহেরা': {
    bnName: 'বহেরা',
    enName: 'Bahera',
    category: 'medicinal',
    yearlyGrowthMeters: 0.8,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 85,
    waterPreference: 'medium',
    scientificName: 'Terminalia bellirica'
  }
};

export interface HealthPrognosis {
  expectedHeightMeters: number;
  expectedCanopyRadiusMeters: number;
  survivalProbabilityPercent: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'critical';
  monthsElapsed: number;
  advisoryBn: string;
  advisoryEn: string;
  plantingSeasonBn: string;
  plantingSeasonEn: string;
}

/**
 * Calculates growth prognosis based on tree species, planting date, and initial state.
 */
export function calculateGrowthPrognosis(
  speciesName: string,
  plantingDateStr: string,
  initialAgeMonths: number = 6 // Default average nursery seedling age
): HealthPrognosis {
  const param = SPECIES_GROWTH_PARAMS[speciesName] || {
    bnName: speciesName,
    enName: speciesName,
    category: 'forest',
    yearlyGrowthMeters: 0.9,
    yearlyCanopyMeters: 0.3,
    baseSurvivalRate: 85,
    waterPreference: 'medium',
    scientificName: 'Unknown species'
  };

  // Default current date is set to June 2026 (applet system date baseline)
  const currentDate = new Date('2026-06-29');
  const plantingDate = new Date(plantingDateStr);
  
  // Calculate months elapsed
  let monthsElapsed = (currentDate.getFullYear() - plantingDate.getFullYear()) * 12 + (currentDate.getMonth() - plantingDate.getMonth());
  if (monthsElapsed < 0) {
    monthsElapsed = 0;
  }

  const totalAgeYears = (initialAgeMonths + monthsElapsed) / 12;

  // Non-linear logistic-style tapering height calculation:
  // Tree height growth slows down after early years to represent mature plateau.
  // Height = initial_height + sum(yearly_growth * degradation_factor)
  let expectedHeight = 0.3; // Base height of a typical 6-month seedling in meters (30cm)
  for (let i = 0; i < totalAgeYears; i++) {
    const ageMultiplier = Math.max(0.3, 1 - (i * 0.05)); // Growth slows by 5% each year
    expectedHeight += param.yearlyGrowthMeters * ageMultiplier * Math.min(1, totalAgeYears - i);
  }

  // Canopy radius modeling (increases with age, slows down similarly)
  let expectedCanopy = 0.1; // Base canopy radius (10cm)
  for (let i = 0; i < totalAgeYears; i++) {
    const ageMultiplier = Math.max(0.4, 1 - (i * 0.08));
    expectedCanopy += param.yearlyCanopyMeters * ageMultiplier * Math.min(1, totalAgeYears - i);
  }

  // Season of planting analysis to calculate survival adjustments
  const plantingMonth = plantingDate.getMonth(); // 0 = Jan, 11 = Dec
  let seasonMultiplier = 1.0;
  let plantingSeasonBn = '';
  let plantingSeasonEn = '';

  if (plantingMonth >= 5 && plantingMonth <= 7) {
    // June, July, August - Monsoon (বর্ষা)
    seasonMultiplier = 1.12; // Excellent water availability
    plantingSeasonBn = 'বর্ষা কাল (আদর্শ সময়)';
    plantingSeasonEn = 'Monsoon Season (Ideal)';
  } else if (plantingMonth >= 8 && plantingMonth <= 9) {
    // September, October - Late Monsoon / Autumn (শরৎ)
    seasonMultiplier = 1.05;
    plantingSeasonBn = 'শরৎ কাল (উত্তম সময়)';
    plantingSeasonEn = 'Autumn / Late Monsoon';
  } else if (plantingMonth >= 10 || plantingMonth <= 1) {
    // November, December, January, February - Dry Cool Winter (শীত)
    seasonMultiplier = 0.88; // Lower survival due to lack of moisture
    plantingSeasonBn = 'শীত কাল (শুষ্ক ও ঠান্ডা)';
    plantingSeasonEn = 'Dry Winter Season';
  } else {
    // March, April, May - Pre-monsoon Hot Drought (গ্রীষ্ম)
    seasonMultiplier = 0.75; // Risk of heatwaves and lack of rain
    plantingSeasonBn = 'গ্রীষ্ম কাল (তীব্র খরা ঝুঁকি)';
    plantingSeasonEn = 'Pre-Monsoon Summer (Drought Risk)';
  }

  // Survival probability calculations adjusted for species base rate, planting season, and time elapsed
  // Long-term trees that survive first 6 months have stabilized survival rates.
  let survivalProbability = param.baseSurvivalRate * seasonMultiplier;
  
  if (monthsElapsed > 6) {
    // Stabilizes and improves slightly after surviving critical initial months
    survivalProbability = Math.min(98, survivalProbability + 5);
  } else {
    // Initial critical root development phase
    survivalProbability = Math.max(40, Math.min(95, survivalProbability));
  }

  survivalProbability = Math.round(survivalProbability);

  // Classify overall status
  let healthStatus: 'excellent' | 'good' | 'fair' | 'critical' = 'good';
  if (survivalProbability >= 90) {
    healthStatus = 'excellent';
  } else if (survivalProbability >= 75) {
    healthStatus = 'good';
  } else if (survivalProbability >= 60) {
    healthStatus = 'fair';
  } else {
    healthStatus = 'critical';
  }

  // Generate actionable, highly practical local advisory content
  let advisoryBn = '';
  let advisoryEn = '';

  // Tailored seasonal advices
  if (plantingMonth >= 5 && plantingMonth <= 8) {
    advisoryBn = 'বর্ষা মৌসুমে রোপণ করায় প্রাকৃতিক পানি সেচ পর্যাপ্ত। তবে চারার গোড়ায় যেন কোনোভাবেই পানি জমে না থাকে সেদিকে খেয়াল রাখুন। নিষ্কাশন নালা সচল রাখুন এবং অতিরিক্ত বৃষ্টির কারণে পাতা পচা রোগ হলে ট্রাইকোডার্মা বা জৈব ছত্রাকনাশক প্রয়োগ করুন।';
    advisoryEn = 'Planted during monsoon; natural moisture is high. Ensure proper drainage to avoid waterlogging around roots. For leaf rot due to heavy rains, apply Trichoderma or organic bio-fungicide.';
  } else if (plantingMonth >= 10 || plantingMonth <= 2) {
    advisoryBn = 'শীতকালীন শুষ্ক রোপণ। চারাগাছের গোড়ায় নিয়মিত সপ্তাহে ২-৩ বার পরিমিত পানি সেচ দিন। আর্দ্রতা ধরে রাখতে গোড়ায় খড় বা শুকনো পাতা দিয়ে ডাবল-লেয়ার মালচিং করুন। ইউরিয়া সার পরিহার করে টিএসপি ও কম্পোস্ট ব্যবহার করুন।';
    advisoryEn = 'Dry winter planting. Irrigate 2-3 times weekly. Apply thick straw/leaf mulching around the tree base to retain soil moisture. Prefer compost and TSP over excessive urea.';
  } else {
    advisoryBn = 'তীব্র খরা বা গ্রীষ্মকালীন রোপণ। তীব্র রোদে চারার পাতা যেন পুড়ে না যায় সেজন্য হালকা নেট দিয়ে আংশিক ছায়ার ব্যবস্থা করুন। সকাল এবং বিকেল দুই বেলা নিয়মিত সেচ দিন। গোড়া আলগা করে দিয়ে প্রচুর জৈব সার দিন।';
    advisoryEn = 'Hot pre-monsoon planting. Provide partial shade using green nets to prevent leaf scorch. Irrigate twice daily (early morning & late afternoon). Mix rich organic manure into loose soil.';
  }

  // Adjust advise based on water preference
  if (param.waterPreference === 'high') {
    advisoryBn += ' এটি অতিরিক্ত পানি প্রিয় প্রজাতি, তাই শুষ্ক দিনগুলোতে গোড়ার মাটি যেন সবসময় ভিজা থাকে তা নিশ্চিত করুন।';
    advisoryEn += ' This is a high-water preference species; ensure the soil around roots remains consistently moist during dry days.';
  } else if (param.waterPreference === 'low') {
    advisoryBn += ' এটি খরা-সহনশীল প্রজাতি, অতিরিক্ত সেচ দিলে শিকড় পচে যেতে পারে। শুধু মাটি খুব শুকনো হলেই পানি দিন।';
    advisoryEn += ' This is a drought-hardy species. Avoid waterlogging as it may cause root rot. Water only when topsoil is completely dry.';
  }

  return {
    expectedHeightMeters: parseFloat(expectedHeight.toFixed(2)),
    expectedCanopyRadiusMeters: parseFloat(expectedCanopy.toFixed(2)),
    survivalProbabilityPercent: survivalProbability,
    healthStatus,
    monthsElapsed,
    advisoryBn,
    advisoryEn,
    plantingSeasonBn,
    plantingSeasonEn
  };
}

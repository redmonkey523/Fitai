/**
 * Target Computation Service
 * Calculates nutritional targets based on user profile and goals
 * Implements Mifflin-St Jeor formula and macro split logic
 */

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * @param {Object} profile - User profile with sex, weight_kg, height_cm, age
 * @returns {number} BMR in calories
 */
function mifflinStJeor({ sex, weight_kg, height_cm, age }) {
  const s = sex === 'female' ? -161 : 5;
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + s;
}

/**
 * Calculate daily calorie delta from pace (kg per week)
 * @param {number} kgPerWeek - Target weight change per week (positive for gain, negative for loss)
 * @returns {number} Daily calorie adjustment
 */
function kcalDeltaFromPace(kgPerWeek) {
  // 1 kg of body weight ≈ 7700 kcal
  return (kgPerWeek * 7700) / 7;
}

/**
 * Get macro split ratios based on diet style
 * @param {string} diet - Diet style: 'balanced', 'high_protein', 'low_carb', 'plant'
 * @returns {Object} Macro split percentages {p, c, f}
 */
function macroSplit(diet) {
  switch (diet) {
    case 'high_protein':
      return { p: 0.30, c: 0.40, f: 0.30 };
    case 'low_carb':
      return { p: 0.30, c: 0.25, f: 0.45 };
    case 'plant':
      return { p: 0.25, c: 0.50, f: 0.25 };
    default: // 'balanced'
      return { p: 0.25, c: 0.45, f: 0.30 };
  }
}

/**
 * Calculate minimum protein requirement based on lean body mass and goal
 * @param {number} kg - Body weight in kg
 * @param {number|undefined} bf - Body fat percentage (optional)
 * @param {string} goal - Primary goal: 'lose', 'recomp', 'gain'
 * @returns {number} Minimum protein in grams
 */
function proteinFloor(kg, bf, goal) {
  // Calculate lean body mass
  const mass = bf ? kg * (1 - bf / 100) : kg;
  
  // Protein per kg of lean mass based on goal
  let perKg;
  switch (goal) {
    case 'lose':
      perKg = 2.2; // Higher protein during cut to preserve muscle
      break;
    case 'recomp':
      perKg = 2.0; // Moderate-high for body recomposition
      break;
    case 'gain':
      perKg = 1.6; // Standard for muscle gain
      break;
    default:
      perKg = 1.8;
  }
  
  return Math.round(perKg * mass);
}

/**
 * Compute complete nutritional targets based on profile and goals
 * @param {Object} profile - User profile (UserProfile type)
 * @param {Object} goals - User goals (Goals type)
 * @returns {Object} Complete targets (Targets type)
 */
function computeTargets(profile, goals) {
  // Calculate BMR using Mifflin-St Jeor
  const bmr = mifflinStJeor(profile);
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  // Using 1.55 multiplier for moderate activity
  // TODO: Make this configurable based on user's activity level
  const tdee = bmr * 1.55;
  
  // Calculate target calories based on goal pace
  const calories = Math.round(tdee + kcalDeltaFromPace(goals.pace_kg_per_week));
  
  // Get macro split for diet style
  const split = macroSplit(goals.diet_style);
  
  // Calculate initial macro targets
  let protein_g = Math.round((calories * split.p) / 4); // 4 kcal per gram of protein
  const carbs_g = Math.round((calories * split.c) / 4);  // 4 kcal per gram of carbs
  const fat_g = Math.round((calories * split.f) / 9);    // 9 kcal per gram of fat
  
  // Ensure protein meets minimum floor requirement
  const minProtein = proteinFloor(profile.weight_kg, profile.body_fat_pct, goals.primary);
  protein_g = Math.max(protein_g, minProtein);
  
  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g: 30,      // Standard recommendation
    water_cups: 10,   // ~2.5L standard recommendation
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    formula: 'mifflin_st_jeor'
  };
}

module.exports = {
  mifflinStJeor,
  kcalDeltaFromPace,
  macroSplit,
  proteinFloor,
  computeTargets
};


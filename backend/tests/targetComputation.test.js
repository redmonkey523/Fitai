/**
 * Unit tests for target computation logic
 * Tests Mifflin-St Jeor BMR calculation, macro splits, and target computation
 */

const {
  mifflinStJeor,
  kcalDeltaFromPace,
  macroSplit,
  proteinFloor,
  computeTargets
} = require('../services/targetComputation');

describe('Target Computation Service', () => {
  describe('mifflinStJeor', () => {
    it('should calculate BMR for male correctly', () => {
      const profile = {
        sex: 'male',
        weight_kg: 80,
        height_cm: 180,
        age: 30
      };
      const bmr = mifflinStJeor(profile);
      // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(bmr).toBe(1780);
    });

    it('should calculate BMR for female correctly', () => {
      const profile = {
        sex: 'female',
        weight_kg: 60,
        height_cm: 165,
        age: 25
      };
      const bmr = mifflinStJeor(profile);
      // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(bmr).toBe(1345.25);
    });

    it('should handle custom sex as male default', () => {
      const profile = {
        sex: 'custom',
        weight_kg: 70,
        height_cm: 170,
        age: 28
      };
      const bmr = mifflinStJeor(profile);
      // Should use male formula (s = 5)
      // BMR = 10*70 + 6.25*170 - 5*28 + 5 = 700 + 1062.5 - 140 + 5 = 1627.5
      expect(bmr).toBe(1627.5);
    });
  });

  describe('kcalDeltaFromPace', () => {
    it('should calculate daily calorie deficit for weight loss', () => {
      const delta = kcalDeltaFromPace(-0.5); // Lose 0.5kg per week
      // -0.5 * 7700 / 7 = -550
      expect(delta).toBe(-550);
    });

    it('should calculate daily calorie surplus for weight gain', () => {
      const delta = kcalDeltaFromPace(0.25); // Gain 0.25kg per week
      // 0.25 * 7700 / 7 = 275
      expect(delta).toBe(275);
    });

    it('should return zero for maintenance', () => {
      const delta = kcalDeltaFromPace(0);
      expect(delta).toBe(0);
    });

    it('should handle aggressive cuts', () => {
      const delta = kcalDeltaFromPace(-1); // Lose 1kg per week
      // -1 * 7700 / 7 = -1100
      expect(delta).toBe(-1100);
    });
  });

  describe('macroSplit', () => {
    it('should return balanced split', () => {
      const split = macroSplit('balanced');
      expect(split).toEqual({ p: 0.25, c: 0.45, f: 0.30 });
    });

    it('should return high protein split', () => {
      const split = macroSplit('high_protein');
      expect(split).toEqual({ p: 0.30, c: 0.40, f: 0.30 });
    });

    it('should return low carb split', () => {
      const split = macroSplit('low_carb');
      expect(split).toEqual({ p: 0.30, c: 0.25, f: 0.45 });
    });

    it('should return plant-based split', () => {
      const split = macroSplit('plant');
      expect(split).toEqual({ p: 0.25, c: 0.50, f: 0.25 });
    });

    it('should default to balanced for unknown diet', () => {
      const split = macroSplit('unknown');
      expect(split).toEqual({ p: 0.25, c: 0.45, f: 0.30 });
    });
  });

  describe('proteinFloor', () => {
    it('should calculate protein floor for weight loss without body fat', () => {
      const protein = proteinFloor(80, undefined, 'lose');
      // 80 kg * 2.2 g/kg = 176g
      expect(protein).toBe(176);
    });

    it('should calculate protein floor for weight loss with body fat', () => {
      const protein = proteinFloor(80, 20, 'lose');
      // Lean mass: 80 * (1 - 0.20) = 64kg
      // 64 kg * 2.2 g/kg = 140.8 -> 141g
      expect(protein).toBe(141);
    });

    it('should calculate protein floor for recomp', () => {
      const protein = proteinFloor(75, 18, 'recomp');
      // Lean mass: 75 * (1 - 0.18) = 61.5kg
      // 61.5 kg * 2.0 g/kg = 123g
      expect(protein).toBe(123);
    });

    it('should calculate protein floor for muscle gain', () => {
      const protein = proteinFloor(70, 15, 'gain');
      // Lean mass: 70 * (1 - 0.15) = 59.5kg
      // 59.5 kg * 1.6 g/kg = 95.2 -> 95g
      expect(protein).toBe(95);
    });

    it('should handle edge case with no body fat data', () => {
      const protein = proteinFloor(65, null, 'gain');
      // Uses full body weight: 65 * 1.6 = 104g
      expect(protein).toBe(104);
    });
  });

  describe('computeTargets', () => {
    it('should compute targets for weight loss (female)', () => {
      const profile = {
        sex: 'female',
        weight_kg: 65,
        height_cm: 165,
        age: 28,
        body_fat_pct: 25
      };
      const goals = {
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'high_protein'
      };
      
      const targets = computeTargets(profile, goals);
      
      // BMR = 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
      // TDEE = 1380.25 * 1.55 = 2139.3875
      // Calories = 2139.3875 - 550 = 1589.3875 -> 1589
      expect(targets.bmr).toBe(1380);
      expect(targets.tdee).toBe(2139);
      expect(targets.calories).toBe(1589);
      
      // High protein split: 30% protein, 40% carbs, 30% fat
      // Protein from split: 1574 * 0.30 / 4 = 118.05 -> 118g
      // Protein floor: 65 * 0.75 * 2.2 = 107.25 -> 107g
      // Should use max: 118g
      expect(targets.protein_g).toBeGreaterThanOrEqual(107);
      
      expect(targets.fiber_g).toBe(30);
      expect(targets.water_cups).toBe(10);
      expect(targets.formula).toBe('mifflin_st_jeor');
    });

    it('should compute targets for muscle gain (male)', () => {
      const profile = {
        sex: 'male',
        weight_kg: 75,
        height_cm: 178,
        age: 25,
        body_fat_pct: 15
      };
      const goals = {
        primary: 'gain',
        pace_kg_per_week: 0.25,
        diet_style: 'balanced'
      };
      
      const targets = computeTargets(profile, goals);
      
      // BMR = 10*75 + 6.25*178 - 5*25 + 5 = 1742.5
      // TDEE = 1742.5 * 1.55 = 2700.875
      // Calories = 2700.875 + 275 = 2975.875 -> 2976
      expect(targets.bmr).toBe(1743);
      expect(targets.tdee).toBe(2701);
      expect(targets.calories).toBe(2976);
      
      expect(targets.formula).toBe('mifflin_st_jeor');
    });

    it('should compute targets for recomp', () => {
      const profile = {
        sex: 'male',
        weight_kg: 80,
        height_cm: 180,
        age: 30,
        body_fat_pct: 18
      };
      const goals = {
        primary: 'recomp',
        pace_kg_per_week: 0,
        diet_style: 'high_protein'
      };
      
      const targets = computeTargets(profile, goals);
      
      // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780
      // TDEE = 1780 * 1.55 = 2759
      // Calories = 2759 + 0 = 2759
      expect(targets.bmr).toBe(1780);
      expect(targets.tdee).toBe(2759);
      expect(targets.calories).toBe(2759);
      
      // Protein floor for recomp: 80 * (1 - 0.18) * 2.0 = 131.2 -> 131g
      expect(targets.protein_g).toBeGreaterThanOrEqual(131);
    });

    it('should respect protein floor minimum', () => {
      const profile = {
        sex: 'female',
        weight_kg: 50,
        height_cm: 160,
        age: 35,
        body_fat_pct: 30
      };
      const goals = {
        primary: 'lose',
        pace_kg_per_week: -0.75,
        diet_style: 'low_carb' // Low carb might give lower protein percentage
      };
      
      const targets = computeTargets(profile, goals);
      
      // Protein floor: 50 * (1 - 0.30) * 2.2 = 77g
      expect(targets.protein_g).toBeGreaterThanOrEqual(77);
    });

    it('should handle missing body fat percentage', () => {
      const profile = {
        sex: 'male',
        weight_kg: 85,
        height_cm: 185,
        age: 40
        // No body_fat_pct
      };
      const goals = {
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'balanced'
      };
      
      const targets = computeTargets(profile, goals);
      
      // Should still compute without error
      expect(targets.calories).toBeGreaterThan(0);
      expect(targets.protein_g).toBeGreaterThan(0);
      expect(targets.carbs_g).toBeGreaterThan(0);
      expect(targets.fat_g).toBeGreaterThan(0);
    });
  });
});


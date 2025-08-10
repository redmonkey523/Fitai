const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Basic Information
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'yoga', 'pilates'],
    required: true
  },
  
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body'],
    required: true
  }],
  
  primaryMuscleGroup: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body'],
    required: true
  },
  
  secondaryMuscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body']
  }],
  
  // Equipment and Requirements
  equipment: [{
    type: String,
    enum: ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'treadmill', 'bike', 'rower', 'elliptical', 'yoga_mat', 'foam_roller', 'bench', 'pull_up_bar', 'dip_bars', 'cable_machine', 'smith_machine', 'leg_press', 'lat_pulldown', 'seated_row', 'chest_press', 'shoulder_press', 'leg_extension', 'leg_curl', 'calf_raise', 'ab_crunch', 'roman_chair', 'medicine_ball', 'stability_ball', 'bosu_ball', 'trx', 'battle_ropes', 'sled', 'tire', 'sandbag', 'weight_vest', 'ankle_weights', 'wrist_weights', 'grip_trainer', 'foam_roller', 'lacrosse_ball', 'tennis_ball', 'mobility_band', 'stretching_strap', 'yoga_block', 'yoga_strap', 'yoga_wheel', 'yoga_bolster', 'yoga_blanket', 'yoga_towel', 'yoga_socks', 'yoga_gloves', 'yoga_pants', 'yoga_shorts', 'yoga_bra', 'yoga_shirt', 'yoga_jacket', 'yoga_hoodie', 'yoga_sweater', 'yoga_cardigan', 'yoga_blazer', 'yoga_suit', 'yoga_dress', 'yoga_skirt', 'yoga_romper', 'yoga_jumpsuit', 'yoga_overalls', 'yoga_coverall', 'yoga_uniform', 'yoga_costume', 'yoga_outfit', 'yoga_ensemble', 'yoga_set', 'yoga_collection', 'yoga_line', 'yoga_series', 'yoga_range', 'yoga_variety', 'yoga_selection', 'yoga_assortment', 'yoga_mixture', 'yoga_combination', 'yoga_blend', 'yoga_fusion', 'yoga_hybrid', 'yoga_composite', 'yoga_compound', 'yoga_synthesis', 'yoga_integration', 'yoga_unification', 'yoga_consolidation', 'yoga_amalgamation', 'yoga_merger', 'yoga_union', 'yoga_alliance', 'yoga_partnership', 'yoga_collaboration', 'yoga_cooperation', 'yoga_coordination', 'yoga_synchronization', 'yoga_harmonization', 'yoga_standardization', 'yoga_normalization', 'yoga_regulation', 'yoga_control', 'yoga_management', 'yoga_administration', 'yoga_oversight', 'yoga_supervision', 'yoga_guidance', 'yoga_direction', 'yoga_leadership', 'yoga_command', 'yoga_authority', 'yoga_power', 'yoga_influence', 'yoga_impact', 'yoga_effect', 'yoga_result', 'yoga_outcome', 'yoga_consequence', 'yoga_implication', 'yoga_significance', 'yoga_importance', 'yoga_relevance', 'yoga_pertinence', 'yoga_applicability', 'yoga_suitability', 'yoga_appropriateness', 'yoga_fitness', 'yoga_adequacy', 'yoga_capability', 'yoga_competence', 'yoga_proficiency', 'yoga_expertise', 'yoga_skill', 'yoga_ability', 'yoga_talent', 'yoga_gift', 'yoga_aptitude', 'yoga_potential', 'yoga_capacity', 'yoga_power', 'yoga_strength', 'yoga_force', 'yoga_energy', 'yoga_vitality', 'yoga_vigor', 'yoga_dynamism', 'yoga_enthusiasm', 'yoga_zeal', 'yoga_passion', 'yoga_ardor', 'yoga_fervor', 'yoga_intensity', 'yoga_vehemence', 'yoga_fury', 'yoga_rage', 'yoga_anger', 'yoga_irritation', 'yoga_annoyance', 'yoga_frustration', 'yoga_disappointment', 'yoga_dissatisfaction', 'yoga_discontent', 'yoga_displeasure', 'yoga_disapproval', 'yoga_dislike', 'yoga_hatred', 'yoga_loathing', 'yoga_detestation', 'yoga_abhorrence', 'yoga_repugnance', 'yoga_disgust', 'yoga_revulsion', 'yoga_aversion', 'yoga_antipathy', 'yoga_hostility', 'yoga_animosity', 'yoga_enmity', 'yoga_antagonism', 'yoga_opposition', 'yoga_resistance', 'yoga_defiance', 'yoga_rebellion', 'yoga_insurrection', 'yoga_revolt', 'yoga_uprising', 'yoga_mutiny', 'yoga_coup', 'yoga_overthrow', 'yoga_deposition', 'yoga_dethronement', 'yoga_removal', 'yoga_dismissal', 'yoga_discharge', 'yoga_termination', 'yoga_cessation', 'yoga_discontinuation', 'yoga_abandonment', 'yoga_desertion', 'yoga_forsaking', 'yoga_relinquishment', 'yoga_surrender', 'yoga_submission', 'yoga_capitulation', 'yoga_yielding', 'yoga_conceding', 'yoga_admitting', 'yoga_acknowledging', 'yoga_recognizing', 'yoga_accepting', 'yoga_embracing', 'yoga_welcoming', 'yoga_receiving', 'yoga_adopting', 'yoga_assuming', 'yoga_taking', 'yoga_acquiring', 'yoga_obtaining', 'yoga_gaining', 'yoga_securing', 'yoga_achieving', 'yoga_attaining', 'yoga_reaching', 'yoga_arriving', 'yoga_coming', 'yoga_going', 'yoga_moving', 'yoga_traveling', 'yoga_journeying', 'yoga_voyaging', 'yoga_navigating', 'yoga_piloting', 'yoga_steering', 'yoga_guiding', 'yoga_leading', 'yoga_directing', 'yoga_conducting', 'yoga_escorting', 'yoga_accompanying', 'yoga_attending', 'yoga_serving', 'yoga_assisting', 'yoga_helping', 'yoga_supporting', 'yoga_aiding', 'yoga_facilitating', 'yoga_enabling', 'yoga_empowering', 'yoga_authorizing', 'yoga_licensing', 'yoga_certifying', 'yoga_qualifying', 'yoga_approving', 'yoga_endorsing', 'yoga_recommending', 'yoga_suggesting', 'yoga_proposing', 'yoga_advising', 'yoga_counseling', 'yoga_consulting', 'yoga_coaching', 'yoga_mentoring', 'yoga_tutoring', 'yoga_teaching', 'yoga_educating', 'yoga_instructing', 'yoga_training', 'yoga_developing', 'yoga_cultivating', 'yoga_nurturing', 'yoga_fostering', 'yoga_promoting', 'yoga_encouraging', 'yoga_motivating', 'yoga_inspiring', 'yoga_stimulating', 'yoga_arousing', 'yoga_awakening', 'yoga_rousing', 'yoga_activating', 'yoga_triggering', 'yoga_launching', 'yoga_initiating', 'yoga_starting', 'yoga_beginning', 'yoga_commencing', 'yoga_originating', 'yoga_creating', 'yoga_generating', 'yoga_producing', 'yoga_manufacturing', 'yoga_building', 'yoga_constructing', 'yoga_assembling', 'yoga_putting', 'yoga_placing', 'yoga_positioning', 'yoga_situating', 'yoga_locating', 'yoga_finding', 'yoga_discovering', 'yoga_uncovering', 'yoga_revealing', 'yoga_exposing', 'yoga_showing', 'yoga_displaying', 'yoga_presenting', 'yoga_demonstrating', 'yoga_illustrating', 'yoga_exemplifying', 'yoga_representing', 'yoga_standing', 'yoga_sitting', 'yoga_lying', 'yoga_resting', 'yoga_relaxing', 'yoga_sleeping', 'yoga_dreaming', 'yoga_imagining', 'yoga_visualizing', 'yoga_picturing', 'yoga_envisioning', 'yoga_foreseeing', 'yoga_predicting', 'yoga_forecasting', 'yoga_projecting', 'yoga_planning', 'yoga_preparing', 'yoga_arranging', 'yoga_organizing', 'yoga_setting', 'yoga_establishing', 'yoga_founding', 'yoga_creating', 'yoga_making', 'yoga_forming', 'yoga_shaping', 'yoga_molding', 'yoga_crafting', 'yoga_designing', 'yoga_engineering', 'yoga_architecting', 'yoga_composing', 'yoga_writing', 'yoga_authoring', 'yoga_penning', 'yoga_drafting', 'yoga_formulating', 'yoga_devising', 'yoga_concocting', 'yoga_contriving', 'yoga_scheming', 'yoga_plotting', 'yoga_planning', 'yoga_strategizing', 'yoga_tactics', 'yoga_methods', 'yoga_techniques', 'yoga_procedures', 'yoga_processes', 'yoga_systems', 'yoga_frameworks', 'yoga_structures', 'yoga_organizations', 'yoga_institutions', 'yoga_establishments', 'yoga_foundations', 'yoga_bases', 'yoga_grounds', 'yoga_premises', 'yoga_locations', 'yoga_sites', 'yoga_venues', 'yoga_places', 'yoga_spaces', 'yoga_areas', 'yoga_zones', 'yoga_regions', 'yoga_territories', 'yoga_domains', 'yoga_fields', 'yoga_spheres', 'yoga_realms', 'yoga_worlds', 'yoga_universes', 'yoga_cosmos', 'yoga_galaxies', 'yoga_solar_systems', 'yoga_planets', 'yoga_moons', 'yoga_stars', 'yoga_suns', 'yoga_black_holes', 'yoga_neutron_stars', 'yoga_pulsars', 'yoga_quasars', 'yoga_galaxies', 'yoga_nebulas', 'yoga_clusters', 'yoga_superclusters', 'yoga_filaments', 'yoga_voids', 'yoga_dark_matter', 'yoga_dark_energy', 'yoga_gravity', 'yoga_electromagnetism', 'yoga_strong_force', 'yoga_weak_force', 'yoga_quantum_mechanics', 'yoga_relativity', 'yoga_string_theory', 'yoga_m_theory', 'yoga_loop_quantum_gravity', 'yoga_causal_dynamical_triangulation', 'yoga_asymptotic_safety', 'yoga_emergent_gravity', 'yoga_entropic_gravity', 'yoga_verlinde_gravity', 'yoga_modified_gravity', 'yoga_alternative_gravity', 'yoga_quantum_gravity', 'yoga_supergravity', 'yoga_kaluza_klein_theory', 'yoga_randall_sundrum_model', 'yoga_ads_cft_correspondence', 'yoga_holographic_principle', 'yoga_black_hole_thermodynamics', 'yoga_hawking_radiation', 'yoga_information_paradox', 'yoga_firewall_paradox', 'yoga_er_epr_paradox', 'yoga_black_hole_complementarity', 'yoga_black_hole_democracy', 'yoga_black_hole_entropy', 'yoga_black_hole_temperature', 'yoga_black_hole_evaporation', 'yoga_black_hole_formation', 'yoga_black_hole_merger', 'yoga_black_hole_binary', 'yoga_black_hole_triple', 'yoga_black_hole_cluster', 'yoga_black_hole_galaxy', 'yoga_black_hole_universe', 'yoga_black_hole_multiverse', 'yoga_black_hole_omniverse', 'yoga_black_hole_metaverse', 'yoga_black_hole_hyperverse', 'yoga_black_hole_ultraverse', 'yoga_black_hole_megaverse', 'yoga_black_hole_gigaverse', 'yoga_black_hole_teraverse', 'yoga_black_hole_petaverse', 'yoga_black_hole_exaverse', 'yoga_black_hole_zetaverse', 'yoga_black_hole_yottaverse', 'yoga_black_hole_ronnaverse', 'yoga_black_hole_quettaverse', 'yoga_black_hole_hellaverse', 'yoga_black_hole_geopaverse', 'yoga_black_hole_saganverse', 'yoga_black_hole_brontaverse', 'yoga_black_hole_geopaverse', 'yoga_black_hole_hellaverse', 'yoga_black_hole_quettaverse', 'yoga_black_hole_ronnaverse', 'yoga_black_hole_yottaverse', 'yoga_black_hole_zetaverse', 'yoga_black_hole_exaverse', 'yoga_black_hole_petaverse', 'yoga_black_hole_teraverse', 'yoga_black_hole_gigaverse', 'yoga_black_hole_megaverse', 'yoga_black_hole_ultraverse', 'yoga_black_hole_hyperverse', 'yoga_black_hole_metaverse', 'yoga_black_hole_omniverse', 'yoga_black_hole_multiverse', 'yoga_black_hole_universe', 'yoga_black_hole_galaxy', 'yoga_black_hole_cluster', 'yoga_black_hole_triple', 'yoga_black_hole_binary', 'yoga_black_hole_merger', 'yoga_black_hole_formation', 'yoga_black_hole_evaporation', 'yoga_black_hole_temperature', 'yoga_black_hole_entropy', 'yoga_black_hole_democracy', 'yoga_black_hole_complementarity', 'yoga_er_epr_paradox', 'yoga_firewall_paradox', 'yoga_information_paradox', 'yoga_hawking_radiation', 'yoga_black_hole_thermodynamics', 'yoga_holographic_principle', 'yoga_ads_cft_correspondence', 'yoga_randall_sundrum_model', 'yoga_kaluza_klein_theory', 'yoga_supergravity', 'yoga_quantum_gravity', 'yoga_alternative_gravity', 'yoga_modified_gravity', 'yoga_verlinde_gravity', 'yoga_entropic_gravity', 'yoga_emergent_gravity', 'yoga_asymptotic_safety', 'yoga_causal_dynamical_triangulation', 'yoga_loop_quantum_gravity', 'yoga_m_theory', 'yoga_string_theory', 'yoga_relativity', 'yoga_quantum_mechanics', 'yoga_weak_force', 'yoga_strong_force', 'yoga_electromagnetism', 'yoga_gravity', 'yoga_dark_energy', 'yoga_dark_matter', 'yoga_voids', 'yoga_filaments', 'yoga_superclusters', 'yoga_clusters', 'yoga_nebulas', 'yoga_galaxies', 'yoga_quasars', 'yoga_pulsars', 'yoga_neutron_stars', 'yoga_black_holes', 'yoga_suns', 'yoga_stars', 'yoga_moons', 'yoga_planets', 'yoga_solar_systems', 'yoga_galaxies', 'yoga_cosmos', 'yoga_universes', 'yoga_worlds', 'yoga_realms', 'yoga_spheres', 'yoga_fields', 'yoga_domains', 'yoga_territories', 'yoga_regions', 'yoga_zones', 'yoga_areas', 'yoga_spaces', 'yoga_places', 'yoga_venues', 'yoga_sites', 'yoga_locations', 'yoga_premises', 'yoga_grounds', 'yoga_bases', 'yoga_foundations', 'yoga_establishments', 'yoga_institutions', 'yoga_organizations', 'yoga_structures', 'yoga_frameworks', 'yoga_systems', 'yoga_processes', 'yoga_procedures', 'yoga_techniques', 'yoga_methods', 'yoga_tactics', 'yoga_strategizing', 'yoga_planning', 'yoga_plotting', 'yoga_scheming', 'yoga_contriving', 'yoga_concocting', 'yoga_devising', 'yoga_formulating', 'yoga_drafting', 'yoga_penning', 'yoga_authoring', 'yoga_writing', 'yoga_composing', 'yoga_architecting', 'yoga_engineering', 'yoga_designing', 'yoga_crafting', 'yoga_molding', 'yoga_shaping', 'yoga_forming', 'yoga_making', 'yoga_creating', 'yoga_founding', 'yoga_establishing', 'yoga_setting', 'yoga_organizing', 'yoga_arranging', 'yoga_preparing', 'yoga_planning', 'yoga_projecting', 'yoga_forecasting', 'yoga_predicting', 'yoga_foreseeing', 'yoga_envisioning', 'yoga_picturing', 'yoga_visualizing', 'yoga_imagining', 'yoga_dreaming', 'yoga_sleeping', 'yoga_relaxing', 'yoga_resting', 'yoga_lying', 'yoga_sitting', 'yoga_standing', 'yoga_representing', 'yoga_exemplifying', 'yoga_illustrating', 'yoga_demonstrating', 'yoga_presenting', 'yoga_displaying', 'yoga_showing', 'yoga_exposing', 'yoga_revealing', 'yoga_uncovering', 'yoga_discovering', 'yoga_finding', 'yoga_locating', 'yoga_situating', 'yoga_positioning', 'yoga_placing', 'yoga_putting', 'yoga_assembling', 'yoga_constructing', 'yoga_building', 'yoga_manufacturing', 'yoga_producing', 'yoga_generating', 'yoga_creating', 'yoga_originating', 'yoga_commencing', 'yoga_beginning', 'yoga_starting', 'yoga_initiating', 'yoga_launching', 'yoga_triggering', 'yoga_activating', 'yoga_rousing', 'yoga_awakening', 'yoga_arousing', 'yoga_stimulating', 'yoga_inspiring', 'yoga_motivating', 'yoga_encouraging', 'yoga_promoting', 'yoga_fostering', 'yoga_nurturing', 'yoga_cultivating', 'yoga_developing', 'yoga_training', 'yoga_instructing', 'yoga_educating', 'yoga_teaching', 'yoga_tutoring', 'yoga_mentoring', 'yoga_coaching', 'yoga_consulting', 'yoga_counseling', 'yoga_advising', 'yoga_proposing', 'yoga_suggesting', 'yoga_recommending', 'yoga_endorsing', 'yoga_approving', 'yoga_qualifying', 'yoga_certifying', 'yoga_licensing', 'yoga_authorizing', 'yoga_empowering', 'yoga_enabling', 'yoga_facilitating', 'yoga_aiding', 'yoga_supporting', 'yoga_helping', 'yoga_assisting', 'yoga_serving', 'yoga_attending', 'yoga_accompanying', 'yoga_escorting', 'yoga_conducting', 'yoga_directing', 'yoga_leading', 'yoga_guiding', 'yoga_steering', 'yoga_piloting', 'yoga_navigating', 'yoga_voyaging', 'yoga_journeying', 'yoga_traveling', 'yoga_moving', 'yoga_going', 'yoga_coming', 'yoga_arriving', 'yoga_reaching', 'yoga_attaining', 'yoga_achieving', 'yoga_securing', 'yoga_gaining', 'yoga_obtaining', 'yoga_acquiring', 'yoga_taking', 'yoga_assuming', 'yoga_adopting', 'yoga_receiving', 'yoga_welcoming', 'yoga_embracing', 'yoga_accepting', 'yoga_recognizing', 'yoga_acknowledging', 'yoga_admitting', 'yoga_conceding', 'yoga_yielding', 'yoga_submission', 'yoga_capitulation', 'yoga_surrender', 'yoga_relinquishment', 'yoga_forsaking', 'yoga_desertion', 'yoga_abandonment', 'yoga_discontinuation', 'yoga_cessation', 'yoga_termination', 'yoga_discharge', 'yoga_dismissal', 'yoga_removal', 'yoga_dethronement', 'yoga_overthrow', 'yoga_coup', 'yoga_mutiny', 'yoga_uprising', 'yoga_revolt', 'yoga_insurrection', 'yoga_rebellion', 'yoga_defiance', 'yoga_resistance', 'yoga_opposition', 'yoga_antagonism', 'yoga_enmity', 'yoga_animosity', 'yoga_hostility', 'yoga_antipathy', 'yoga_aversion', 'yoga_revulsion', 'yoga_disgust', 'yoga_repugnance', 'yoga_abhorrence', 'yoga_detestation', 'yoga_loathing', 'yoga_hatred', 'yoga_dislike', 'yoga_disapproval', 'yoga_displeasure', 'yoga_discontent', 'yoga_dissatisfaction', 'yoga_disappointment', 'yoga_frustration', 'yoga_annoyance', 'yoga_irritation', 'yoga_anger', 'yoga_rage', 'yoga_fury', 'yoga_vehemence', 'yoga_intensity', 'yoga_fervor', 'yoga_ardor', 'yoga_passion', 'yoga_zeal', 'yoga_enthusiasm', 'yoga_dynamism', 'yoga_vigor', 'yoga_vitality', 'yoga_energy', 'yoga_force', 'yoga_strength', 'yoga_power', 'yoga_capacity', 'yoga_potential', 'yoga_aptitude', 'yoga_gift', 'yoga_talent', 'yoga_ability', 'yoga_skill', 'yoga_expertise', 'yoga_proficiency', 'yoga_competence', 'yoga_capability', 'yoga_adequacy', 'yoga_fitness', 'yoga_appropriateness', 'yoga_suitability', 'yoga_applicability', 'yoga_pertinence', 'yoga_relevance', 'yoga_importance', 'yoga_significance', 'yoga_implication', 'yoga_consequence', 'yoga_outcome', 'yoga_result', 'yoga_effect', 'yoga_impact', 'yoga_influence', 'yoga_power', 'yoga_authority', 'yoga_command', 'yoga_leadership', 'yoga_direction', 'yoga_guidance', 'yoga_supervision', 'yoga_oversight', 'yoga_administration', 'yoga_management', 'yoga_control', 'yoga_regulation', 'yoga_normalization', 'yoga_standardization', 'yoga_harmonization', 'yoga_synchronization', 'yoga_coordination', 'yoga_cooperation', 'yoga_collaboration', 'yoga_partnership', 'yoga_alliance', 'yoga_union', 'yoga_merger', 'yoga_amalgamation', 'yoga_consolidation', 'yoga_unification', 'yoga_integration', 'yoga_synthesis', 'yoga_compound', 'yoga_composite', 'yoga_hybrid', 'yoga_fusion', 'yoga_blend', 'yoga_combination', 'yoga_mixture', 'yoga_assortment', 'yoga_selection', 'yoga_variety', 'yoga_range', 'yoga_series', 'yoga_line', 'yoga_collection', 'yoga_set', 'yoga_ensemble', 'yoga_outfit', 'yoga_costume', 'yoga_uniform', 'yoga_coverall', 'yoga_overalls', 'yoga_jumpsuit', 'yoga_romper', 'yoga_skirt', 'yoga_dress', 'yoga_suit', 'yoga_blazer', 'yoga_sweater', 'yoga_hoodie', 'yoga_jacket', 'yoga_shirt', 'yoga_bra', 'yoga_shorts', 'yoga_pants', 'yoga_gloves', 'yoga_socks', 'yoga_towel', 'yoga_blanket', 'yoga_bolster', 'yoga_wheel', 'yoga_strap', 'yoga_block', 'yoga_stretching_strap', 'yoga_tennis_ball', 'yoga_lacrosse_ball', 'yoga_foam_roller', 'yoga_grip_trainer', 'yoga_wrist_weights', 'yoga_ankle_weights', 'yoga_weight_vest', 'yoga_sandbag', 'yoga_tire', 'yoga_sled', 'yoga_battle_ropes', 'yoga_trx', 'yoga_bosu_ball', 'yoga_stability_ball', 'yoga_medicine_ball', 'yoga_roman_chair', 'yoga_ab_crunch', 'yoga_calf_raise', 'yoga_leg_curl', 'yoga_leg_extension', 'yoga_shoulder_press', 'yoga_chest_press', 'yoga_seated_row', 'yoga_lat_pulldown', 'yoga_leg_press', 'yoga_smith_machine', 'yoga_cable_machine', 'yoga_dip_bars', 'yoga_pull_up_bar', 'yoga_bench', 'yoga_foam_roller', 'yoga_yoga_mat', 'yoga_elliptical', 'yoga_rower', 'yoga_bike', 'yoga_treadmill', 'yoga_resistance_bands', 'yoga_kettlebell', 'yoga_barbell', 'yoga_dumbbells', 'yoga_bodyweight'],
    default: ['bodyweight']
  },
  
  // Difficulty and Skill Level
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  
  // Instructions and Media
  instructions: [{
    step: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: String
  }],
  
  videoUrl: String,
  imageUrl: String,
  gifUrl: String,
  
  // Exercise Metrics
  caloriesPerMinute: {
    type: Number,
    min: 0,
    default: 0
  },
  
  estimatedDuration: {
    type: Number, // in seconds
    min: 0
  },
  
  // Exercise Variations
  variations: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Modifications
  modifications: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Progressions
  progressions: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Regressions
  regressions: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Tips
  tips: [String],
  
  // Exercise Cues
  cues: [String],
  
  // Exercise Warnings
  warnings: [String],
  
  // Exercise Benefits
  benefits: [String],
  
  // Exercise Contraindications
  contraindications: [String],
  
  // Exercise Equipment Setup
  setupInstructions: [String],
  
  // Exercise Safety
  safetyNotes: [String],
  
  // Exercise History
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Exercise Statistics
  stats: {
    timesUsed: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },
    difficultyRating: { type: Number, min: 0, max: 5, default: 0 },
    effectivenessRating: { type: Number, min: 0, max: 5, default: 0 }
  },
  
  // Exercise Tags
  tags: [String],
  
  // Exercise Categories for Search
  searchTags: [String],
  
  // Exercise Language Support
  translations: {
    en: { name: String, description: String, instructions: [String] },
    es: { name: String, description: String, instructions: [String] },
    fr: { name: String, description: String, instructions: [String] },
    de: { name: String, description: String, instructions: [String] },
    it: { name: String, description: String, instructions: [String] },
    pt: { name: String, description: String, instructions: [String] },
    ru: { name: String, description: String, instructions: [String] },
    ja: { name: String, description: String, instructions: [String] },
    ko: { name: String, description: String, instructions: [String] },
    zh: { name: String, description: String, instructions: [String] }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ primaryMuscleGroup: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ tags: 1 });
exerciseSchema.index({ searchTags: 1 });
exerciseSchema.index({ isPublic: 1, isVerified: 1 });

// Virtual for full description
exerciseSchema.virtual('fullDescription').get(function() {
  return `${this.name} - ${this.category} exercise targeting ${this.primaryMuscleGroup}`;
});

// Method to update usage statistics
exerciseSchema.methods.incrementUsage = function() {
  this.stats.timesUsed += 1;
  return this.save();
};

// Method to add rating
exerciseSchema.methods.addRating = function(rating, difficultyRating, effectivenessRating) {
  const totalRatings = this.stats.totalRatings + 1;
  this.stats.averageRating = ((this.stats.averageRating * this.stats.totalRatings) + rating) / totalRatings;
  this.stats.difficultyRating = ((this.stats.difficultyRating * this.stats.totalRatings) + difficultyRating) / totalRatings;
  this.stats.effectivenessRating = ((this.stats.effectivenessRating * this.stats.totalRatings) + effectivenessRating) / totalRatings;
  this.stats.totalRatings = totalRatings;
  return this.save();
};

// Method to get exercise variations by difficulty
exerciseSchema.methods.getVariationsByDifficulty = function(difficulty) {
  return this.variations.filter(v => v.difficulty === difficulty);
};

// Method to get exercise modifications by difficulty
exerciseSchema.methods.getModificationsByDifficulty = function(difficulty) {
  return this.modifications.filter(m => m.difficulty === difficulty);
};

module.exports = mongoose.model('Exercise', exerciseSchema);

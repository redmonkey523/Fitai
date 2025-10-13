const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const { computeTargets } = require('../services/targetComputation');

// Configure Cloudinary (optional in dev; enforced in prod at server boot)
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer storage for avatar (local temp)
const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', 'avatar');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});

const imageOnly = (req, file, cb) => {
  const ok = /jpeg|jpg|png|webp/.test((file.mimetype || '').toLowerCase()) || /jpeg|jpg|png|webp/.test((path.extname(file.originalname || '').toLowerCase() || ''));
  if (!ok) return cb(new Error('Only JPG, PNG, or WebP images are allowed'));
  cb(null, true);
};
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageOnly });

// GET /api/users/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// GET /api/users/me/profile - Get user profile (Goal Quiz format)
router.get('/me/profile', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Build UserProfile response
    const heightCm = user.height?.unit === 'ft' 
      ? user.height.value * 30.48 
      : user.height?.value || 170;
    
    const weightKg = user.weight?.unit === 'lbs'
      ? user.weight.value * 0.453592
      : user.weight?.value || 70;
    
    const profile = {
      id: user._id.toString(),
      sex: user.gender === 'male' || user.gender === 'female' ? user.gender : 'custom',
      age: user.age || 30,
      height_cm: Math.round(heightCm),
      weight_kg: Math.round(weightKg * 10) / 10,
      body_fat_pct: user.bodyFatPercentage,
      units: user.weight?.unit === 'lbs' ? 'imperial' : 'metric'
    };
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// PUT /api/users/me - Update user profile with quiz payload (Agent 2 spec)
router.put('/me', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const {
      sex,
      age,
      height_cm,
      weight_kg,
      body_fat_pct,
      goal_type,
      pace_kg_per_week,
      diet_style
    } = req.body;
    
    // Validate required fields
    const errors = [];
    if (!sex || !['male', 'female', 'other'].includes(sex)) {
      errors.push({ field: 'sex', message: 'Must be male, female, or other' });
    }
    if (!age || age < 13 || age > 120) {
      errors.push({ field: 'age', message: 'Age must be between 13 and 120' });
    }
    if (!height_cm || height_cm < 100 || height_cm > 250) {
      errors.push({ field: 'height_cm', message: 'Height must be between 100 and 250 cm' });
    }
    if (!weight_kg || weight_kg < 30 || weight_kg > 300) {
      errors.push({ field: 'weight_kg', message: 'Weight must be between 30 and 300 kg' });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          fields: errors
        }
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Update profile fields
    user.gender = sex;
    
    // Calculate dateOfBirth from age if not set
    if (age) {
      const birthYear = new Date().getFullYear() - age;
      user.dateOfBirth = new Date(birthYear, 0, 1);
    }
    
    user.height = {
      value: height_cm,
      unit: 'cm'
    };
    
    user.weight = {
      value: weight_kg,
      unit: 'kg'
    };
    
    if (body_fat_pct !== undefined && body_fat_pct !== null) {
      user.bodyFatPercentage = body_fat_pct;
    }
    
    // Update goals if provided
    if (goal_type || pace_kg_per_week !== undefined || diet_style) {
      const goalTypeMap = {
        'lose': 'lose',
        'recomp': 'recomp',
        'gain': 'gain'
      };
      
      const dietStyleMap = {
        'balanced': 'balanced',
        'high_protein': 'high_protein',
        'low_carb': 'low_carb',
        'plant_forward': 'plant'
      };
      
      user.goalQuiz = user.goalQuiz || {};
      
      if (goal_type) {
        user.goalQuiz.primary = goalTypeMap[goal_type] || goal_type;
      }
      
      if (pace_kg_per_week !== undefined) {
        user.goalQuiz.pace_kg_per_week = pace_kg_per_week;
      }
      
      if (diet_style) {
        user.goalQuiz.diet_style = dietStyleMap[diet_style] || diet_style;
      }
      
      // Recompute targets if goals changed
      if (user.goalQuiz.primary) {
        const profile = {
          sex: user.gender,
          age: user.age || age,
          height_cm,
          weight_kg,
          body_fat_pct
        };
        
        const goals = {
          primary: user.goalQuiz.primary,
          pace_kg_per_week: user.goalQuiz.pace_kg_per_week || 0,
          diet_style: user.goalQuiz.diet_style || 'balanced'
        };
        
        user.targets = computeTargets(profile, goals);
      }
    }
    
    await user.save({ validateModifiedOnly: true });
    
    // Return updated profile
    const updatedProfile = {
      id: user._id.toString(),
      sex: user.gender,
      age: user.age || age,
      height_cm: Math.round(height_cm),
      weight_kg: Math.round(weight_kg * 10) / 10,
      body_fat_pct: user.bodyFatPercentage,
      goal_type: user.goalQuiz?.primary,
      pace_kg_per_week: user.goalQuiz?.pace_kg_per_week,
      diet_style: user.goalQuiz?.diet_style
    };
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('PUT /users/me error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// PATCH /api/users/me/profile - Update user profile (partial update)
router.patch('/me/profile', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const allowedUpdates = ['height', 'weight', 'bodyFatPercentage', 'dateOfBirth', 'gender', 'activityLevel', 'sex', 'age', 'units'];
    const updates = {};
    
    // Filter only allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'No valid fields to update'
        }
      });
    }
    
    // Get user first, then update to avoid validation issues with nested fields
    const user = await User.findById(req.user.id).select('-password -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Apply updates with format conversion
    Object.keys(updates).forEach(key => {
      if (key === 'height' && typeof updates[key] === 'number') {
        // Convert flat height to nested format
        user.height = { value: updates[key], unit: 'cm' };
      } else if (key === 'weight' && typeof updates[key] === 'number') {
        // Convert flat weight to nested format
        user.weight = { value: updates[key], unit: 'kg' };
      } else {
        user[key] = updates[key];
      }
    });
    
    // Save with validation disabled for optional nested fields
    await user.save({ validateModifiedOnly: true });
    
    // Build UserProfile response
    const heightCm = user.height?.unit === 'ft' 
      ? user.height.value * 30.48 
      : user.height?.value || 170;
    
    const weightKg = user.weight?.unit === 'lbs'
      ? user.weight.value * 0.453592
      : user.weight?.value || 70;
    
    const profile = {
      id: user._id.toString(),
      sex: user.gender === 'male' || user.gender === 'female' ? user.gender : 'custom',
      age: user.age || 30,
      height_cm: Math.round(heightCm),
      weight_kg: Math.round(weightKg * 10) / 10,
      body_fat_pct: user.bodyFatPercentage,
      units: user.weight?.unit === 'lbs' ? 'imperial' : 'metric'
    };
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api/users/me/goals - Get current goals and targets
router.get('/me/goals', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const goals = user.goalQuiz || {
      primary: null,
      pace_kg_per_week: 0,
      diet_style: 'balanced'
    };
    
    const baseTargets = user.targets || {
      calories: 2000,
      protein_g: 150,
      carbs_g: 200,
      fat_g: 65,
      fiber_g: 30,
      water_cups: 10,
      bmr: 1600,
      tdee: 2000,
      formula: 'mifflin_st_jeor'
    };
    
    // Ensure frontend-compatible field names exist
    const targets = {
      ...baseTargets,
      // Frontend format (if not already present)
      dailyCalories: baseTargets.dailyCalories || baseTargets.calories,
      proteinTarget: baseTargets.proteinTarget || baseTargets.protein_g,
      carbsTarget: baseTargets.carbsTarget || baseTargets.carbs_g,
      fatTarget: baseTargets.fatTarget || baseTargets.fat_g,
      fiberTarget: baseTargets.fiberTarget || baseTargets.fiber_g,
      hydrationCups: baseTargets.hydrationCups || baseTargets.water_cups,
      dailySteps: baseTargets.dailySteps || 10000,
      targetWeight: baseTargets.targetWeight || null,
      weeklyWorkouts: baseTargets.weeklyWorkouts || 3,
      weeklyDelta: baseTargets.weeklyDelta || goals.pace_kg_per_week
    };
    
    res.json({ goals, targets });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api/users/goals - Get computed goals with explanation (Agent 2 spec)
router.get('/goals', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Get current profile data
    const heightCm = user.height?.unit === 'ft' 
      ? user.height.value * 30.48 
      : user.height?.value || 170;
    
    const weightKg = user.weight?.unit === 'lbs'
      ? user.weight.value * 0.453592
      : user.weight?.value || 70;
    
    const profile = {
      sex: user.gender === 'male' || user.gender === 'female' ? user.gender : 'male',
      age: user.age || 30,
      height_cm: heightCm,
      weight_kg: weightKg,
      body_fat_pct: user.bodyFatPercentage
    };
    
    const goals = user.goalQuiz || {
      primary: 'recomp',
      pace_kg_per_week: 0,
      diet_style: 'balanced'
    };
    
    // Compute or use cached targets
    let targets = user.targets;
    if (!targets || !targets.bmr || !targets.tdee) {
      targets = computeTargets(profile, goals);
      // Update user with computed targets
      user.targets = targets;
      await user.save({ validateModifiedOnly: true });
    }
    
    // Calculate adjustment based on pace
    const adjustment_kcal_per_day = Math.round((goals.pace_kg_per_week * 7700) / 7);
    
    // Build response with explanation
    const response = {
      calories: targets.calories,
      protein_g: targets.protein_g,
      carbs_g: targets.carbs_g,
      fat_g: targets.fat_g,
      water_cups: targets.water_cups || 10,
      fiber_g: targets.fiber_g || 30,
      explain: {
        bmr: targets.bmr,
        tdee: targets.tdee,
        adjustment_kcal_per_day,
        formula: 'MifflinStJeor + activity + pace',
        activityMultiplier: 1.55,
        paceKgPerWeek: goals.pace_kg_per_week,
        dietStyle: goals.diet_style,
        goalType: goals.primary
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('GET /goals error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// PUT /api/users/me/goals - Update goals and compute targets
router.put('/me/goals', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Handle both formats: direct and nested
    let goalData = req.body;
    if (req.body.goals && req.body.goals.goalType) {
      // Frontend sends nested format
      goalData = req.body.goals;
    }
    
    // Map frontend goalType to backend primary
    const goalTypeMap = {
      'cut': 'lose',
      'bulk': 'gain',
      'maintain': 'recomp',
      'lose': 'lose',
      'gain': 'gain',
      'recomp': 'recomp'
    };
    
    const primary = goalTypeMap[goalData.goalType || goalData.primary];
    const pace_kg_per_week = goalData.pace || goalData.pace_kg_per_week || 0;
    
    // Map frontend dietStyle to backend diet_style
    const dietStyleMap = {
      'balanced': 'balanced',
      'high-protein': 'high_protein',
      'high_protein': 'high_protein',
      'low-carb': 'low_carb',
      'low_carb': 'low_carb',
      'plant': 'plant',
      'plant-based': 'plant'
    };
    
    const diet_style = dietStyleMap[goalData.dietStyle || goalData.diet_style] || 'balanced';
    
    // Validation
    if (!primary || !['lose', 'recomp', 'gain'].includes(primary)) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid goal type. Received: ${goalData.goalType || goalData.primary}. Must be: cut/bulk/maintain or lose/recomp/gain`
        }
      });
    }
    
    if (typeof pace_kg_per_week !== 'number') {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'pace must be a number'
        }
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Build UserProfile for computation
    const heightCm = user.height?.unit === 'ft' 
      ? user.height.value * 30.48 
      : user.height?.value || 170;
    
    const weightKg = user.weight?.unit === 'lbs'
      ? user.weight.value * 0.453592
      : user.weight?.value || 70;
    
    const profile = {
      sex: user.gender === 'male' || user.gender === 'female' ? user.gender : 'male',
      age: user.age || 30,
      height_cm: heightCm,
      weight_kg: weightKg,
      body_fat_pct: user.bodyFatPercentage
    };
    
    const goals = { primary, pace_kg_per_week, diet_style };
    
    // Compute targets
    const targets = computeTargets(profile, goals);
    
    // Update user
    user.goalQuiz = goals;
    user.targets = targets;
    
    // Also save any additional targets from frontend if provided
    if (req.body.targets) {
      user.targets = {
        ...targets,
        ...req.body.targets,
        // Keep computed values as primary (backend format)
        calories: targets.calories,
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g,
        fat_g: targets.fat_g,
        bmr: targets.bmr,
        tdee: targets.tdee,
        formula: targets.formula,
        // Also store in frontend format for compatibility
        dailyCalories: req.body.targets.dailyCalories || targets.calories,
        proteinTarget: req.body.targets.proteinTarget || targets.protein_g,
        carbsTarget: req.body.targets.carbsTarget || targets.carbs_g,
        fatTarget: req.body.targets.fatTarget || targets.fat_g,
        fiberTarget: req.body.targets.fiberTarget || targets.fiber_g,
        hydrationCups: req.body.targets.hydrationCups || targets.water_cups,
        dailySteps: req.body.targets.dailySteps || 10000,
        targetWeight: req.body.targets.targetWeight || null,
        weeklyWorkouts: req.body.targets.weeklyWorkouts || 3,
        weeklyDelta: req.body.targets.weeklyDelta || goals.pace_kg_per_week
      };
    }
    
    await user.save();
    
    res.json({
      goals,
      targets: user.targets
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api/users/search?q=term&limit=10 - Search users by name/email
router.get('/search', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const term = String(q).trim();
    if (term.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(term, 'i');
    const results = await User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ],
      _id: { $ne: req.user.id },
    })
      .select('firstName lastName email profilePicture stats')
      .limit(parseInt(limit));

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching users', error: error.message });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      activityLevel,
      fitnessGoals,
      dietaryRestrictions,
      workoutPreferences,
      notificationSettings,
      privacySettings,
      displayName,
      bio,
      specialties,
      links,
      location
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (activityLevel) user.activityLevel = activityLevel;
    if (location) user.location = location;
    
    // Update fitness goals
    if (fitnessGoals) {
      user.fitnessGoals = {
        ...user.fitnessGoals,
        ...fitnessGoals
      };
    }
    
    // Update dietary restrictions
    if (dietaryRestrictions) {
      user.dietaryRestrictions = {
        ...user.dietaryRestrictions,
        ...dietaryRestrictions
      };
    }
    
    // Update workout preferences
    if (workoutPreferences) {
      user.workoutPreferences = {
        ...user.workoutPreferences,
        ...workoutPreferences
      };
    }
    
    // Update notification settings
    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings
      };
    }
    
    // Update privacy settings
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }
    
    // Ensure creator profile mirrors identity fields if provided
    if (bio || specialties || links) {
      try {
        const Coach = require('../models/Coach');
        let coach = await Coach.findOne({ userId: user._id });
        if (!coach) coach = await Coach.create({ userId: user._id });
        if (bio) coach.bio = bio;
        if (Array.isArray(specialties)) { coach.specialties = specialties; coach.niches = specialties; }
        if (links && typeof links === 'object') coach.socialLinks = { ...coach.socialLinks, ...links };
        await coach.save();
      } catch (_) {}
    }

    await user.save();
    
    const updatedUser = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -passwordResetToken');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// POST /api/users/avatar - Upload user avatar (square crop) -> { avatarUrl }
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar uploaded' });
    }
    if (!hasCloudinary) {
      // Development fallback: serve local file
      const localUrl = `${req.protocol}://${req.get('host')}/uploads/avatar/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.id, { profilePicture: localUrl });
      return res.json({ success: true, avatarUrl: `${localUrl}?v=${Date.now()}`, asset: { type: 'image', src: `${localUrl}?v=${Date.now()}` } });
    }
    // Upload to Cloudinary, enforce square 400x400 crop
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'fitness-app/avatars',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { format: 'webp' }
      ],
      eager: [
        { width: 96, height: 96, crop: 'fill', gravity: 'face', format: 'webp' },
        { width: 256, height: 256, crop: 'fill', gravity: 'face', format: 'webp' }
      ],
      eager_async: false,
    });
    try { await fs.unlink(req.file.path); } catch {}

    if (!uploadResult?.secure_url) {
      return res.status(500).json({ success: false, message: 'Upload failed' });
    }

    const avatarUrl = `${uploadResult.secure_url}?v=${Date.now()}`;
    await User.findByIdAndUpdate(req.user.id, { profilePicture: uploadResult.secure_url });
    return res.json({ success: true, avatarUrl, asset: { type: 'image', src: avatarUrl, width: 512, height: 512 } });
  } catch (error) {
    console.error('avatar upload error', error);
    return res.status(500).json({ success: false, message: 'Error uploading avatar', error: error.message });
  }
});

// DELETE /api/users/avatar - Remove avatar -> { avatarUrl: null }
router.delete('/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.profilePicture = null;
    await user.save();
    return res.json({ success: true, avatarUrl: null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error removing avatar', error: error.message });
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get workout statistics
    const Workout = require('../models/Workout');
    const workoutStats = await Workout.aggregate([
      { $match: { user: user._id, 'session.completed': true } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$session.actualDuration' },
          totalCalories: { $sum: '$session.caloriesBurned' },
          averageDuration: { $avg: '$session.actualDuration' }
        }
      }
    ]);
    
    // Get nutrition statistics
    const Nutrition = require('../models/Nutrition');
    const nutritionStats = await Nutrition.aggregate([
      { $match: { user: user._id, type: { $ne: 'water' } } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalCalories: { $sum: '$nutrition.calories' },
          averageCalories: { $avg: '$nutrition.calories' }
        }
      }
    ]);
    
    // Get progress statistics
    const Progress = require('../models/Progress');
    const progressStats = await Progress.aggregate([
      { $match: { user: user._id, type: { $ne: 'photo' } } },
      {
        $group: {
          _id: null,
          totalMeasurements: { $sum: 1 },
          measurementTypes: { $addToSet: '$type' }
        }
      }
    ]);
    
    const stats = {
      profile: {
        joinDate: user.stats.joinDate,
        lastActive: user.stats.lastActive,
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak
      },
      workouts: workoutStats[0] || {
        totalWorkouts: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0
      },
      nutrition: nutritionStats[0] || {
        totalEntries: 0,
        totalCalories: 0,
        averageCalories: 0
      },
      progress: progressStats[0] || {
        totalMeasurements: 0,
        measurementTypes: []
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

// GET /api/users/goals - Get user goals
router.get('/goals', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        fitnessGoals: user.fitnessGoals,
        nutritionGoals: user.nutritionGoals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user goals',
      error: error.message
    });
  }
});

// PUT /api/users/goals - Update user goals
router.put('/goals', async (req, res) => {
  try {
    const { fitnessGoals, nutritionGoals } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (fitnessGoals) {
      user.fitnessGoals = {
        ...user.fitnessGoals,
        ...fitnessGoals
      };
    }
    
    if (nutritionGoals) {
      user.nutritionGoals = {
        ...user.nutritionGoals,
        ...nutritionGoals
      };
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Goals updated successfully',
      data: {
        fitnessGoals: user.fitnessGoals,
        nutritionGoals: user.nutritionGoals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating goals',
      error: error.message
    });
  }
});

// GET /api/users/settings - Get user settings
router.get('/settings', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        notificationSettings: user.notificationSettings,
        privacySettings: user.privacySettings,
        workoutPreferences: user.workoutPreferences,
        dietaryRestrictions: user.dietaryRestrictions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user settings',
      error: error.message
    });
  }
});

// PUT /api/users/settings - Update user settings
router.put('/settings', async (req, res) => {
  try {
    const {
      notificationSettings,
      privacySettings,
      workoutPreferences,
      dietaryRestrictions
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings
      };
    }
    
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }
    
    if (workoutPreferences) {
      user.workoutPreferences = {
        ...user.workoutPreferences,
        ...workoutPreferences
      };
    }
    
    if (dietaryRestrictions) {
      user.dietaryRestrictions = {
        ...user.dietaryRestrictions,
        ...dietaryRestrictions
      };
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        notificationSettings: user.notificationSettings,
        privacySettings: user.privacySettings,
        workoutPreferences: user.workoutPreferences,
        dietaryRestrictions: user.dietaryRestrictions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// GET /api/users/friends - Get user's friends
router.get('/friends', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'firstName lastName email profilePicture stats');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user.friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching friends',
      error: error.message
    });
  }
});

// GET /api/users/friend-requests - Get friend requests
router.get('/friend-requests', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'firstName lastName email profilePicture');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const pendingRequests = user.friendRequests.filter(
      request => request.status === 'pending'
    );
    
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching friend requests',
      error: error.message
    });
  }
});

// POST /api/users/friend-requests - Send friend request
router.post('/friend-requests', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.user.id
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }
    
    // Add friend request
    targetUser.friendRequests.push({
      from: req.user.id,
      status: 'pending'
    });
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending friend request',
      error: error.message
    });
  }
});

// PUT /api/users/friend-requests/:requestId/accept - Accept friend request
router.put('/friend-requests/:requestId/accept', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const request = user.friendRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Friend request already processed'
      });
    }
    
    // Accept the request
    request.status = 'accepted';
    
    // Add to friends list
    user.friends.push(request.from);
    
    // Add current user to requester's friends list
    const requester = await User.findById(request.from);
    if (requester) {
      requester.friends.push(user._id);
      await requester.save();
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting friend request',
      error: error.message
    });
  }
});

// PUT /api/users/friend-requests/:requestId/reject - Reject friend request
router.put('/friend-requests/:requestId/reject', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const request = user.friendRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Friend request already processed'
      });
    }
    
    // Reject the request
    request.status = 'rejected';
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Friend request rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting friend request',
      error: error.message
    });
  }
});

// DELETE /api/users/friends/:friendId - Remove friend
router.delete('/friends/:friendId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove from friends list
    user.friends = user.friends.filter(
      friendId => friendId.toString() !== req.params.friendId
    );
    
    // Remove from friend's friends list
    const friend = await User.findById(req.params.friendId);
    if (friend) {
      friend.friends = friend.friends.filter(
        friendId => friendId.toString() !== req.user.id
      );
      await friend.save();
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing friend',
      error: error.message
    });
  }
});

// GET /api/users/me/summary?window=7d|30d - Get user summary with aggregated data
router.get('/me/summary', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const { window = '7d' } = req.query;
    
    // Parse window parameter
    const days = window === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Import models for aggregation
    const Progress = require('../models/Progress');
    const Workout = require('../models/Workout');
    const Nutrition = require('../models/Nutrition');
    const mongoose = require('mongoose');
    
    // 1. Weight Trend - Get weight measurements from progress
    const weightData = await Progress.find({
      user: req.user.id,
      type: 'weight',
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();
    
    // Convert to required format and fill gaps
    const weightTrend = [];
    if (weightData.length > 0) {
      let lastWeight = weightData[0].value;
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find measurement for this date
        const measurement = weightData.find(w => {
          const wDate = new Date(w.date).toISOString().split('T')[0];
          return wDate === dateStr;
        });
        
        if (measurement) {
          lastWeight = measurement.unit === 'lbs' ? measurement.value * 0.453592 : measurement.value;
        }
        
        weightTrend.push({
          date: dateStr,
          kg: Math.round(lastWeight * 10) / 10
        });
      }
    }
    
    // 2. Workouts by Day - Count completed workouts
    const workoutData = await Workout.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          'session.completed': true,
          'session.completedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$session.completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          day: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { day: 1 }
      }
    ]);
    
    const workoutsByDay = workoutData.map(w => ({ day: w.day, count: w.count }));
    
    // 3. Streak Days - Calculate consecutive workout days
    let streakDays = 0;
    const workoutDates = await Workout.find({
      user: req.user.id,
      'session.completed': true
    })
    .select('session.completedAt')
    .sort({ 'session.completedAt': -1 })
    .lean();
    
    if (workoutDates.length > 0) {
      const uniqueDates = [...new Set(
        workoutDates.map(w => new Date(w.session.completedAt).toISOString().split('T')[0])
      )].sort().reverse();
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if most recent workout is today or yesterday
      if (uniqueDates[0] === today || uniqueDates[0] === yesterdayStr) {
        streakDays = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i]);
          const prevDate = new Date(uniqueDates[i - 1]);
          const diffDays = Math.round((prevDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }
    
    // 4. Nutrition Compliance - Daily nutrition vs targets
    const nutritionData = await Nutrition.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          consumedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$consumedAt' }
          },
          kcal: { 
            $sum: { 
              $multiply: ['$nutrition.calories', '$servingSize.amount'] 
            } 
          },
          protein: { 
            $sum: { 
              $multiply: ['$nutrition.protein', '$servingSize.amount'] 
            } 
          },
          carbs: { 
            $sum: { 
              $multiply: ['$nutrition.carbs', '$servingSize.amount'] 
            } 
          },
          fat: { 
            $sum: { 
              $multiply: ['$nutrition.fat', '$servingSize.amount'] 
            } 
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    const nutritionCompliance = nutritionData.map(n => ({
      date: n._id,
      kcal: Math.round(n.kcal),
      target_kcal: user.targets?.calories || 2000,
      p: Math.round(n.protein),
      c: Math.round(n.carbs),
      f: Math.round(n.fat)
    }));
    
    // 5. Steps - Currently returning empty array (placeholder for future integration)
    const steps = [];
    
    // 6. Hydration - Get water intake from nutrition entries
    const hydrationData = await Nutrition.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          consumedAt: { $gte: startDate },
          isWater: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$consumedAt' }
          },
          cups: { $sum: '$servingSize.amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    const hydrationCups = hydrationData.map(h => ({
      date: h._id,
      cups: Math.round(h.cups)
    }));
    
    // Build response
    const summary = {
      weightTrend,
      workoutsByDay,
      streakDays,
      nutritionCompliance,
      steps,
      hydrationCups,
      targets: user.targets || {
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 65,
        fiber_g: 30,
        water_cups: 10,
        bmr: 1600,
        tdee: 2000,
        formula: 'mifflin_st_jeor'
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Summary endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;

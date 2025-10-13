const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Measurement type
  type: {
    type: String,
    required: true,
    enum: [
      'weight', 'body_fat', 'muscle_mass', 'bmi', 'chest', 'waist', 
      'hips', 'arms', 'thighs', 'calves', 'neck', 'shoulders',
      'body_water', 'bone_mass', 'visceral_fat', 'metabolic_age',
      'photo'
    ]
  },
  
  // For measurements
  value: {
    type: Number,
    min: 0,
    required: function() {
      return this.type !== 'photo';
    }
  },
  
  unit: {
    type: String,
    enum: ['kg', 'lbs', 'g', 'cm', 'inches', 'mm', '%', 'years', 'kcal'],
    required: function() {
      return this.type !== 'photo';
    }
  },
  
  // For photos
  photoUrl: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'photo';
    }
  },
  
  photoType: {
    type: String,
    enum: ['front', 'back', 'side', 'face', 'full_body'],
    required: function() {
      return this.type === 'photo';
    }
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Date of measurement/photo
  date: {
    type: Date,
    default: Date.now
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Goal tracking
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  
  // Achievement tracking
  isMilestone: {
    type: Boolean,
    default: false
  },
  
  milestoneType: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'consistency']
  },
  
  // Comparison data
  previousValue: {
    type: Number
  },
  
  change: {
    type: Number
  },
  
  changePercent: {
    type: Number
  },
  
  // Health insights
  healthInsights: {
    bmi: {
      type: Number,
      min: 0
    },
    bmiCategory: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'obese']
    },
    bodyComposition: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor']
    },
    recommendations: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, type: 1, date: -1 });
progressSchema.index({ user: 1, isMilestone: 1 });
progressSchema.index({ user: 1, goalId: 1 });

// Virtual for formatted value
progressSchema.virtual('formattedValue').get(function() {
  if (this.type === 'photo') return null;
  
  const value = this.value || 0;
  
  switch (this.unit) {
    case 'kg':
    case 'lbs':
      return `${value.toFixed(1)} ${this.unit}`;
    case 'cm':
    case 'inches':
      return `${value.toFixed(1)} ${this.unit}`;
    case '%':
      return `${value.toFixed(1)}%`;
    case 'years':
      return `${value.toFixed(0)} years`;
    case 'kcal':
      return `${value.toFixed(0)} kcal`;
    default:
      return `${value} ${this.unit}`;
  }
});

// Virtual for change display
progressSchema.virtual('formattedChange').get(function() {
  if (!this.change) return null;
  
  const change = this.change;
  const sign = change > 0 ? '+' : '';
  
  switch (this.unit) {
    case 'kg':
    case 'lbs':
      return `${sign}${change.toFixed(1)} ${this.unit}`;
    case 'cm':
    case 'inches':
      return `${sign}${change.toFixed(1)} ${this.unit}`;
    case '%':
      return `${sign}${change.toFixed(1)}%`;
    default:
      return `${sign}${change} ${this.unit}`;
  }
});

// Method to calculate BMI
progressSchema.methods.calculateBMI = function(height) {
  if (this.type !== 'weight' || !height) return null;
  
  const weightKg = this.unit === 'lbs' ? this.value * 0.453592 : this.value;
  const heightM = height / 100; // Assuming height is in cm
  
  const bmi = weightKg / (heightM * heightM);
  
  let category;
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 25) category = 'normal';
  else if (bmi < 30) category = 'overweight';
  else category = 'obese';
  
  return {
    bmi: Math.round(bmi * 10) / 10,
    category
  };
};

// Method to calculate body composition score
progressSchema.methods.calculateBodyComposition = function() {
  if (this.type !== 'body_fat') return null;
  
  const bodyFat = this.value;
  
  let composition;
  if (bodyFat < 10) composition = 'excellent';
  else if (bodyFat < 15) composition = 'good';
  else if (bodyFat < 20) composition = 'average';
  else composition = 'poor';
  
  return composition;
};

// Static method to get latest measurement by type
progressSchema.statics.getLatestByType = async function(userId, type) {
  return await this.findOne({
    user: userId,
    type: type
  })
  .sort({ date: -1 });
};

// Static method to get measurement history
progressSchema.statics.getHistory = async function(userId, type, limit = 30) {
  return await this.find({
    user: userId,
    type: type
  })
  .sort({ date: -1 })
  .limit(limit);
};

// Static method to calculate trends
progressSchema.statics.calculateTrend = async function(userId, type, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const measurements = await this.find({
    user: userId,
    type: type,
    date: { $gte: startDate }
  })
  .sort({ date: 1 });
  
  if (measurements.length < 2) {
    return {
      trend: 'insufficient_data',
      change: 0,
      changePercent: 0,
      dataPoints: measurements.length
    };
  }
  
  const first = measurements[0];
  const last = measurements[measurements.length - 1];
  const change = last.value - first.value;
  const changePercent = first.value !== 0 ? (change / first.value) * 100 : 0;
  
  let trend = 'stable';
  if (changePercent > 2) trend = 'increasing';
  else if (changePercent < -2) trend = 'decreasing';
  
  return {
    trend,
    change,
    changePercent: Math.round(changePercent * 100) / 100,
    dataPoints: measurements.length,
    firstValue: first.value,
    lastValue: last.value,
    firstDate: first.date,
    lastDate: last.date
  };
};

// Static method to get progress summary
progressSchema.statics.getSummary = async function(userId) {
  const summary = {};
  
  // Get latest measurements for each type
  const types = [
    'weight', 'body_fat', 'muscle_mass', 'chest', 'waist', 'hips'
  ];
  
  for (const type of types) {
    const latest = await this.getLatestByType(userId, type);
    if (latest) {
      summary[type] = {
        value: latest.value,
        unit: latest.unit,
        date: latest.date,
        formattedValue: latest.formattedValue
      };
    }
  }
  
  // Get photo count
  const photoCount = await this.countDocuments({
    user: userId,
    type: 'photo'
  });
  
  summary.photoCount = photoCount;
  
  return summary;
};

// Pre-save middleware to calculate changes
progressSchema.pre('save', async function(next) {
  if (this.type === 'photo') {
    return next();
  }
  
  // Get previous measurement
  const previous = await this.constructor.findOne({
    user: this.user,
    type: this.type
  })
  .sort({ date: -1 });
  
  if (previous && previous._id.toString() !== this._id.toString()) {
    this.previousValue = previous.value;
    this.change = this.value - previous.value;
    this.changePercent = previous.value !== 0 ? (this.change / previous.value) * 100 : 0;
  }
  
  next();
});

// Ensure virtuals are included in JSON output
progressSchema.set('toJSON', { virtuals: true });
progressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Progress', progressSchema);

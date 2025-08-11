const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['strength', 'cardio', 'mobility', 'rest'], required: true },
  estimatedDuration: { type: Number, min: 5, max: 300, required: true },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number
  }]
});

const phaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weeks: { type: Number, min: 1, max: 12, required: true },
  sessions: [sessionSchema]
});

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  goal: { type: String, enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
  phases: [phaseSchema],
  tags: [{ type: String, trim: true, lowercase: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

planSchema.index({ goal: 1, difficulty: 1 });
planSchema.index({ name: 'text', tags: 'text' });

const assignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
  startDate: { type: Date, required: true },
  currentWeek: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  adherence: { type: Number, default: 0 } // percentage
}, { timestamps: true });

assignmentSchema.index({ userId: 1, planId: 1 }, { unique: true });

const Plan = mongoose.model('Plan', planSchema);
const PlanAssignment = mongoose.model('PlanAssignment', assignmentSchema);

module.exports = { Plan, PlanAssignment };



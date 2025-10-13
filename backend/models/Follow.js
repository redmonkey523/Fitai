const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true, index: true },
}, { timestamps: true });

followSchema.index({ userId: 1, coachId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);



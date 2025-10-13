const mongoose = require('mongoose');

const creatorApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  bio: { type: String, trim: true, maxlength: 2000 },
  niches: [{ type: String, trim: true, lowercase: true }],
  links: [{ type: String, trim: true }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: { type: Date },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CreatorApplication', creatorApplicationSchema);



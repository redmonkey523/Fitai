const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  benefits: [{ type: String, trim: true }],
}, { _id: false });

const imageMetaSchema = new mongoose.Schema({
  url: { type: String, trim: true },
  cloudinaryId: { type: String, trim: true },
  width: { type: Number },
  height: { type: Number },
  thumbnail: { type: String, trim: true },
  size: { type: Number },
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  issuer: { type: String, trim: true, maxlength: 200 },
  credentialId: { type: String, trim: true, maxlength: 200 },
  url: { type: String, trim: true, maxlength: 500 },
  issuedAt: { type: Date },
}, { timestamps: true });

const coachSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  // Text profile
  bio: { type: String, trim: true, maxlength: 2000 },
  // Keep existing niches for backwards compat; map to specialties in API
  niches: [{ type: String, trim: true, lowercase: true }],
  specialties: [{ type: String, trim: true, lowercase: true }],
  // Media
  profilePicture: imageMetaSchema,
  bannerImage: imageMetaSchema,
  // Social links
  socialLinks: {
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  // Certifications
  certifications: [certificationSchema],
  // Pricing
  pricing: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'USD' },
  // Legacy tiers for subscriptions
  tiers: [tierSchema],
  verified: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
}, { timestamps: true });

coachSchema.index({ niches: 1, verified: 1 });
coachSchema.index({ specialties: 1, verified: 1 });

module.exports = mongoose.model('Coach', coachSchema);



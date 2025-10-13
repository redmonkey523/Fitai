const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    name: { type: String },
    status: { type: String, enum: ['ready', 'processing', 'failed', 'deleted'], default: 'ready', index: true },
    uploadedAt: { type: Date, default: Date.now, index: true },
    cloudinaryId: { type: String },
    processedUrl: { type: String },
    thumbnailUrl: { type: String },
    durationS: { type: Number },
    width: { type: Number },
    height: { type: Number },
    // edit metadata
    trimStartS: { type: Number },
    trimEndS: { type: Number },
    speed: { type: Number, default: 1 },
    volume: { type: Number, default: 1 },
    fadeInS: { type: Number },
    fadeOutS: { type: Number },
    coverAtS: { type: Number },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);



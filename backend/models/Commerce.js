const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true, index: true },
  tierName: { type: String, required: true },
  status: { type: String, enum: ['active', 'canceled', 'past_due'], required: true },
  renewsAt: { type: Date },
  provider: { type: String, default: 'stripe' },
  providerSubId: { type: String }
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, coachId: 1 }, { unique: true });

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', index: true },
  product: { type: String, enum: ['pro', 'program'], default: 'program' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  provider: { type: String, default: 'stripe' },
  providerTxnId: { type: String }
}, { timestamps: true });

purchaseSchema.index({ userId: 1, programId: 1 }, { unique: true, partialFilterExpression: { programId: { $type: 'objectId' } } });
purchaseSchema.index({ userId: 1, product: 1 }, { unique: true, partialFilterExpression: { product: 'pro' } });

module.exports = {
  Subscription: mongoose.model('Subscription', subscriptionSchema),
  Purchase: mongoose.model('Purchase', purchaseSchema),
};



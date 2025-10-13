const mongoose = require('mongoose');

const groceryListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One grocery list per user
  },
  items: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Produce',
        'Meat & Seafood',
        'Dairy & Eggs',
        'Bakery',
        'Pantry',
        'Frozen',
        'Beverages',
        'Snacks',
        'Other',
      ],
      default: 'Other',
    },
    checked: {
      type: Boolean,
      default: false,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Index for userId
groceryListSchema.index({ userId: 1 });

module.exports = mongoose.model('GroceryList', groceryListSchema);



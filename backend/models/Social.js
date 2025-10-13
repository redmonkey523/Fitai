const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['workout', 'nutrition', 'progress', 'achievement', 'general', 'post', 'story'],
    default: 'general'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
    validate: {
      validator: function(value) {
        const hasContent = Boolean(value && String(value).trim().length > 0);
        const hasMedia = Array.isArray(this.media) && this.media.length > 0;
        return hasContent || hasMedia;
      },
      message: 'Content or media is required'
    }
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    caption: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    address: String
  },
  workoutData: {
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout'
    },
    duration: Number,
    calories: Number,
    exercises: [{
      name: String,
      sets: Number,
      reps: Number,
      weight: Number
    }]
  },
  nutritionData: {
    mealType: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    foods: [{
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }]
  },
  progressData: {
    measurementType: String,
    value: Number,
    unit: String,
    beforeImage: String,
    afterImage: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const challengeSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['workout', 'nutrition', 'weight_loss', 'strength', 'endurance', 'custom'],
    required: true
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'weekly'
  },
  goal: {
    type: String,
    required: true,
    trim: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      currentValue: {
        type: Number,
        default: 0
      },
      lastUpdated: Date,
      completed: {
        type: Boolean,
        default: false
      }
    }
  }],
  maxParticipants: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  image: String,
  rules: [{
    type: String,
    trim: true
  }],
  rewards: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date
});

// Indexes for better query performance
// Ensure indexes are declared once to avoid duplicate warnings
if (!postSchema.indexes || !postSchema.indexes?.length) {
  postSchema.index({ author: 1, createdAt: -1 });
  postSchema.index({ type: 1, createdAt: -1 });
  postSchema.index({ tags: 1 });
  postSchema.index({ 'location.coordinates': '2dsphere' });
}

if (!challengeSchema.indexes || !challengeSchema.indexes?.length) {
  challengeSchema.index({ creator: 1, createdAt: -1 });
  challengeSchema.index({ type: 1, status: 1 });
  challengeSchema.index({ startDate: 1, endDate: 1 });
  challengeSchema.index({ tags: 1 });
}

if (!friendRequestSchema.indexes || !friendRequestSchema.indexes?.length) {
  friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
  friendRequestSchema.index({ receiver: 1, status: 1 });
}

// Virtual fields
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

challengeSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Methods
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

postSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => !id.equals(userId));
  return this.save();
};

challengeSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.equals(userId));
};

challengeSchema.methods.addParticipant = function(userId) {
  if (!this.isParticipant(userId)) {
    this.participants.push({
      user: userId,
      joinedAt: new Date()
    });
  }
  return this.save();
};

challengeSchema.methods.updateProgress = function(userId, progress) {
  const participant = this.participants.find(p => p.user.equals(userId));
  if (participant) {
    participant.progress = { ...participant.progress, ...progress };
    participant.progress.lastUpdated = new Date();
  }
  return this.save();
};

// Statics
postSchema.statics.findByUser = function(userId, options = {}) {
  const query = { author: userId };
  if (options.visibility) {
    query.visibility = options.visibility;
  }
  return this.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .populate('likes', 'firstName lastName')
    .populate('comments.user', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

challengeSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('creator', 'firstName lastName profilePicture');
};

// Pre-save middleware
postSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Create models
const Post = mongoose.model('Post', postSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = {
  Post,
  Challenge,
  FriendRequest
};

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'workout_reminder',
      'nutrition_reminder',
      'goal_achievement',
      'streak_milestone',
      'friend_request',
      'friend_accepted',
      'challenge_invite',
      'challenge_update',
      'social_activity',
      'progress_milestone',
      'system_alert',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  data: {
    // Additional data for the notification
    action: String, // 'navigate', 'open_url', 'dismiss'
    targetScreen: String,
    targetId: String, // ID of the target object (workout, post, etc.)
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  channels: [{
    type: String,
    enum: ['push', 'email', 'in_app', 'sms'],
    default: ['in_app']
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  scheduledFor: Date, // For scheduled notifications
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const notificationTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'workout_reminder',
      'nutrition_reminder',
      'goal_achievement',
      'streak_milestone',
      'friend_request',
      'friend_accepted',
      'challenge_invite',
      'challenge_update',
      'social_activity',
      'progress_milestone',
      'system_alert',
      'custom'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  titleTemplate: {
    type: String,
    required: true,
    trim: true
  },
  messageTemplate: {
    type: String,
    required: true,
    trim: true
  },
  variables: [{
    name: String,
    description: String,
    required: Boolean,
    defaultValue: String
  }],
  channels: [{
    type: String,
    enum: ['push', 'email', 'in_app', 'sms'],
    default: ['in_app']
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  push: {
    enabled: {
      type: Boolean,
      default: true
    },
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: String,
    lastSeen: Date
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    address: String,
    verified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationExpires: Date
  },
  sms: {
    enabled: {
      type: Boolean,
      default: false
    },
    number: String,
    verified: {
      type: Boolean,
      default: false
    },
    verificationCode: String,
    verificationExpires: Date
  },
  preferences: {
    workout_reminder: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    nutrition_reminder: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    goal_achievement: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    streak_milestone: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    friend_request: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    friend_accepted: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    challenge_invite: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    challenge_update: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    social_activity: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    progress_milestone: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    system_alert: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00'
    },
    end: {
      type: String,
      default: '08:00'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const notificationLogSchema = new mongoose.Schema({
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: String,
    enum: ['push', 'email', 'in_app', 'sms'],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    required: true
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  failedAt: Date,
  failureReason: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ 'push.token': 1 });

notificationTemplateSchema.index({ type: 1, isActive: 1 });
notificationTemplateSchema.index({ name: 1 });

notificationSettingsSchema.index({ userId: 1 });
notificationSettingsSchema.index({ 'push.token': 1 });
notificationSettingsSchema.index({ 'email.address': 1 });

notificationLogSchema.index({ notificationId: 1 });
notificationLogSchema.index({ userId: 1, createdAt: -1 });
notificationLogSchema.index({ channel: 1, status: 1 });

// Virtual fields
notificationSchema.virtual('isRead').get(function() {
  return this.read;
});

notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

notificationSchema.methods.canRetry = function() {
  return this.retryCount < this.maxRetries;
};

notificationSettingsSchema.methods.isQuietHours = function() {
  if (!this.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    timeZone: this.quietHours.timezone 
  });
  
  const start = this.quietHours.start;
  const end = this.quietHours.end;
  
  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Handles overnight quiet hours (e.g., 22:00 to 08:00)
    return currentTime >= start || currentTime <= end;
  }
};

notificationSettingsSchema.methods.shouldSendNotification = function(type, channel) {
  // Check if quiet hours are active
  if (this.isQuietHours()) {
    return false;
  }
  
  // Check if channel is enabled for this notification type
  const preference = this.preferences[type];
  if (!preference || !preference[channel]) {
    return false;
  }
  
  // Check if channel is enabled globally
  const channelSettings = this[channel];
  if (!channelSettings || !channelSettings.enabled) {
    return false;
  }
  
  return true;
};

// Statics
notificationSchema.statics.findUnreadByUser = function(userId, options = {}) {
  const query = { recipient: userId, read: false };
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('sender', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { 
      read: true, 
      readAt: new Date(),
      status: 'read'
    }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

notificationSchema.statics.findPendingNotifications = function() {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lte: new Date() } }
    ]
  }).populate('recipient', 'notificationSettings');
};

notificationTemplateSchema.statics.findByType = function(type) {
  return this.findOne({ type, isActive: true });
};

notificationSettingsSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

notificationTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

notificationSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create models
const Notification = mongoose.model('Notification', notificationSchema);
const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);
const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = {
  Notification,
  NotificationTemplate,
  NotificationSettings,
  NotificationLog
};

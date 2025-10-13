/**
 * Temporary in-memory database for development
 * Use this when MongoDB is not available
 */

const bcrypt = require('bcryptjs');
const users = new Map();
let userIdCounter = 1;

class TempUser {
  constructor(userData) {
    this._id = userIdCounter++;
    this.email = userData.email;
    this.username = userData.username;
    this.password = userData.password; // Will be hashed in save()
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.dateOfBirth = userData.dateOfBirth;
    this.gender = userData.gender;
    this.height = userData.height;
    this.weight = userData.weight;
    this.fitnessLevel = userData.fitnessLevel;
    this.goals = userData.goals;
    this.isActive = true;
    this.isEmailVerified = userData.isEmailVerified || false;
    this.isPremium = userData.isPremium || false;
    this.stats = {
      workoutsCompleted: 0,
      totalWorkoutTime: 0,
      caloriesBurned: 0,
      currentStreak: 0,
      longestStreak: 0
    };
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastActiveAt = new Date();
    this._isPasswordHashed = false; // Track if password is already hashed
  }

  static async findOne(query) {
    for (let user of users.values()) {
      if (query.email && user.email === query.email) return user;
      if (query.username && user.username === query.username) return user;
      if (query._id && user._id === query._id) return user;
      if (query.$or) {
        for (let condition of query.$or) {
          if (condition.email && user.email === condition.email) return user;
          if (condition.username && user.username === condition.username) return user;
        }
      }
    }
    return null;
  }

  // Add a convenience alias to match Mongoose's `findById` API
  static async findById(id) {
    // Ensure numeric comparison for in-memory IDs
    return this.findOne({ _id: typeof id === 'string' ? parseInt(id, 10) : id });
  }

  async save() {
    // Check for existing user
    const existing = await TempUser.findOne({
      $or: [{ email: this.email }, { username: this.username }]
    });
    
    if (existing && existing._id !== this._id) {
      throw new Error('User already exists');
    }

    // Hash password if not already hashed (mimicking Mongoose pre-save middleware)
    if (!this._isPasswordHashed && this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      this._isPasswordHashed = true;
    }

    users.set(this._id, this);
    return this;
  }

  async comparePassword(password) {
    // Use bcrypt to compare hashed password
    return bcrypt.compare(password, this.password);
  }

  async updateLastActive() {
    this.lastActiveAt = new Date();
    this.updatedAt = new Date();
  }

  select(fields) {
    // Return this user instance (simplified - in real Mongoose, this would filter fields)
    return this;
  }

  static async findOneAndSelect(query, selectFields) {
    const user = await this.findOne(query);
    return user ? user.select(selectFields) : null;
  }
}

module.exports = TempUser;

/**
 * Request tests for Goal Quiz endpoints
 * Tests PATCH /users/me/profile, PUT /users/me/goals, GET /users/me/summary
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const jwt = require('jsonwebtoken');

let authToken;
let testUser;

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/fitness_app_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear test data
  await User.deleteMany({});
  await Progress.deleteMany({});
  await Workout.deleteMany({});
  await Nutrition.deleteMany({});

  // Create test user
  testUser = await User.create({
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    height: { value: 180, unit: 'cm' },
    weight: { value: 80, unit: 'kg' },
    bodyFatPercentage: 18
  });

  // Generate auth token
  authToken = jwt.sign(
    { id: testUser._id, email: testUser.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

describe('PATCH /api/users/me/profile', () => {
  it('should update user profile successfully (200)', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        weight: { value: 82, unit: 'kg' },
        bodyFatPercentage: 17
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('sex');
    expect(response.body).toHaveProperty('age');
    expect(response.body).toHaveProperty('height_cm');
    expect(response.body).toHaveProperty('weight_kg');
    expect(response.body.weight_kg).toBe(82);
  });

  it('should handle imperial units correctly (200)', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        weight: { value: 165, unit: 'lbs' },
        height: { value: 5.9, unit: 'ft' }
      });

    expect(response.status).toBe(200);
    expect(response.body.units).toBe('imperial');
    expect(response.body.weight_kg).toBeCloseTo(74.8, 1);
  });

  it('should reject invalid fields (400)', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invalidField: 'should not work',
        password: 'should not update'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'BAD_REQUEST');
    expect(response.body.error).toHaveProperty('message');
  });

  it('should require authentication (401)', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .send({ weight: { value: 80, unit: 'kg' } });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should handle invalid token (401)', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', 'Bearer invalid-token')
      .send({ weight: { value: 80, unit: 'kg' } });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent user', async () => {
    // Create token with non-existent user ID
    const fakeToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), email: 'fake@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ weight: { value: 80, unit: 'kg' } });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/users/me/goals', () => {
  it('should update goals and compute targets successfully (200)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'high_protein'
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    
    // Check goals
    expect(response.body).toHaveProperty('goals');
    expect(response.body.goals.primary).toBe('lose');
    expect(response.body.goals.pace_kg_per_week).toBe(-0.5);
    expect(response.body.goals.diet_style).toBe('high_protein');
    
    // Check targets
    expect(response.body).toHaveProperty('targets');
    expect(response.body.targets).toHaveProperty('calories');
    expect(response.body.targets).toHaveProperty('protein_g');
    expect(response.body.targets).toHaveProperty('carbs_g');
    expect(response.body.targets).toHaveProperty('fat_g');
    expect(response.body.targets).toHaveProperty('fiber_g', 30);
    expect(response.body.targets).toHaveProperty('water_cups', 10);
    expect(response.body.targets).toHaveProperty('bmr');
    expect(response.body.targets).toHaveProperty('tdee');
    expect(response.body.targets).toHaveProperty('formula', 'mifflin_st_jeor');
    
    // Verify targets are reasonable
    expect(response.body.targets.calories).toBeGreaterThan(1000);
    expect(response.body.targets.calories).toBeLessThan(4000);
    expect(response.body.targets.protein_g).toBeGreaterThan(50);
  });

  it('should handle muscle gain goal (200)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'gain',
        pace_kg_per_week: 0.25,
        diet_style: 'balanced'
      });

    expect(response.status).toBe(200);
    expect(response.body.goals.primary).toBe('gain');
    expect(response.body.goals.pace_kg_per_week).toBe(0.25);
    
    // Calorie surplus should result in higher calories
    expect(response.body.targets.calories).toBeGreaterThan(response.body.targets.tdee);
  });

  it('should handle recomp goal (200)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'recomp',
        pace_kg_per_week: 0,
        diet_style: 'high_protein'
      });

    expect(response.status).toBe(200);
    expect(response.body.goals.primary).toBe('recomp');
    
    // Maintenance should keep calories close to TDEE
    expect(Math.abs(response.body.targets.calories - response.body.targets.tdee)).toBeLessThan(50);
  });

  it('should reject invalid primary goal (400)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'invalid',
        pace_kg_per_week: -0.5,
        diet_style: 'balanced'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.message).toContain('primary goal');
  });

  it('should reject non-numeric pace (400)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'lose',
        pace_kg_per_week: 'fast',
        diet_style: 'balanced'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.message).toContain('pace_kg_per_week');
  });

  it('should reject invalid diet style (400)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'keto'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.message).toContain('diet_style');
  });

  it('should require authentication (401)', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .send({
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'balanced'
      });

    expect(response.status).toBe(401);
  });

  it('should handle server error gracefully (500)', async () => {
    // Temporarily break something to trigger 500
    const originalFindById = User.findById;
    User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        primary: 'lose',
        pace_kg_per_week: -0.5,
        diet_style: 'balanced'
      });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');

    // Restore
    User.findById = originalFindById;
  });
});

describe('GET /api/users/me/summary', () => {
  beforeEach(async () => {
    // Set up test data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Add weight progress
    await Progress.create([
      {
        user: testUser._id,
        type: 'weight',
        value: 80,
        unit: 'kg',
        date: twoDaysAgo
      },
      {
        user: testUser._id,
        type: 'weight',
        value: 79.5,
        unit: 'kg',
        date: yesterday
      },
      {
        user: testUser._id,
        type: 'weight',
        value: 79,
        unit: 'kg',
        date: today
      }
    ]);

    // Add workouts
    await Workout.create([
      {
        user: testUser._id,
        name: 'Test Workout 1',
        session: {
          completed: true,
          completedAt: yesterday
        }
      },
      {
        user: testUser._id,
        name: 'Test Workout 2',
        session: {
          completed: true,
          completedAt: today
        }
      }
    ]);

    // Add nutrition
    await Nutrition.create([
      {
        userId: testUser._id,
        name: 'Test Meal',
        servingSize: { amount: 1, unit: 'serving' },
        nutrition: { calories: 500, protein: 30, carbs: 50, fat: 15 },
        mealType: 'breakfast',
        consumedAt: today
      }
    ]);

    // Set user targets
    testUser.targets = {
      calories: 2000,
      protein_g: 150,
      carbs_g: 200,
      fat_g: 65,
      fiber_g: 30,
      water_cups: 10,
      bmr: 1680,
      tdee: 2400,
      formula: 'mifflin_st_jeor'
    };
    await testUser.save();
  });

  it('should return summary with 7d window (200)', async () => {
    const response = await request(app)
      .get('/api/users/me/summary?window=7d')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    
    // Check structure
    expect(response.body).toHaveProperty('weightTrend');
    expect(response.body).toHaveProperty('workoutsByDay');
    expect(response.body).toHaveProperty('streakDays');
    expect(response.body).toHaveProperty('nutritionCompliance');
    expect(response.body).toHaveProperty('steps');
    expect(response.body).toHaveProperty('hydrationCups');
    expect(response.body).toHaveProperty('targets');
    
    // Check weight trend
    expect(Array.isArray(response.body.weightTrend)).toBe(true);
    expect(response.body.weightTrend.length).toBeGreaterThan(0);
    expect(response.body.weightTrend[0]).toHaveProperty('date');
    expect(response.body.weightTrend[0]).toHaveProperty('kg');
    
    // Check workouts
    expect(Array.isArray(response.body.workoutsByDay)).toBe(true);
    expect(response.body.workoutsByDay.length).toBeGreaterThan(0);
    
    // Check streak
    expect(typeof response.body.streakDays).toBe('number');
    expect(response.body.streakDays).toBeGreaterThanOrEqual(0);
    
    // Check targets
    expect(response.body.targets).toHaveProperty('calories');
    expect(response.body.targets.formula).toBe('mifflin_st_jeor');
  });

  it('should return summary with 30d window (200)', async () => {
    const response = await request(app)
      .get('/api/users/me/summary?window=30d')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('weightTrend');
    // 30d should return more data points
    expect(response.body.weightTrend.length).toBeGreaterThanOrEqual(7);
  });

  it('should default to 7d window when not specified (200)', async () => {
    const response = await request(app)
      .get('/api/users/me/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('weightTrend');
  });

  it('should handle user with no data (200)', async () => {
    // Create new user with no progress data
    const newUser = await User.create({
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'female',
      height: { value: 165, unit: 'cm' },
      weight: { value: 60, unit: 'kg' }
    });

    const newToken = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/users/me/summary')
      .set('Authorization', `Bearer ${newToken}`);

    expect(response.status).toBe(200);
    expect(response.body.weightTrend).toEqual([]);
    expect(response.body.workoutsByDay).toEqual([]);
    expect(response.body.streakDays).toBe(0);
  });

  it('should require authentication (401)', async () => {
    const response = await request(app)
      .get('/api/users/me/summary');

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent user', async () => {
    const fakeToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), email: 'fake@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/users/me/summary')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Content-Type and Error Format', () => {
  it('should always return JSON content-type on success', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ weight: { value: 80, unit: 'kg' } });

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  it('should always return JSON content-type on error', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ invalidField: 'value' });

    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(typeof response.body).toBe('object');
  });

  it('should return standardized error format', async () => {
    const response = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ primary: 'invalid' });

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
    expect(typeof response.body.error.code).toBe('string');
    expect(typeof response.body.error.message).toBe('string');
  });
});


/*
 Seeds AI coaches for launch/demo without hitting HTTP endpoints.
 Usage: node backend/seed/seed-ai-coaches.js
 Requires MongoDB connection string via env (MONGODB_URI) like server.js.
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Coach = require('../models/Coach');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness_app';

const AI_COACHES = [
  {
    name: 'Noah Carter',
    email: 'noah.carter@ai.local',
    avatar: process.env.AI_COACH_1_AVATAR || 'https://picsum.photos/seed/coach-1/900/700',
    niches: ['strength', 'hypertrophy'],
    followers: 12800,
  },
  {
    name: 'Ava Williams',
    email: 'ava.williams@ai.local',
    avatar: process.env.AI_COACH_2_AVATAR || 'https://picsum.photos/seed/coach-2/900/700',
    niches: ['conditioning', 'mobility'],
    followers: 15400,
  },
  {
    name: 'Jacob Brown',
    email: 'jacob.brown@ai.local',
    avatar: process.env.AI_COACH_3_AVATAR || 'https://picsum.photos/seed/coach-3/900/700',
    niches: ['bodyweight', 'hiit'],
    followers: 9200,
  },
  {
    name: 'Olivia Lewis',
    email: 'olivia.lewis@ai.local',
    avatar: process.env.AI_COACH_4_AVATAR || 'https://picsum.photos/seed/coach-4/900/700',
    niches: ['endurance', 'strength'],
    followers: 17600,
  },
];

async function run() {
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 10000 });
  console.log('Connected. Seeding AI coaches...');

  const results = [];
  for (const c of AI_COACHES) {
    try {
      const [firstName, ...rest] = c.name.split(' ');
      const lastName = rest.join(' ') || 'Coach';
      const user = await User.findOneAndUpdate(
        { email: c.email },
        {
          email: c.email,
          firstName,
          lastName,
          avatar: c.avatar,
          isPremium: true, // treat AI coach account as admin/premium
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const coach = await Coach.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          bio: `${c.name} — AI Coach`,
          niches: c.niches,
          verified: true,
          rating: 4.8,
          ratingCount: 124,
          followers: c.followers,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({ id: coach._id, name: c.name });
      console.log('Seeded coach:', c.name, String(coach._id));
    } catch (e) {
      console.warn('Failed to seed', c.name, e.message);
    }
  }

  await mongoose.connection.close();
  console.log('Done. Seeded:', results);
}

run().catch((e) => {
  console.error('Seed error', e);
  process.exit(1);
});



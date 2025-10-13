/**
 * Example integration of the Discover feature
 * 
 * This file shows how to integrate the new TypeScript Discover screen
 * into your existing navigation setup.
 */

// ============================================================================
// OPTION 1: Replace existing DiscoverScreen in TabNavigator
// ============================================================================

// In src/navigation/TabNavigator.js, replace the old import:
// OLD: import DiscoverScreen from '../screens/DiscoverScreen';
// NEW:
import { DiscoverScreen } from '../features/discover';

// The rest of your TabNavigator stays the same:
/*
<Tab.Screen
  name="Discover"
  component={DiscoverScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="compass-outline" size={size} color={color} />
    ),
  }}
/>
*/

// ============================================================================
// OPTION 2: Use both screens (for gradual migration)
// ============================================================================

import OldDiscoverScreen from '../screens/DiscoverScreen';
import { DiscoverScreen as NewDiscoverScreen } from '../features/discover';

// In your TabNavigator, you can switch between them:
const USE_NEW_DISCOVER = true; // Feature flag

/*
<Tab.Screen
  name="Discover"
  component={USE_NEW_DISCOVER ? NewDiscoverScreen : OldDiscoverScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="compass-outline" size={size} color={color} />
    ),
  }}
/>
*/

// ============================================================================
// OPTION 3: Use hooks and components in custom screen
// ============================================================================

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  useTrendingPrograms,
  useCoaches,
  ProgramCard,
  CoachCard,
  SkeletonList,
  ErrorState,
} from '../features/discover';

export function CustomDiscoverScreen({ navigation }) {
  const { data: trending, isLoading, error, refetch } = useTrendingPrograms({
    region: 'US',
  });
  const { data: coaches } = useCoaches({ limit: 5 });

  if (isLoading) return <SkeletonList count={3} type="program" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <ScrollView>
      <Text>Trending Programs</Text>
      {trending?.map((program, index) => (
        <ProgramCard
          key={program.id}
          program={program}
          source="trending"
          position={index}
          onPress={(prog) => navigation.navigate('ProgramDetail', { id: prog.id })}
        />
      ))}

      <Text>Top Coaches</Text>
      {coaches?.map((coach, index) => (
        <CoachCard
          key={coach.id}
          coach={coach}
          source="home"
          position={index}
          onPress={(c) => navigation.navigate('CoachProfile', { id: c.id })}
        />
      ))}
    </ScrollView>
  );
}

// ============================================================================
// OPTION 4: Use components in other screens
// ============================================================================

import { ProgramCard as DiscoverProgramCard } from '../features/discover';

export function HomeScreen({ navigation }) {
  // ... your existing code

  const featuredProgram = {
    id: '123',
    title: 'Full Body Strength',
    coverUrl: 'https://...',
    priceCents: 0,
    coach: 'John Doe',
    rating: 4.8,
  };

  return (
    <View>
      <Text>Featured Program</Text>
      <ProgramCard
        program={featuredProgram}
        source="home"
        onPress={(prog) => navigation.navigate('ProgramDetail', { id: prog.id })}
      />
    </View>
  );
}

// ============================================================================
// Backend Integration - Connect to your actual API
// ============================================================================

// In backend/routes/discover.js (or appropriate file), add these routes:

/*
const express = require('express');
const router = express.Router();

// GET /api/trending?region={region}&window=7d
router.get('/trending', async (req, res) => {
  const { region = 'global', window = '7d' } = req.query;
  
  // Your logic to fetch trending programs
  const programs = await Program.find({ 
    region: region === 'global' ? { $exists: true } : region,
    createdAt: { $gte: getDateFromWindow(window) }
  })
    .sort({ popularity: -1, rating: -1 })
    .limit(20)
    .populate('coach');
  
  res.json({ items: programs });
});

// GET /api/coaches?page={page}&limit={limit}
router.get('/coaches', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  
  const coaches = await Coach.find({ verified: true })
    .sort({ followers: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const hasMore = await Coach.countDocuments({ verified: true }) > skip + coaches.length;
  
  res.json({
    items: coaches,
    nextPage: hasMore ? parseInt(page) + 1 : undefined
  });
});

// GET /api/programs?page={page}&limit={limit}
router.get('/programs', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  
  const programs = await Program.find({ published: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('coach');
  
  const hasMore = await Program.countDocuments({ published: true }) > skip + programs.length;
  
  res.json({
    items: programs,
    nextPage: hasMore ? parseInt(page) + 1 : undefined
  });
});

module.exports = router;
*/

// ============================================================================
// Environment-based Region Selection
// ============================================================================

import { Platform } from 'react-native';
import * as Localization from 'expo-localization';

export function getDefaultRegion() {
  if (Platform.OS === 'web') {
    // Use browser locale
    return navigator.language.split('-')[1] || 'global';
  }
  
  // Use device locale
  const locale = Localization.locale;
  const region = locale.split('-')[1];
  
  // Map common regions
  const supportedRegions = ['US', 'GB', 'CA', 'AU', 'EU'];
  return supportedRegions.includes(region) ? region : 'global';
}

// Use in DiscoverScreen:
/*
const [region, setRegion] = useState(getDefaultRegion());
*/

export {};


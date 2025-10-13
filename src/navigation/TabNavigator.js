import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

// Import screens
import HomeScreen from '../screens/HomeScreenEnhanced';
import WorkoutLibraryScreen from '../screens/WorkoutLibraryScreen';
import ProgressScreenEnhanced from '../screens/ProgressScreenEnhanced';
import PlansScreen from '../screens/PlansScreen';
import PlanDetailScreen from '../screens/PlanDetailScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import CreatorApplyScreen from '../screens/CreatorApplyScreen';
import CreatorHubScreen from '../screens/CreatorHubScreen';
import CreatorDraftsScreen from '../screens/CreatorDraftsScreen';
import ProgramTemplateScreen from '../screens/ProgramTemplateScreen';
// Removed SocialScreen import due to FEATURE_FEED=false
import NutritionScreen from '../screens/NutritionScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CoachChannelScreen from '../screens/CoachChannelScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewWorkoutScreen from '../screens/NewWorkoutScreen';
import NewProgramScreen from '../screens/NewProgramScreen';
import CreateRoutineScreen from '../screens/CreateRoutineScreen';
import CreatorAnalyticsScreen from '../screens/CreatorAnalyticsScreen';
import MediaLibraryScreen from '../screens/MediaLibraryScreen';
import CreatorClipEditorScreen from '../screens/CreatorClipEditorScreen';
import CreatorTimelineEditorScreen from '../screens/CreatorTimelineEditorScreen';
import CoachProfileScreen from '../screens/CoachProfileScreen';
import CreatorProfileEditor from '../screens/CreatorProfileEditor';
import ProfilePhotoScreen from '../screens/ProfilePhotoScreen';
import DataSourcesScreen from '../screens/DataSourcesScreen';
import HealthSettingsScreen from '../screens/HealthSettingsScreen';
import MealPlanningScreen from '../screens/MealPlanningScreen';
import RecipeBrowserScreen from '../screens/RecipeBrowserScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import ScanScreen from '../features/scan/ScanScreen';
import DevAnalyticsPanel from '../screens/DevAnalyticsPanel';
import MyLunchScreen from '../screens/MyLunchScreen';
import GoalQuizScreen from '../screens/GoalQuizScreen';
import PlanSummaryScreen from '../screens/PlanSummaryScreen';

const Tab = createBottomTabNavigator();

/**
 * TabNavigator component with cyberpunk styling
 *
 * This component will be used to navigate between the main screens of the app
 */
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        headerStyle: styles.header,
        headerTintColor: COLORS.text.primary,
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutLibraryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="fitness" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreenEnhanced}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Creator"
        component={CreatorHubScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="create" color={color} size={28} />
          ),
        }}
      />
      {/* Hidden routes for deep navigation */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ProfilePhoto"
        component={ProfilePhotoScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="DataSources"
        component={DataSourcesScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CoachChannel"
        component={CoachChannelScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorApply"
        component={CreatorApplyScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorHub"
        component={CreatorHubScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorDrafts"
        component={CreatorDraftsScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="MediaLibrary"
        component={MediaLibraryScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorClipEditor"
        component={CreatorClipEditorScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorTimelineEditor"
        component={CreatorTimelineEditorScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ProgramTemplate"
        component={ProgramTemplateScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="NewWorkout"
        component={NewWorkoutScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="NewProgram"
        component={NewProgramScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="CreatorAnalytics"
        component={CreatorAnalyticsScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="CreatorProfileEditor"
        component={CreatorProfileEditor}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="CoachProfile"
        component={CoachProfileScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="CreateRoutine"
        component={CreateRoutineScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="MyLunch"
        component={MyLunchScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="GoalQuiz"
        component={GoalQuizScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="PlanSummary"
        component={PlanSummaryScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="HealthSettings"
        component={HealthSettingsScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="MealPlanning"
        component={MealPlanningScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="RecipeBrowser"
        component={RecipeBrowserScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="RecipeForm"
        component={RecipeFormScreen}
        options={{ tabBarButton: () => null }}
      />

      <Tab.Screen
        name="GroceryList"
        component={GroceryListScreen}
        options={{ tabBarButton: () => null }}
      />

      {__DEV__ && (
        <Tab.Screen
          name="DevAnalytics"
          component={DevAnalyticsPanel}
          options={{ tabBarButton: () => null }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = {
  tabBar: {
    backgroundColor: COLORS.background.secondary,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 75, // Increased from 60 to 75
    paddingBottom: 10, // More padding
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 13, // Bigger font (was FONTS.size.xs ~11px)
    fontWeight: FONTS.weight.semibold, // Bolder text
    marginTop: 2,
  },
  tabIcon: {
    marginBottom: 2,
  },
  header: {
    backgroundColor: COLORS.background.secondary,
    elevation: 0,
    shadowOpacity: 0,
  },
};

export default TabNavigator;

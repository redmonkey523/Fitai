import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { apiService, handleApiError } from '../services/api';
import { FEATURE_FEED } from '../config/flags';

const SocialScreen = () => {
  // Feature flag check - return disabled state if social feed is disabled
  if (!FEATURE_FEED) {
    return (
      <View style={styles.disabledContainer}>
        <LinearGradient
          colors={[COLORS.background.primary, COLORS.background.secondary]}
          style={styles.disabledGradient}
        >
          <Ionicons name="people-outline" size={80} color={COLORS.text.tertiary} />
          <Text style={styles.disabledTitle}>Social Features Temporarily Disabled</Text>
          <Text style={styles.disabledText}>
            Social features including feed, challenges, and friends are currently unavailable. 
            Focus on your fitness journey with workouts, nutrition tracking, and progress monitoring!
          </Text>
          <View style={styles.disabledActions}>
            <Button
              title="Go to Workouts"
              onPress={() => {/* Navigation handled by parent */}}
              style={styles.disabledButton}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // State for active tab
  const [activeTab, setActiveTab] = useState('feed');

  // Real user data (starts empty)
  const [feedItems, setFeedItems] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const loadFeed = async () => {
    try {
      const res = await apiService.social.getFeed({ page: 1, limit: 10 });
      const { activities } = res.data.data;
      const mapped = activities.map((a) => ({
        id: a.id,
        user: `${a.user?.firstName || 'User'} ${a.user?.lastName || ''}`.trim(),
        time: new Date(a.timestamp).toLocaleString(),
        content:
          a.type === 'workout_completed'
            ? `Completed ${a.data.workoutName} • ${a.data.duration} min • ${a.data.caloriesBurned} kcal`
            : a.type === 'goal_achieved'
            ? a.data.achievement
            : a.type,
        type: a.type.includes('workout') ? 'workout' : a.type.includes('goal') ? 'achievement' : 'progress',
        isLiked: false,
        likes: a.likes || 0,
        comments: a.comments || 0,
      }));
      setFeedItems(mapped);
    } catch (e) {
      Alert.alert('Feed', handleApiError(e));
    }
  };

  const loadChallenges = async () => {
    try {
      const res = await apiService.social.getChallenges({ status: 'active', limit: 10 });
      const list = res.data.data.map((c) => ({
        id: c.id,
        title: c.title,
        participants: c.participants,
        currentDay: 1,
        days: c.duration,
        isJoined: false,
      }));
      setChallenges(list);
    } catch (e) {
      Alert.alert('Challenges', handleApiError(e));
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await apiService.social.joinChallenge(challengeId);
      setChallenges((prev) => prev.map((c) => (c.id === challengeId ? { ...c, isJoined: true } : c)));
      Alert.alert('Challenge', 'Joined successfully');
    } catch (e) {
      Alert.alert('Join Challenge', handleApiError(e));
    }
  };

  const loadFriends = async () => {
    try {
      const res = await apiService.user.getFriends();
      const list = (res.data.data || []).map((u) => ({
        id: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        status: 'Friend',
      }));
      setFriends(list);
    } catch (e) {
      Alert.alert('Friends', handleApiError(e));
    }
  };

  const searchUsers = async (query) => {
    try {
      if (!query || query.trim().length < 2) return setSearchResults([]);
      setLoadingSearch(true);
      const res = await apiService.user.searchUsers(query.trim(), 10);
      setSearchResults(res.data.data || []);
    } catch (e) {
      Alert.alert('Search', handleApiError(e));
    } finally {
      setLoadingSearch(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await apiService.user.sendFriendRequest(userId);
      Alert.alert('Friend Request', 'Request sent');
    } catch (e) {
      Alert.alert('Friend Request', handleApiError(e));
    }
  };

  const handleLike = async (activityId) => {
    try {
      await apiService.social.likeActivity(activityId);
      setFeedItems((items) =>
        items.map((it) =>
          it.id === activityId
            ? { ...it, isLiked: true, likes: (it.likes || 0) + 1 }
            : it
        )
      );
    } catch (e) {
      Alert.alert('Like', handleApiError(e));
    }
  };

  const handleComment = async (activityId) => {
    try {
      const content = 'Nice work!';
      await apiService.social.commentActivity(activityId, content);
      setFeedItems((items) =>
        items.map((it) =>
          it.id === activityId
            ? { ...it, comments: (it.comments || 0) + 1 }
            : it
        )
      );
      Alert.alert('Comment', 'Comment posted');
    } catch (e) {
      Alert.alert('Comment', handleApiError(e));
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return renderFeedTab();
      case 'challenges':
        return renderChallengesTab();
      case 'friends':
        return renderFriendsTab();
      default:
        return renderFeedTab();
    }
  };

  // Render feed tab content
  const renderFeedTab = () => {
    return (
      <View style={styles.tabContent}>
        {feedItems.length > 0 ? (
          feedItems.map((item) => (
            <Card
              key={item.id}
              style={styles.feedCard}
            >
              <View style={styles.feedHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.text.tertiary} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.postTime}>{item.time}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.feedContent}>
                <Text style={styles.feedText}>{item.content}</Text>
                
                {item.type === 'workout' && (
                  <View style={styles.workoutBadge}>
                    <Ionicons name="fitness" size={16} color={COLORS.accent.success} />
                    <Text style={styles.workoutBadgeText}>Workout</Text>
                  </View>
                )}
                
                {item.type === 'achievement' && (
                  <View style={styles.achievementBadge}>
                    <Ionicons name="trophy" size={16} color={COLORS.accent.quaternary} />
                    <Text style={styles.achievementBadgeText}>{item.achievement}</Text>
                  </View>
                )}
                
                {item.type === 'challenge' && (
                  <View style={styles.challengeBadge}>
                    <Ionicons name="flag" size={16} color={COLORS.accent.secondary} />
                    <Text style={styles.challengeBadgeText}>{item.challenge}</Text>
                    <ProgressBar progress={item.progress} type="primary" />
                  </View>
                )}
                
                {item.type === 'progress' && (
                  <View style={styles.progressBadge}>
                    <Ionicons name="trending-up" size={16} color={COLORS.accent.primary} />
                    <Text style={styles.progressBadgeText}>{item.value} {item.metric}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.feedActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
                  <Ionicons 
                    name={item.isLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={item.isLiked ? COLORS.accent.error : COLORS.text.secondary} 
                  />
                  <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.text.secondary} />
                  <Text style={styles.actionText}>{item.comments}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color={COLORS.text.secondary} />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No activity yet</Text>
            <Text style={styles.emptyStateText}>
              Connect with friends and join challenges to see activity in your feed. Share your fitness journey to inspire others!
            </Text>
            <View style={styles.emptyStateButtons}>
              <Button
                type="primary"
                label="FIND FRIENDS"
                onPress={() => { setActiveTab('friends'); loadFriends(); }}
                style={styles.emptyStateButton}
              />
              <Button
                type="secondary"
                label="JOIN CHALLENGES"
                onPress={() => { setActiveTab('challenges'); loadChallenges(); }}
                style={styles.emptyStateButton}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render challenges tab content
  const renderChallengesTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card
          type="primary"
          title="Active Challenges"
          subtitle="Join challenges to stay motivated"
          style={styles.card}
        >
          {challenges.length > 0 ? (
            <View style={styles.challengesContainer}>
              {challenges.map((challenge) => (
                <View key={challenge.id} style={styles.challengeItem}>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeParticipants}>
                      {challenge.participants} participants
                    </Text>
                    <Text style={styles.challengeProgress}>
                      Day {challenge.currentDay} of {challenge.days}
                    </Text>
                  </View>
                  
                  <View style={styles.challengeActions}>
                    {challenge.isJoined ? (
                      <Button
                        type="outline"
                        label="VIEW PROGRESS"
                        size="sm"
                        onPress={async () => {
                          try {
                            const res = await apiService.social.getChallengeProgress(challenge.id);
                            const p = res.data.data;
                            Alert.alert('Challenge Progress', `Progress: ${p.progress}%`);
                          } catch (e) {
                            Alert.alert('Progress', handleApiError(e));
                          }
                        }}
                      />
                    ) : (
                      <Button
                        type="primary"
                        label="JOIN"
                        size="sm"
                        onPress={() => handleJoinChallenge(challenge.id)}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="flag-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No challenges joined</Text>
              <Text style={styles.emptyStateText}>
                Join fitness challenges to compete with friends and stay motivated on your fitness journey.
              </Text>
              <Button
                type="primary"
                label="BROWSE CHALLENGES"
                onPress={loadChallenges}
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </Card>
        
        <Card
          title="Popular Challenges"
          style={styles.popularChallengesCard}
        >
          <View style={styles.popularChallengesContent}>
            <View style={styles.popularChallengeItem}>
              <View style={styles.popularChallengeIcon}>
                <Ionicons name="fitness" size={24} color={COLORS.accent.primary} />
              </View>
              <View style={styles.popularChallengeInfo}>
                <Text style={styles.popularChallengeTitle}>30-Day Fitness Challenge</Text>
                <Text style={styles.popularChallengeDescription}>
                  Complete a workout every day for 30 days
                </Text>
                <Text style={styles.popularChallengeStats}>1,245 participants</Text>
              </View>
              <Button
                type="secondary"
                label="JOIN"
                size="sm"
                onPress={() => handleJoinChallenge('1')}
              />
            </View>
            
            <View style={styles.popularChallengeItem}>
              <View style={styles.popularChallengeIcon}>
                <Ionicons name="walk" size={24} color={COLORS.accent.secondary} />
              </View>
              <View style={styles.popularChallengeInfo}>
                <Text style={styles.popularChallengeTitle}>10K Steps Daily</Text>
                <Text style={styles.popularChallengeDescription}>
                  Walk 10,000 steps every day for a week
                </Text>
                <Text style={styles.popularChallengeStats}>892 participants</Text>
              </View>
              <Button
                type="secondary"
                label="JOIN"
                size="sm"
                onPress={() => handleJoinChallenge('2')}
              />
            </View>
            
            <View style={styles.popularChallengeItem}>
              <View style={styles.popularChallengeIcon}>
                <Ionicons name="leaf" size={24} color={COLORS.accent.success} />
              </View>
              <View style={styles.popularChallengeInfo}>
                <Text style={styles.popularChallengeTitle}>Hydration Challenge</Text>
                <Text style={styles.popularChallengeDescription}>
                  Drink 8 glasses of water daily for 14 days
                </Text>
                <Text style={styles.popularChallengeStats}>567 participants</Text>
              </View>
              <Button
                type="secondary"
                label="JOIN"
                size="sm"
                onPress={() => handleJoinChallenge('3')}
              />
            </View>
          </View>
        </Card>
      </View>
    );
  };

  // Render friends tab content
  const renderFriendsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card
          type="secondary"
          title="Your Friends"
          subtitle="Connect and motivate each other"
          style={styles.card}
        >
          {friends.length > 0 ? (
            <View style={styles.friendsContainer}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendItem}>
                  <View style={styles.friendAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.text.tertiary} />
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendStatus}>{friend.status}</Text>
                  </View>
                  <View style={styles.friendActions}>
                    <Button
                      type="outline"
                      label="VIEW"
                      size="sm"
                      onPress={() => {}}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="person-add-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No friends yet</Text>
              <Text style={styles.emptyStateText}>
                Connect with friends to share your fitness journey, compete in challenges, and motivate each other.
              </Text>
              <Button
                type="primary"
                label="FIND FRIENDS"
                onPress={loadFriends}
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </Card>
        
        <Card title="Find Friends" style={styles.suggestedFriendsCard}>
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchLabel}>Search by name or email</Text>
            </View>
          </View>
          <View style={{ marginTop: SIZES.spacing.sm }}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => searchUsers('john')}
            >
              <Ionicons name="search" size={16} color={COLORS.text.primary} />
              <Text style={styles.searchButtonText}>{loadingSearch ? 'Searching…' : 'Quick Search: john'}</Text>
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={{ marginTop: SIZES.spacing.md }}>
              {searchResults.map((u) => (
                <View key={u._id} style={styles.suggestedFriendItem}>
                  <View style={styles.suggestedFriendAvatar}>
                    <Ionicons name="person" size={20} color={COLORS.text.tertiary} />
                  </View>
                  <View style={styles.suggestedFriendInfo}>
                    <Text style={styles.suggestedFriendName}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</Text>
                    <Text style={styles.suggestedFriendMutual}>{u.email}</Text>
                  </View>
                  <Button
                    type="primary"
                    label="ADD"
                    size="sm"
                    onPress={() => sendFriendRequest(u._id)}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card
          title="Suggested Friends"
          style={styles.suggestedFriendsCard}
        >
          <View style={styles.suggestedFriendsContent}>
            <View style={styles.suggestedFriendItem}>
              <View style={styles.suggestedFriendAvatar}>
                <Ionicons name="person" size={20} color={COLORS.text.tertiary} />
              </View>
              <View style={styles.suggestedFriendInfo}>
                <Text style={styles.suggestedFriendName}>Alex Johnson</Text>
                <Text style={styles.suggestedFriendMutual}>3 mutual friends</Text>
              </View>
              <Button
                type="primary"
                label="ADD"
                size="sm"
                onPress={() => Alert.alert('Add Friend', 'Use search to add real users in a later step.')}
              />
            </View>
            
            <View style={styles.suggestedFriendItem}>
              <View style={styles.suggestedFriendAvatar}>
                <Ionicons name="person" size={20} color={COLORS.text.tertiary} />
              </View>
              <View style={styles.suggestedFriendInfo}>
                <Text style={styles.suggestedFriendName}>Sarah Chen</Text>
                <Text style={styles.suggestedFriendMutual}>2 mutual friends</Text>
              </View>
              <Button
                type="primary"
                label="ADD"
                size="sm"
                onPress={() => Alert.alert('Add Friend', 'Use search to add real users in a later step.')}
              />
            </View>
            
            <View style={styles.suggestedFriendItem}>
              <View style={styles.suggestedFriendAvatar}>
                <Ionicons name="person" size={20} color={COLORS.text.tertiary} />
              </View>
              <View style={styles.suggestedFriendInfo}>
                <Text style={styles.suggestedFriendName}>Mike Rodriguez</Text>
                <Text style={styles.suggestedFriendMutual}>1 mutual friend</Text>
              </View>
              <Button
                type="primary"
                label="ADD"
                size="sm"
                onPress={() => Alert.alert('Add Friend', 'Use search to add real users in a later step.')}
              />
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Social</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => { setActiveTab('feed'); loadFeed(); }}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'feed' && styles.activeTabText
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => { setActiveTab('challenges'); loadChallenges(); }}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'challenges' && styles.activeTabText
            ]}
          >
            Challenges
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => { setActiveTab('friends'); loadFriends(); }}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'friends' && styles.activeTabText
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SIZES.spacing.lg,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent.primary,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  activeTabText: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: SIZES.spacing.lg,
  },
  card: {
    marginBottom: SIZES.spacing.md,
  },
  emptyStateContainer: {
    padding: SIZES.spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  emptyStateText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
    lineHeight: 24,
  },
  emptyStateButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyStateButton: {
    marginHorizontal: SIZES.spacing.sm,
    minWidth: 120,
  },
  feedCard: {
    marginBottom: SIZES.spacing.md,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  postTime: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
  },
  moreButton: {
    padding: SIZES.spacing.xs,
  },
  feedContent: {
    marginBottom: SIZES.spacing.md,
  },
  feedText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    lineHeight: 24,
    marginBottom: SIZES.spacing.sm,
  },
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    alignSelf: 'flex-start',
  },
  workoutBadgeText: {
    color: COLORS.accent.success,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.xs,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    alignSelf: 'flex-start',
  },
  achievementBadgeText: {
    color: COLORS.accent.quaternary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.xs,
  },
  challengeBadge: {
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  challengeBadgeText: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.xs,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    alignSelf: 'flex-start',
  },
  progressBadgeText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.xs,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.utility.divider,
    paddingTop: SIZES.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xs,
  },
  actionText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginLeft: SIZES.spacing.xs,
  },
  challengesContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  challengeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  challengeParticipants: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  challengeProgress: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  challengeActions: {
    marginLeft: SIZES.spacing.md,
  },
  popularChallengesCard: {
    marginTop: SIZES.spacing.md,
  },
  popularChallengesContent: {
    paddingVertical: SIZES.spacing.md,
  },
  popularChallengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  popularChallengeIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  popularChallengeInfo: {
    flex: 1,
  },
  popularChallengeTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  popularChallengeDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  popularChallengeStats: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
  friendsContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  friendStatus: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  friendActions: {
    marginLeft: SIZES.spacing.md,
  },
  suggestedFriendsCard: {
    marginTop: SIZES.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.round,
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.sm,
    alignSelf: 'flex-start',
  },
  searchButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    marginLeft: SIZES.spacing.xs,
  },
  suggestedFriendsContent: {
    paddingVertical: SIZES.spacing.md,
  },
  suggestedFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  suggestedFriendAvatar: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  suggestedFriendInfo: {
    flex: 1,
  },
  suggestedFriendName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.xs,
  },
  suggestedFriendMutual: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  bottomPadding: {
    height: 80,
  },
  // Disabled state styles
  disabledContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  disabledGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  disabledTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  disabledText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  disabledActions: {
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    minWidth: 160,
  },
});

export default SocialScreen;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Card } from './Card';
import { Button } from './Button';
import PostHeader from './feed/PostHeader';
import api from '../services/api';
import { FEATURE_FEED } from '../config/flags';

const { width, height } = Dimensions.get('window');

const SocialFeed = ({ 
  navigation,
  onRefresh,
  refreshing = false,
  showChallenges = true,
  showLeaderboard = true,
  showFriends = true
}) => {
  // Feature flag check - return disabled state if social feed is disabled
  if (!FEATURE_FEED) {
    return (
      <View style={styles.disabledContainer}>
        <Ionicons name="heart-dislike-outline" size={64} color={COLORS.text.tertiary} />
        <Text style={styles.disabledTitle}>Social Feed Temporarily Disabled</Text>
        <Text style={styles.disabledText}>
          The social feed feature is currently unavailable. Focus on your workouts and nutrition tracking!
        </Text>
      </View>
    );
  }

  const dispatch = useDispatch();
  const socialState = useSelector(state => state.social);
  const userState = useSelector(state => state.user);
  
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);
  const [creating, setCreating] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerMedia, setComposerMedia] = useState([]); // [{ uri|file, progress: 0..1, url? }]
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const flatListRef = useRef(null);
  const cancelRef = React.useRef(null);

  // No mock data – wire to backend

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'feed': {
          const res = await api.getSocialFeed?.({ limit: 20, page: 1 });
          const activities = res?.data?.activities || res?.activities || [];
          const normalized = activities.map(a => ({
            id: a.id,
            author: a.author || {
              id: a.user?.id,
              displayName: [a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ') || 'User',
              avatarUrl: a.user?.profilePicture || null,
              username: a.user?.username || null,
              badges: a.user?.badges || {},
            },
            type: a.type,
            caption: a.caption || a.content,
            content: a.content,
            timestamp: new Date(a.createdAt),
            location: a.location || null,
            likes: a.likeCount || 0,
            comments: a.commentCount || 0,
            media: Array.isArray(a.media) ? a.media : [],
          }));
          // Deduplicate by id
          const unique = [];
          const seen = new Set();
          for (const p of normalized) { if (!seen.has(p.id)) { seen.add(p.id); unique.push(p); } }
          setPosts(unique);
          setPagination({ page: 1, hasMore: (activities?.length || 0) === 20 });
          break;
        }
        case 'challenges': {
          const res = await api.getChallenges?.({ status: 'active' });
          setChallenges(res?.data || []);
          break;
        }
        case 'leaderboard': {
          const res = await api.getLeaderboard?.({ type: 'overall' });
          const lb = res?.data?.leaderboard || [];
          setLeaderboard(lb);
          break;
        }
        case 'friends': {
          const res = await api.getFriends?.();
          setFriends(res?.data || []);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      Alert.alert('Error', 'Failed to load social data');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !pagination.hasMore || activeTab !== 'feed') return;
    setLoading(true);
    try {
      const nextPage = pagination.page + 1;
      const res = await api.getSocialFeed?.({ limit: 20, page: nextPage });
      const activities = res?.data?.activities || res?.activities || [];
      const normalized = activities.map(a => ({
        id: a.id,
        author: a.author || {
          id: a.user?.id,
          displayName: [a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ') || 'User',
          avatarUrl: a.user?.profilePicture || null,
          username: a.user?.username || null,
          badges: a.user?.badges || {},
        },
        type: a.type,
        caption: a.caption || a.content,
        content: a.content,
        timestamp: new Date(a.createdAt),
        location: a.location || null,
        likes: a.likeCount || 0,
        comments: a.commentCount || 0,
        media: Array.isArray(a.media) ? a.media : [],
      }));
      // Deduplicate
      setPosts(prev => {
        const seen = new Set(prev.map(p => p.id));
        const merged = [...prev];
        for (const p of normalized) if (!seen.has(p.id)) merged.push(p);
        return merged;
      });
      setPagination({ page: nextPage, hasMore: (activities?.length || 0) === 20 });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onCreatePost = async () => {
    if (creating) return;
    if (!composerText && composerMedia.length === 0) return;
    setCreating(true);
    try {
      // Optimistic insert
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        userId: userState?.id,
        userName: userState?.name || 'You',
        userAvatar: userState?.avatar || 'https://via.placeholder.com/50',
        type: 'post',
        content: composerText,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        media: composerMedia.map(m => ({ url: m.uri || m.url, type: m.type || 'image' })),
        pending: true,
      };
      setPosts(prev => [optimistic, ...prev]);

      // Upload media with per-file progress and cancellation
      const mediaResults = [];
      const cancels = [];
      cancelRef.current = () => { cancels.forEach((c) => { try { c(); } catch {} }); };
      for (let i = 0; i < composerMedia.length; i += 1) {
        const part = composerMedia[i].file || composerMedia[i];
        const { promise, cancel } = api.uploadFileWithProgressCancellable(part, 'file', (pct) => {
          setComposerMedia(prev => prev.map((m, idx) => idx === i ? { ...m, progress: pct } : m));
        });
        cancels.push(cancel);
        const res = await promise;
        const url = res?.file?.url || res?.data?.file?.url || res?.url;
        const type = (url || '').match(/\.(mp4|mov|avi|mkv)$/i) ? 'video' : 'image';
        if (url) mediaResults.push({ url, type });
      }
      await api.createSocialActivity({ type: 'post', content: composerText, tags: [], location: null, media: mediaResults });
      // reload first page to replace optimistic
      await loadData();
      setComposerText('');
      setComposerMedia([]);
    } catch (e) {
      Alert.alert('Post failed', e?.message || 'Could not post');
      // revert optimistic
      setPosts(prev => prev.filter(p => !String(p.id).startsWith('temp-')));
    } finally {
      setCreating(false);
    }
  };

  const cancelUploads = () => {
    try { cancelRef.current && cancelRef.current(); } catch {}
    setCreating(false);
  };

  const pickComposerMedia = async () => {
    try {
      const picker = await import('expo-image-picker');
      const res = await picker.launchImageLibraryAsync({ mediaTypes: picker.MediaTypeOptions.All, allowsMultipleSelection: true });
      if (res.canceled) return;
      const assets = (res.assets || []).map(a => ({ uri: a.uri, name: a.fileName, type: a.type === 'video' ? 'video/*' : 'image/*', progress: 0 }));
      setComposerMedia(prev => [...prev, ...assets]);
    } catch (e) {
      Alert.alert('Picker', e?.message || 'Failed to pick media');
    }
  };

  const handleLike = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    );
  };

  const handleJoinChallenge = (challengeId) => {
    Alert.alert('Challenge Joined!', 'You have successfully joined this challenge.');
  };

  const handleFriendRequest = (friendId) => {
    Alert.alert('Friend Request', 'Friend request sent successfully!');
  };

    const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <PostHeader
          author={item.author}
          createdAt={item.timestamp}
          location={item.location}
          onPressAuthor={(id) => navigation?.navigate && navigation.navigate('Profile', { id })}
        />
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent}>{item.caption || item.content}</Text>

      {Array.isArray(item.media) && item.media.length > 0 && (
        <View style={{ gap: 8 }}>
          {item.media.slice(0, 4).map((m, i) => (
            <View key={`${item.id}-m-${i}`} style={{ height: 200, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000000' }} />
          ))}
        </View>
      )}

      {item.workout && (
        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Ionicons name="fitness" size={20} color={COLORS.primary} />
            <Text style={styles.workoutTitle}>Workout Completed</Text>
          </View>
          <View style={styles.workoutStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.workout.duration}min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.workout.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.workout.type}</Text>
              <Text style={styles.statLabel}>Type</Text>
            </View>
          </View>
        </View>
      )}

      {item.progress && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.success} />
            <Text style={styles.progressTitle}>Progress Update</Text>
          </View>
          <Text style={styles.progressValue}>
            {item.progress.value} {item.progress.unit}
            {item.progress.change > 0 ? ' (+' : ' ('}{item.progress.change}{item.progress.change > 0 ? ')' : ')'}
          </Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons name="heart-outline" size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderChallenge = ({ item }) => (
    <Card style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIcon}>
          <Ionicons 
            name={getChallengeIcon(item.type)} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.challengeStats}>
        <View style={styles.challengeStat}>
          <Text style={styles.statValue}>{item.participants}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.challengeStat}>
          <Text style={styles.statValue}>{item.daysLeft}</Text>
          <Text style={styles.statLabel}>Days Left</Text>
        </View>
        <View style={styles.challengeStat}>
          <Text style={styles.statValue}>{item.reward}</Text>
          <Text style={styles.statLabel}>Reward</Text>
        </View>
      </View>
      
      <Button
        title="Join Challenge"
        onPress={() => handleJoinChallenge(item.id)}
        style={styles.joinButton}
      />
    </Card>
  );

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, index < 3 && styles.topRank]}>{item.rank}</Text>
      </View>
      <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardName}>{item.name}</Text>
        <Text style={styles.leaderboardPoints}>{item.points} points</Text>
      </View>
      {index < 3 && (
        <View style={styles.trophyContainer}>
          <Ionicons 
            name="trophy" 
            size={20} 
            color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} 
          />
        </View>
      )}
    </View>
  );

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>
          {item.status === 'online' ? '🟢 Online' : `⚫ ${item.lastActive}`}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.friendAction}
        onPress={() => handleFriendRequest(item.id)}
      >
        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'strength': return 'fitness';
      case 'cardio': return 'flash';
      case 'nutrition': return 'restaurant';
      default: return 'trophy';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'feed':
        return (
          <FlatList
            ref={flatListRef}
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        );
      case 'challenges':
        return (
          <FlatList
            data={challenges}
            renderItem={renderChallenge}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 'leaderboard':
        return (
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Composer */}
      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.composerTitle}>Share what’s new</Text>
          <View style={styles.composerInput}>
            <Text
              numberOfLines={2}
              style={styles.composerPlaceholder}
              onPress={() => { /* noop */ }}
            >
              {composerText || 'Write a caption…'}
            </Text>
          </View>
          {!!composerMedia.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {composerMedia.map((m, i) => (
                <View key={`cm-${i}`} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={m.type?.startsWith('video') ? 'videocam' : 'image'} color={COLORS.text} size={18} />
                  {typeof m.progress === 'number' && m.progress > 0 && m.progress < 1 && (
                    <Text style={{ fontSize: 10, color: COLORS.gray }}>{Math.round(m.progress * 100)}%</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={pickComposerMedia} style={{ padding: 8 }}>
            <Ionicons name="images" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {creating ? (
              <Button title="Cancel" onPress={cancelUploads} />
            ) : null}
            <Button title={creating ? 'Posting…' : 'Post'} onPress={onCreatePost} disabled={creating || (!composerText && !composerMedia.length)} />
          </View>
        </View>
      </View>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons 
            name="home" 
            size={20} 
            color={activeTab === 'feed' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>

        {showChallenges && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
            onPress={() => setActiveTab('challenges')}
          >
            <Ionicons 
              name="trophy" 
              size={20} 
              color={activeTab === 'challenges' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>
              Challenges
            </Text>
          </TouchableOpacity>
        )}

        {showLeaderboard && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Ionicons 
              name="medal" 
              size={20} 
              color={activeTab === 'leaderboard' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        )}

        {showFriends && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'friends' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontFamily: FONTS.medium,
  },
  activeTabText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
  },
  listContainer: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginLeft: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  progressCard: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
    marginLeft: 8,
  },
  progressValue: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
    fontFamily: FONTS.medium,
  },
  challengeCard: {
    marginBottom: 16,
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  challengeStat: {
    alignItems: 'center',
  },
  joinButton: {
    marginTop: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.gray,
  },
  topRank: {
    color: COLORS.primary,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  leaderboardPoints: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  trophyContainer: {
    marginLeft: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  friendStatus: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  friendAction: {
    padding: 4,
  },
  // Disabled state styles
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.background.primary,
  },
  disabledTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SocialFeed;

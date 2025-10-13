import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';
import { API_BASE_URL } from '../config/api';

export default function CoachProfileScreen({ route, navigation }) {
  const { coach } = route.params;
  const [coachDetails, setCoachDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchCoachDetails();
  }, []);

  const fetchCoachDetails = async () => {
    try {
      // Prefer server data when id is available
      if (coach?.id) {
        try {
          const res = await api.getCoach(coach.id);
          const payload = res?.data?.coach || res?.data || res;
          const normalized = {
            ...coach,
            ...payload,
            avatar: payload?.avatar || payload?.profilePicture || payload?.user?.profilePicture || coach?.avatar,
            name: coach?.name || [payload?.user?.firstName, payload?.user?.lastName].filter(Boolean).join(' '),
            specialty: coach?.specialty || (Array.isArray(payload?.niches) ? payload.niches.slice(0,2).join(' • ') : undefined),
          };
          setCoachDetails(buildCoachDefaults(normalized));
          setLoading(false);
          return;
        } catch (e) {
          // fall through to passed coach object
        }
      }
      setCoachDetails(buildCoachDefaults(coach));
    } catch (error) {
      console.error('Failed to fetch coach details:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildCoachDefaults = (base = {}) => ({
    bio: "Professional fitness trainer with 8+ years of experience. Specializing in strength training, HIIT workouts, and body transformation programs.",
    certifications: ["NASM-CPT", "ACSM Certified", "Precision Nutrition L1"],
    experience: base.experience || "8+ years",
    clientsTransformed: base.clientsTransformed || "500+",
    programs: base.programs || [
      { id: 1, title: "Strength Builder Pro", description: "Complete strength training program for muscle building", duration: "12 weeks", level: "Intermediate", price: "$49.99", rating: 4.8, students: 1200 },
      { id: 2, title: "HIIT Fat Burner", description: "High-intensity interval training for rapid fat loss", duration: "8 weeks", level: "Advanced", price: "$39.99", rating: 4.9, students: 850 },
      { id: 3, title: "Beginner's Journey", description: "Perfect starting point for fitness newcomers", duration: "6 weeks", level: "Beginner", price: "$29.99", rating: 4.7, students: 2100 },
    ],
    stats: base.stats || { totalStudents: 4150, averageRating: 4.8, totalPrograms: 12, yearsExperience: 8 },
    ...base,
  });

  const handleFollow = async () => {
    try {
      if (following) {
        await api.unfollowCoach(coach.id);
        setFollowing(false);
      } else {
        await api.followCoach(coach.id);
        setFollowing(true);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const handleProgramSelect = (program) => {
    // Navigate to program detail or show purchase options
    console.log('Selected program:', program.title);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading coach profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Profile</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Coach Info Section */}
        <LinearGradient
          colors={[COLORS.background.secondary, COLORS.background.primary]}
          style={styles.profileSection}
        >
          <Image resizeMode="cover" source={{ uri: (() => {
            try {
              const server = (API_BASE_URL || '').replace(/\/api$/, '');
              const primary = coachDetails?.avatar || coachDetails?.profilePicture;
              if (primary) return primary;
              // Deterministic fallback across 3 seeded images if no avatar present
              const buckets = ['coach1.jpg','coach2.jpg','coach3.jpg'];
              const idx = Math.abs(String(coachDetails?.name || '').length) % buckets.length;
              const seeded = `${server}/uploads/seed/${buckets[idx]}`;
              return seeded;
            } catch {
              return coachDetails?.avatar || coachDetails?.profilePicture || 'https://via.placeholder.com/120';
            }
          })() }} style={styles.coachAvatar} />
          <Text style={styles.coachName}>{coachDetails.name}</Text>
          <Text style={styles.coachSpecialty}>{coachDetails.specialty}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coachDetails.stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coachDetails.stats.averageRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coachDetails.stats.totalPrograms}</Text>
              <Text style={styles.statLabel}>Programs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coachDetails.stats.yearsExperience}</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.followButton, following && styles.followingButton]}
              onPress={handleFollow}
            >
              <Ionicons 
                name={following ? "checkmark" : "add"} 
                size={20} 
                color={following ? COLORS.accent.success : COLORS.background.primary} 
              />
              <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.text.primary} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{coachDetails.bio}</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{coachDetails.experience}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Clients Helped</Text>
              <Text style={styles.detailValue}>{coachDetails.clientsTransformed}</Text>
            </View>
          </View>

          <View style={styles.certificationsContainer}>
            <Text style={styles.certificationsTitle}>Certifications</Text>
            <View style={styles.certificationsList}>
              {coachDetails.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationBadge}>
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Programs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programs</Text>
          {coachDetails.programs.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => handleProgramSelect(program)}
            >
              <View style={styles.programInfo}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programDescription}>{program.description}</Text>
                
                <View style={styles.programMeta}>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.programMetaText}>{program.duration}</Text>
                  </View>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="bar-chart-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.programMetaText}>{program.level}</Text>
                  </View>
                  <View style={styles.programMetaItem}>
                    <Ionicons name="people-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.programMetaText}>{program.students} students</Text>
                  </View>
                </View>
                
                <View style={styles.programFooter}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={COLORS.accent.warning} />
                    <Text style={styles.ratingText}>{program.rating}</Text>
                  </View>
                  <Text style={styles.programPrice}>{program.price}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.lg,
  },
  coachAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: SIZES.spacing.md,
    borderWidth: 4,
    borderColor: COLORS.accent.primary,
  },
  coachName: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  coachSpecialty: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SIZES.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  statLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.round,
    gap: SIZES.spacing.sm,
  },
  followingButton: {
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.accent.success,
  },
  followButtonText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  followingButtonText: {
    color: COLORS.accent.success,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.round,
    gap: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  messageButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  section: {
    padding: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
  },
  bioText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
  },
  detailItem: {
    flex: 1,
    marginRight: SIZES.spacing.md,
  },
  detailLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginBottom: SIZES.spacing.xs,
  },
  detailValue: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  certificationsContainer: {
    marginBottom: SIZES.spacing.md,
  },
  certificationsTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.sm,
  },
  certificationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
  },
  certificationBadge: {
    backgroundColor: COLORS.accent.primary + '20',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.round,
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40',
  },
  certificationText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.primary,
    fontWeight: FONTS.weight.medium,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.md,
    ...SHADOWS.small,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  programDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
    lineHeight: 18,
  },
  programMeta: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  programMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  programMetaText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  ratingText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weight.medium,
  },
  programPrice: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  bottomPadding: {
    height: 80,
  },
});

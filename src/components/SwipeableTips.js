import { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SIZES.spacing.lg * 2;

const SwipeableTips = ({ tips = [], onTipPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
  };

  if (tips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {tips.map((tip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tipCard}
            onPress={() => onTipPress?.(tip)}
            activeOpacity={0.7}
          >
            <View style={styles.tipHeader}>
              <Ionicons 
                name={tip.icon || 'bulb-outline'} 
                size={24} 
                color={tip.color || COLORS.accent.quaternary} 
              />
              <Text style={styles.tipType}>{tip.type || 'Tip'}</Text>
            </View>
            <Text style={styles.tipTitle} numberOfLines={2}>
              {tip.title}
            </Text>
            <Text style={styles.tipContent} numberOfLines={3}>
              {tip.content}
            </Text>
            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>Tap to read more</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.accent.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {tips.length > 1 && (
        <View style={styles.pagination}>
          {tips.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    paddingRight: SIZES.spacing.lg * 2,
  },
  tipCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginRight: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  tipType: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  tipContent: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    marginBottom: SIZES.spacing.md,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  readMoreText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
    gap: SIZES.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border.secondary,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.accent.primary,
  },
});

export default SwipeableTips;


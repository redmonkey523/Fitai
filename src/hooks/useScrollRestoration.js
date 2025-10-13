import { useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook for restoring scroll position when returning to a screen
 * Usage:
 * const { scrollViewRef, onScroll, restoreScroll } = useScrollRestoration();
 * <ScrollView ref={scrollViewRef} onScroll={onScroll}>
 */
export function useScrollRestoration() {
  const scrollViewRef = useRef(null);
  const scrollPosition = useRef(0);

  const onScroll = useCallback((event) => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  }, []);

  const restoreScroll = useCallback(() => {
    if (scrollViewRef.current && scrollPosition.current > 0) {
      // Use timeout to ensure content is rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollPosition.current,
          animated: false,
        });
      }, 100);
    }
  }, []);

  // Restore scroll on focus
  useFocusEffect(restoreScroll);

  return {
    scrollViewRef,
    onScroll,
    restoreScroll,
    scrollPosition: scrollPosition.current,
  };
}

/**
 * Hook for FlatList scroll restoration
 */
export function useFlatListScrollRestoration() {
  const flatListRef = useRef(null);
  const scrollOffset = useRef(0);
  const viewableItems = useRef([]);

  const onScroll = useCallback((event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems: items }) => {
    if (items.length > 0) {
      viewableItems.current = items.map(item => item.key);
    }
  }, []);

  const restoreScroll = useCallback(() => {
    if (flatListRef.current && viewableItems.current.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: scrollOffset.current,
          animated: false,
        });
      }, 100);
    }
  }, []);

  useFocusEffect(restoreScroll);

  return {
    flatListRef,
    onScroll,
    onViewableItemsChanged,
    restoreScroll,
    scrollOffset: scrollOffset.current,
  };
}


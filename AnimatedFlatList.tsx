import React, {useCallback, memo} from 'react';
import {
  Animated,
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ViewToken,
} from 'react-native';

interface AnimatedFlatListProps extends FlatListProps<any> {
  scrollY: Animated.Value;
  onMomentumScrollBegin?: () => void;
  onMomentumScrollEnd?: () => void;
  onScrollEndDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  listRef?: (ref: FlatList<any>) => void;
}

const AnimatedFlatList = memo(
  ({
    scrollY,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScrollEndDrag,
    listRef,
    onScroll: propsOnScroll,
    renderItem: propsRenderItem,
    ...rest
  }: AnimatedFlatListProps) => {
    const onScroll = Animated.event(
      [{nativeEvent: {contentOffset: {y: scrollY}}}],
      {
        useNativeDriver: true,
        listener: propsOnScroll,
      },
    );

    const onViewableItemsChanged = useCallback(
      ({viewableItems}: {viewableItems: ViewToken[]}) => {
        viewableItems.forEach(item => {
          if (item.item?.preload) {
            item.item.preload();
          }
        });
      },
      [],
    );

    const viewabilityConfig = {
      viewAreaCoveragePercentThreshold: 10,
      minimumViewTime: 100,
    };

    const renderItem = useCallback(
      props => {
        return propsRenderItem?.(props);
      },
      [propsRenderItem],
    );

    const getItemLayout = useCallback(
      (data: any, index: number) => ({
        length: data[index]?.height || 0,
        offset: data[index]?.offset || 0,
        index,
      }),
      [],
    );

    return (
      <Animated.FlatList
        {...rest}
        ref={listRef}
        onScroll={onScroll}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
      />
    );
  },
);

AnimatedFlatList.displayName = 'AnimatedFlatList';

export default AnimatedFlatList;

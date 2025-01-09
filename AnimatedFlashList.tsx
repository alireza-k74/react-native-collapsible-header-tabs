import React, {useCallback, memo, useRef} from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ViewToken,
  View,
  StyleSheet,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList);

interface AnimatedFlashListProps {
  scrollY: Animated.Value;
  onMomentumScrollBegin?: () => void;
  onMomentumScrollEnd?: () => void;
  onScrollEndDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  listRef?: (ref: FlashList<any>) => void;
  data: any[];
  renderItem: (info: {item: any; index: number}) => React.ReactElement;
  keyExtractor?: (item: any, index: number) => string;
  estimatedItemSize: number;
  numColumns?: number;
  contentContainerStyle?: any;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

const AnimatedFlashList = memo(
  ({
    scrollY,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScrollEndDrag,
    listRef,
    data,
    renderItem: propsRenderItem,
    keyExtractor,
    estimatedItemSize,
    numColumns = 1,
    contentContainerStyle,
    onRefresh,
    refreshing,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    onEndReached,
    onEndReachedThreshold = 0.2,
  }: AnimatedFlashListProps) => {
    const flashListRef = useRef<FlashList<any>>(null);

    const onScroll = Animated.event(
      [{nativeEvent: {contentOffset: {y: scrollY}}}],
      {useNativeDriver: true},
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
        return propsRenderItem(props);
      },
      [propsRenderItem],
    );

    const getRef = useCallback(
      (ref: FlashList<any>) => {
        flashListRef.current = ref;
        if (listRef) {
          listRef(ref);
        }
      },
      [listRef],
    );

    return (
      <AnimatedFlashListComponent
        ref={getRef}
        data={data}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={contentContainerStyle}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        overrideItemLayout={(layout, item) => {
          if (item.height && item.offset !== undefined) {
            layout.size = item.height;
            layout.offset = item.offset;
          }
        }}
        drawDistance={Platform.select({
          ios: 500,
          android: 1000,
        })}
      />
    );
  },
);

AnimatedFlashList.displayName = 'AnimatedFlashList';

export default AnimatedFlashList;

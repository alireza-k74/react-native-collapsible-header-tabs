import React, {useCallback, memo, useRef, useMemo} from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import {RecyclerListView, DataProvider, LayoutProvider} from 'recyclerlistview';

const {width: WINDOW_WIDTH} = Dimensions.get('window');

interface AnimatedRecyclerListViewProps {
  scrollY: Animated.Value;
  onMomentumScrollBegin?: () => void;
  onMomentumScrollEnd?: () => void;
  onScrollEndDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  listRef?: (ref: RecyclerListView) => void;
  data: any[];
  renderItem: (
    type: string | number,
    item: any,
    index: number,
  ) => React.ReactElement;
  numColumns?: number;
  contentContainerStyle?: any;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  itemHeight: number;
  gridItemWidth?: number;
  extendedState?: any;
}

const AnimatedRecyclerListView = memo(
  ({
    scrollY,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScrollEndDrag,
    listRef,
    data,
    renderItem,
    numColumns = 1,
    contentContainerStyle,
    onRefresh,
    refreshing,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    onEndReached,
    onEndReachedThreshold = 20,
    itemHeight,
    gridItemWidth,
    extendedState,
  }: AnimatedRecyclerListViewProps) => {
    const recyclerRef = useRef<RecyclerListView>(null);
    const isGrid = numColumns > 1;

    // Create data provider
    const dataProvider = useMemo(() => {
      return new DataProvider((r1, r2) => {
        return r1.id !== r2.id;
      }).cloneWithRows(data);
    }, [data]);

    // Create layout provider
    const layoutProvider = useMemo(() => {
      return new LayoutProvider(
        () => 0,
        (type, dim) => {
          if (isGrid) {
            const calculatedWidth =
              gridItemWidth ||
              (WINDOW_WIDTH - (numColumns + 1) * 10) / numColumns;
            dim.width = calculatedWidth;
            dim.height = itemHeight;
          } else {
            dim.width = WINDOW_WIDTH;
            dim.height = itemHeight;
          }
        },
      );
    }, [isGrid, numColumns, itemHeight, gridItemWidth]);

    const onScroll = Animated.event(
      [{nativeEvent: {contentOffset: {y: scrollY}}}],
      {useNativeDriver: true},
    );

    const getRef = useCallback(
      (ref: RecyclerListView) => {
        recyclerRef.current = ref;
        if (listRef) {
          listRef(ref);
        }
      },
      [listRef],
    );

    const rowRenderer = useCallback(
      (type: string | number, item: any, index: number) => {
        return renderItem(type, item, index);
      },
      [renderItem],
    );

    const renderFooter = useCallback(() => {
      return (
        <>
          {ListFooterComponent}
          <View style={{height: 20}} />
        </>
      );
    }, [ListFooterComponent]);

    const renderHeader = useCallback(() => {
      return ListHeaderComponent || null;
    }, [ListHeaderComponent]);

    const renderEmpty = useCallback(() => {
      return ListEmptyComponent || null;
    }, [ListEmptyComponent]);

    const handleEndReached = useCallback(() => {
      if (onEndReached) {
        onEndReached();
      }
    }, [onEndReached]);

    if (data.length === 0 && ListEmptyComponent) {
      return renderEmpty();
    }

    const AnimatedRecycler = Animated.createAnimatedComponent(RecyclerListView);

    return (
      <AnimatedRecycler
        ref={getRef}
        layoutProvider={layoutProvider}
        dataProvider={dataProvider}
        rowRenderer={rowRenderer}
        onScroll={onScroll}
        scrollViewProps={{
          refreshing,
          onRefresh,
          onScrollEndDrag,
          onMomentumScrollBegin,
          onMomentumScrollEnd,
          scrollEventThrottle: 16,
          contentContainerStyle,
          showsVerticalScrollIndicator: false,
        }}
        renderFooter={renderFooter}
        renderHeader={renderHeader}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        extendedState={extendedState}
        forceNonDeterministicRendering={true}
        canChangeSize={true}
        initialRenderIndex={0}
        renderAheadOffset={Platform.select({
          ios: 500,
          android: 1000,
        })}
        isHorizontal={false}
      />
    );
  },
);

AnimatedRecyclerListView.displayName = 'AnimatedRecyclerListView';

export default AnimatedRecyclerListView;

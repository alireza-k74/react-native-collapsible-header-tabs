import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  StatusBar,
  ActivityIndicator,
  LayoutChangeEvent,
  FlatList,
} from 'react-native';
import {TabView, TabBar} from 'react-native-tab-view';
import {CollapsibleTabViewProps, TabRoute, ListRefs} from './types';
import AnimatedFlashList from './AnimatedFlashList';
import AnimatedRecyclerListView from './AnimatedRecyclerListView';

const AnimatedIndicator = Animated.createAnimatedComponent(ActivityIndicator);
const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;
const SafeStatusBar = Platform.select({
  ios: 44,
  android: StatusBar.currentHeight,
});

export {AnimatedFlashList, AnimatedRecyclerListView};

const CollapsibleTabView: React.FC<CollapsibleTabViewProps> = ({
  routes,
  renderScene,
  renderHeader,
  renderLoading,
  tabBarHeight = 48,
  initialTabIndex = 0,
  headerBackgroundColor = '#FFA088',
  tabBarBackgroundColor = '#FFCC80',
  indicatorColor = '#222',
  labelColor = '#222',
  style,
  onRefresh,
  pullToRefreshDistance = 150,
  onTabChange,
}) => {
  const [tabIndex, setIndex] = useState(initialTabIndex);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isHeaderMeasured, setIsHeaderMeasured] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScrollY = useRef(new Animated.Value(0)).current;
  const headerMoveScrollY = useRef(new Animated.Value(0)).current;
  const listRefArr = useRef<ListRefs[]>([]);
  const listOffset = useRef<{[key: string]: number}>({});
  const isListGliding = useRef(false);
  const headerScrollStart = useRef(0);
  const _tabIndex = useRef(0);
  const refreshStatusRef = useRef(false);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {height} = event.nativeEvent.layout;
      if (height !== headerHeight) {
        setHeaderHeight(height);
        setIsHeaderMeasured(true);
      }
    },
    [headerHeight],
  );

  const syncScrollOffset = useCallback(() => {
    const curRouteKey = routes[_tabIndex.current].key;

    listRefArr.current.forEach(item => {
      if (item.key !== curRouteKey) {
        if (scrollY._value < headerHeight && scrollY._value >= 0) {
          if (item.value) {
            item.value.scrollToOffset({
              offset: scrollY._value,
              animated: false,
            });
            listOffset.current[item.key] = scrollY._value;
          }
        } else if (scrollY._value >= headerHeight) {
          if (
            listOffset.current[item.key] < headerHeight ||
            listOffset.current[item.key] == null
          ) {
            if (item.value) {
              item.value.scrollToOffset({
                offset: headerHeight,
                animated: false,
              });
              listOffset.current[item.key] = headerHeight;
            }
          }
        }
      }
    });
  }, [headerHeight, routes, scrollY]);

  const startRefreshAction = useCallback(async () => {
    if (!onRefresh) return;

    refreshStatusRef.current = true;
    if (Platform.OS === 'ios') {
      listRefArr.current.forEach(listRef => {
        listRef.value?.scrollToOffset({
          offset: -50,
          animated: true,
        });
      });
    } else {
      Animated.timing(headerMoveScrollY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    try {
      await onRefresh();
    } finally {
      refreshStatusRef.current = false;
      if (Platform.OS === 'ios') {
        syncScrollOffset();
        if (scrollY._value < 0) {
          listRefArr.current.forEach(listRef => {
            listRef.value?.scrollToOffset({
              offset: 0,
              animated: true,
            });
          });
        }
      } else {
        Animated.timing(headerMoveScrollY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [headerMoveScrollY, onRefresh, scrollY, syncScrollOffset]);

  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onStartShouldSetPanResponder: () => {
        headerScrollY.stopAnimation();
        syncScrollOffset();
        return false;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        headerScrollY.stopAnimation();
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        headerScrollStart.current = scrollY._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const curListRef = listRefArr.current.find(
          ref => ref.key === routes[_tabIndex.current].key,
        );
        const headerScrollOffset = -gestureState.dy + headerScrollStart.current;

        if (curListRef?.value) {
          if (headerScrollOffset > 0) {
            curListRef.value.scrollToOffset({
              offset: headerScrollOffset,
              animated: false,
            });
          } else {
            if (Platform.OS === 'ios') {
              curListRef.value.scrollToOffset({
                offset: headerScrollOffset / 3,
                animated: false,
              });
            } else if (!refreshStatusRef.current) {
              headerMoveScrollY.setValue(headerScrollOffset / 1.5);
            }
          }
        }
      },
      onPanResponderEnd: (_, gestureState) => {
        syncScrollOffset();
        headerScrollY.setValue(scrollY._value);

        if (Platform.OS === 'ios') {
          if (scrollY._value < 0) {
            if (
              scrollY._value < -pullToRefreshDistance &&
              !refreshStatusRef.current
            ) {
              startRefreshAction();
            } else {
              listRefArr.current.forEach(listRef => {
                listRef.value?.scrollToOffset({
                  offset: 0,
                  animated: true,
                });
              });
            }
          } else if (Math.abs(gestureState.vy) >= 0.2) {
            Animated.decay(headerScrollY, {
              velocity: -gestureState.vy,
              useNativeDriver: true,
            }).start(() => {
              syncScrollOffset();
            });
          }
        } else {
          if (
            headerMoveScrollY._value < 0 &&
            headerMoveScrollY._value / 1.5 < -pullToRefreshDistance
          ) {
            startRefreshAction();
          } else {
            Animated.timing(headerMoveScrollY, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        }
      },
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  useEffect(() => {
    scrollY.addListener(({value}) => {
      const curRoute = routes[tabIndex].key;
      listOffset.current[curRoute] = value;
    });

    headerScrollY.addListener(({value}) => {
      listRefArr.current.forEach(item => {
        if (item.key !== routes[tabIndex].key) return;
        if (value > headerHeight || value < 0) {
          headerScrollY.stopAnimation();
          syncScrollOffset();
        }
        if (item.value && value <= headerHeight) {
          item.value.scrollToOffset({
            offset: value,
            animated: false,
          });
        }
      });
    });

    return () => {
      scrollY.removeAllListeners();
      headerScrollY.removeAllListeners();
    };
  }, [
    headerHeight,
    headerScrollY,
    listRefArr,
    routes,
    scrollY,
    tabIndex,
    syncScrollOffset,
  ]);

  const renderTabBar = (props: any) => {
    const y = scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [headerHeight, 0],
      extrapolateRight: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.tabBarContainer,
          {
            transform: [{translateY: y}],
            backgroundColor: tabBarBackgroundColor,
          },
        ]}>
        <TabBar
          {...props}
          onTabPress={({route, preventDefault}) => {
            if (isListGliding.current) {
              preventDefault();
            }
          }}
          style={[styles.tab, {height: tabBarHeight}]}
          renderLabel={({route, focused}) => (
            <Text
              style={[
                styles.label,
                {
                  opacity: focused ? 1 : 0.5,
                  color: labelColor,
                },
              ]}>
              {route.title}
            </Text>
          )}
          indicatorStyle={[styles.indicator, {backgroundColor: indicatorColor}]}
        />
      </Animated.View>
    );
  };

  const renderCustomRefresh = () => {
    return Platform.select({
      ios: (
        <AnimatedIndicator
          style={[
            styles.refreshIndicator,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [120, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
          animating
        />
      ),
      android: (
        <Animated.View
          style={[
            styles.androidRefreshIndicator,
            {
              transform: [
                {
                  translateY: headerMoveScrollY.interpolate({
                    inputRange: [-300, 0],
                    outputRange: [150, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}>
          <ActivityIndicator animating />
        </Animated.View>
      ),
    });
  };

  const renderHeaderComponent = () => {
    const y = scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [0, -headerHeight],
      extrapolateRight: 'clamp',
    });

    return (
      <Animated.View
        onLayout={onHeaderLayout}
        {...headerPanResponder.panHandlers}
        style={[
          styles.header,
          {
            backgroundColor: headerBackgroundColor,
            transform: [{translateY: y}],
          },
        ]}>
        {renderHeader?.({route: routes[tabIndex]})}
      </Animated.View>
    );
  };

  const renderLoadingComponent = () => {
    if (renderLoading) {
      return renderLoading();
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={headerBackgroundColor} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderHeaderComponent()}
      {isHeaderMeasured ? (
        <TabView
          onIndexChange={index => {
            _tabIndex.current = index;
            setIndex(index);
            onTabChange?.(index);
          }}
          navigationState={{index: tabIndex, routes}}
          renderScene={({route}) => {
            const focused = route.key === routes[tabIndex].key;

            return renderScene({
              route,
              focused,
              scrollY,
              headerHeight,
              tabBarHeight,
              pullToRefreshDistance,
              onMomentumScrollBegin: () => {
                isListGliding.current = true;
              },
              onMomentumScrollEnd: () => {
                isListGliding.current = false;
                syncScrollOffset();
              },
              onScrollEndDrag: e => {
                syncScrollOffset();
                const offsetY = e.nativeEvent.contentOffset.y;
                if (Platform.OS === 'ios') {
                  if (
                    offsetY < -pullToRefreshDistance &&
                    !refreshStatusRef.current
                  ) {
                    startRefreshAction();
                  }
                }
              },
              listRef: ref => {
                if (ref) {
                  const found = listRefArr.current.find(
                    e => e.key === route.key,
                  );
                  if (!found) {
                    listRefArr.current.push({
                      key: route.key,
                      value: ref,
                    });
                  }
                }
              },
            });
          }}
          renderTabBar={renderTabBar}
          initialLayout={{
            height: 0,
            width: windowWidth,
          }}
        />
      ) : (
        renderLoadingComponent()
      )}
      {onRefresh && renderCustomRefresh()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  tabBarContainer: {
    top: 0,
    zIndex: 1,
    position: 'absolute',
    width: '100%',
  },
  tab: {
    elevation: 0,
    shadowOpacity: 0,
  },
  indicator: {
    height: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIndicator: {
    top: -50,
    position: 'absolute',
    alignSelf: 'center',
  },
  androidRefreshIndicator: {
    backgroundColor: '#eee',
    height: 38,
    width: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    top: -50,
    position: 'absolute',
  },
});

export default CollapsibleTabView;

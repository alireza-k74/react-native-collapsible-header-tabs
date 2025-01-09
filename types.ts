import {ReactNode} from 'react';
import {StyleProp, ViewStyle, Animated} from 'react-native';
import {Route, NavigationState} from 'react-native-tab-view';

export interface TabRoute extends Route {
  title: string;
}

export interface SceneProps {
  route: TabRoute;
  focused: boolean;
  scrollY: Animated.Value;
  tabBarHeight: number;
  pullToRefreshDistance: number;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: () => void;
  onScrollEndDrag: (e: any) => void;
  listRef: (ref: any) => void;
}

export interface CollapsibleTabViewProps {
  routes: TabRoute[];
  renderScene: (props: SceneProps) => ReactNode;
  renderHeader?: (props: {route: TabRoute}) => ReactNode;
  renderLoading?: () => ReactNode;
  tabBarHeight?: number;
  initialTabIndex?: number;
  headerBackgroundColor?: string;
  tabBarBackgroundColor?: string;
  indicatorColor?: string;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
  onRefresh?: () => Promise<void>;
  pullToRefreshDistance?: number;
  onTabChange?: (index: number) => void;
}

export interface TabBarProps {
  navigationState: NavigationState<TabRoute>;
  position: number;
  onTabPress: (index: number) => void;
  tabBarHeight: number;
  backgroundColor: string;
  indicatorColor: string;
  labelColor: string;
}

export interface ListRefs {
  key: string;
  value: any;
}

# React Native Collapsible Header Tabs

A high-performance, feature-rich tab view component for React Native with collapsible header and multiple list implementations.

[![npm version](https://badge.fury.io/js/react-native-collapsible-header-tabs.svg)](https://badge.fury.io/js/react-native-collapsible-header-tabs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Three high-performance list implementations:
  - FlatList for simple lists
  - FlashList for optimized grid layouts
  - RecyclerListView for maximum performance
- 📱 Smooth collapsible header animations
- 🎨 Customizable tab bar and header
- ♻️ Pull-to-refresh support
- 🔄 Infinite scrolling
- 🎯 TypeScript support
- 📦 Zero dependencies (except peer dependencies)

## Installation

```bash
npm install react-native-collapsible-header-tabs

# or using yarn
yarn add react-native-collapsible-header-tabs
```

### Peer Dependencies

```bash
npm install react-native-tab-view @shopify/flash-list recyclerlistview
```

## Usage

```tsx
import CollapsibleTabView, {
  AnimatedFlatList,
  AnimatedFlashList,
  AnimatedRecyclerListView,
} from "react-native-collapsible-header-tabs";

const Example = () => {
  const routes = [
    { key: "flatlist", title: "FlatList" },
    { key: "flashlist", title: "FlashList" },
    { key: "recycler", title: "RecyclerView" },
  ];

  const renderScene = ({ route, scrollY, headerHeight, tabBarHeight }) => {
    // Choose your preferred list implementation
    return (
      <AnimatedFlatList
        data={data}
        renderItem={renderItem}
        scrollY={scrollY}
        contentContainerStyle={{
          paddingTop: headerHeight + tabBarHeight,
        }}
      />
    );
  };

  return (
    <CollapsibleTabView
      routes={routes}
      renderScene={renderScene}
      renderHeader={renderHeader}
      tabBarHeight={48}
    />
  );
};
```

## Props

### CollapsibleTabView Props

| Prop                  | Type      | Required | Description                               |
| --------------------- | --------- | -------- | ----------------------------------------- |
| routes                | Array     | Yes      | Array of route objects with key and title |
| renderScene           | Function  | Yes      | Render callback for tab content           |
| renderHeader          | Function  | Yes      | Render callback for header content        |
| tabBarHeight          | Number    | No       | Height of the tab bar (default: 48)       |
| headerBackgroundColor | String    | No       | Header background color                   |
| tabBarBackgroundColor | String    | No       | Tab bar background color                  |
| indicatorColor        | String    | No       | Tab indicator color                       |
| labelColor            | String    | No       | Tab label color                           |
| onRefresh             | Function  | No       | Pull-to-refresh callback                  |
| style                 | ViewStyle | No       | Container style                           |

### List Component Props

Each list component (AnimatedFlatList, AnimatedFlashList, AnimatedRecyclerListView) accepts its own set of props. Refer to the TypeScript definitions for complete prop types.

## Performance Tips

1. **Use Memoization**

   ```tsx
   const renderItem = useCallback(({ item }) => <Item item={item} />, []);
   ```

2. **Choose the Right List Implementation**

   - FlatList: Simple lists with < 100 items
   - FlashList: Grid layouts or lists with 100-1000 items
   - RecyclerListView: Lists with > 1000 items

3. **Optimize Images**

   - Use proper image dimensions
   - Implement progressive loading
   - Use image caching

4. **Implement Pagination**
   - Load items in chunks
   - Use infinite scrolling
   - Implement proper loading states

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

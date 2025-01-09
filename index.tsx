import React, {useState, useCallback, memo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import CollapsibleTabView from './CollapsibleTabView';
import AnimatedFlatList from './AnimatedFlatList';
import AnimatedFlashList from './AnimatedFlashList';
import AnimatedRecyclerListView from './AnimatedRecyclerListView';

const windowWidth = Dimensions.get('window').width;
const GRID_COLUMNS = 2;
const GRID_SPACING = 10;
const GRID_ITEM_WIDTH =
  (windowWidth - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;
const ITEM_HEIGHT = 300;

// Generate a large dataset
const generateItems = (count: number, type: string) => {
  return Array.from({length: count}, (_, index) => ({
    id: `${type}_${index}`,
    title: `${type} Item ${index}`,
    description: `Description for ${type} item ${index} with some extra text to make it longer and test performance with longer text strings that might impact rendering performance`,
    imageUrl: `https://picsum.photos/seed/${type}_${index}/400/300`,
    type,
    height: ITEM_HEIGHT,
    offset: index * ITEM_HEIGHT,
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
    author: {
      name: `Author ${index}`,
      avatar: `https://i.pravatar.cc/150?img=${index % 70}`,
    },
    tags: Array.from({length: 5}, (_, i) => `Tag ${i}`),
  }));
};

// Memoized item components for better performance
const GridItem = memo(({item, onPress}: any) => (
  <TouchableOpacity
    style={styles.gridItem}
    activeOpacity={0.8}
    onPress={() => onPress(item)}>
    <Image
      source={{uri: item.imageUrl}}
      style={styles.gridImage}
      loading="lazy"
    />
    <View style={styles.gridContent}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.itemDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.itemFooter}>
        <Image source={{uri: item.author.avatar}} style={styles.authorAvatar} />
        <Text style={styles.authorName} numberOfLines={1}>
          {item.author.name}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>❤️ {item.likes}</Text>
          <Text style={styles.statsText}>💬 {item.comments}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

const ListItem = memo(({item, onPress}: any) => (
  <TouchableOpacity
    style={styles.listItem}
    activeOpacity={0.8}
    onPress={() => onPress(item)}>
    <Image
      source={{uri: item.imageUrl}}
      style={styles.listImage}
      loading="lazy"
    />
    <View style={styles.listContent}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.itemDescription} numberOfLines={3}>
        {item.description}
      </Text>
      <View style={styles.tagsContainer}>
        {item.tags.map((tag: string, index: number) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.itemFooter}>
        <Image source={{uri: item.author.avatar}} style={styles.authorAvatar} />
        <Text style={styles.authorName} numberOfLines={1}>
          {item.author.name}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>❤️ {item.likes}</Text>
          <Text style={styles.statsText}>💬 {item.comments}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

GridItem.displayName = 'GridItem';
ListItem.displayName = 'ListItem';

const Example = () => {
  const [flatListItems] = useState(() => generateItems(1000, 'flatlist'));
  const [flashListItems] = useState(() => generateItems(1000, 'flashlist'));
  const [recyclerItems] = useState(() => generateItems(1000, 'recycler'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const routes = [
    {key: 'flatlist', title: 'FlatList'},
    {key: 'flashlist', title: 'FlashList'},
    {key: 'recycler', title: 'RecyclerView'},
  ];

  const handleItemPress = useCallback((item: any) => {
    Alert.alert(item.title, item.description);
  }, []);

  // FlatList renderers
  const renderFlatListItem = useCallback(
    ({item}: any) => <ListItem item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  // FlashList renderers
  const renderFlashListItem = useCallback(
    ({item}: any) => <GridItem item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  // RecyclerListView renderers
  const renderRecyclerItem = useCallback(
    (type: string | number, item: any) => (
      <ListItem item={item} onPress={handleItemPress} />
    ),
    [handleItemPress],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  }, []);

  const renderHeader = useCallback(
    ({route}) => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{route.title} Example</Text>
        <Text style={styles.headerSubtitle}>
          1000 items with {route.key === 'flashlist' ? 'grid' : 'list'} layout
        </Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1000</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>500K</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>100K</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>
    ),
    [],
  );

  const renderLoading = useCallback(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading Gallery...</Text>
      </View>
    ),
    [],
  );

  const renderScene = useCallback(
    ({route, scrollY, headerHeight, tabBarHeight, ...rest}) => {
      const contentContainerStyle = [
        styles.listContent,
        {
          paddingTop: headerHeight + tabBarHeight,
          paddingBottom: 20,
        },
      ];

      switch (route.key) {
        case 'flatlist':
          return (
            <AnimatedFlatList
              data={flatListItems}
              renderItem={renderFlatListItem}
              scrollY={scrollY}
              keyExtractor={item => item.id}
              contentContainerStyle={contentContainerStyle}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              {...rest}
            />
          );

        case 'flashlist':
          return (
            <AnimatedFlashList
              data={flashListItems}
              renderItem={renderFlashListItem}
              scrollY={scrollY}
              keyExtractor={item => item.id}
              estimatedItemSize={ITEM_HEIGHT}
              numColumns={GRID_COLUMNS}
              contentContainerStyle={contentContainerStyle}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              onEndReached={() => console.log('FlashList end reached')}
              onEndReachedThreshold={0.2}
              {...rest}
            />
          );

        case 'recycler':
          return (
            <AnimatedRecyclerListView
              data={recyclerItems}
              renderItem={renderRecyclerItem}
              scrollY={scrollY}
              itemHeight={ITEM_HEIGHT}
              contentContainerStyle={contentContainerStyle}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              onEndReached={() => console.log('RecyclerView end reached')}
              onEndReachedThreshold={20}
              extendedState={{
                headerHeight,
                tabBarHeight,
              }}
              {...rest}
            />
          );

        default:
          return null;
      }
    },
    [
      flatListItems,
      flashListItems,
      recyclerItems,
      renderFlatListItem,
      renderFlashListItem,
      renderRecyclerItem,
      isRefreshing,
      handleRefresh,
    ],
  );

  return (
    <CollapsibleTabView
      routes={routes}
      renderScene={renderScene}
      renderHeader={renderHeader}
      renderLoading={renderLoading}
      tabBarHeight={48}
      headerBackgroundColor="#1e88e5"
      tabBarBackgroundColor="#90caf9"
      indicatorColor="#fff"
      labelColor="#fff"
      onRefresh={handleRefresh}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#fff',
    opacity: 0.2,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  gridItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItem: {
    marginVertical: 5,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  listImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  gridContent: {
    padding: 12,
  },
  listContent: {
    padding: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default Example;

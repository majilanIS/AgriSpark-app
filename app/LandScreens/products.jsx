import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchMarketplaceProducts } from "../../src/buyer/buyerService";

const categories = ["All", "Vegetables", "Fruits", "Grains", "Legumes"];

export default function PublicProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      const { products: rows } = await fetchMarketplaceProducts({
        limit: 24,
        offset: 0,
        search: searchQuery,
        category: activeCategory,
      });
      setProducts(rows);
    } catch (loadError) {
      setError(loadError?.message || "Could not load products right now.");
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const organicCount = products.filter((item) => item.is_organic).length;
    const bulkCount = products.filter((item) => item.is_bulk).length;

    return [
      { label: "Live listings", value: products.length },
      { label: "Organic", value: organicCount },
      { label: "Bulk", value: bulkCount },
    ];
  }, [products]);

  const applySearch = useCallback(() => {
    setSearchQuery(draftQuery.trim());
  }, [draftQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
  }, [loadProducts]);

  const renderProduct = ({ item }) => {
    return (
      <View style={styles.card}>
        <Image
          source={{
            uri: item.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
          }}
          style={styles.image}
        />

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.price}>{item.price_label || "ETB 0"}</Text>
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {item.location || item.farmer_location || "Local Farm"}
          </Text>

          <View style={styles.detailsRow}>
            <Text style={styles.farmerName} numberOfLines={1}>
              {item.farmer_name || "Verified Farmer"}
            </Text>

            <View style={styles.listingChip}>
              <Ionicons name="eye-outline" size={13} color="#1E7A35" />
              <Text style={styles.listingChipText}>Listing only</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const emptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#1E7A35" />
          <Text style={styles.stateTitle}>Loading products...</Text>
          <Text style={styles.stateCopy}>Pulling the latest marketplace listings.</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={30} color="#FF7A74" />
          <Text style={styles.stateTitle}>Could not load products</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons name="storefront-outline" size={30} color="#7B8B80" />
        <Text style={styles.stateTitle}>No products yet</Text>
        <Text style={styles.stateCopy}>There are no live marketplace listings right now.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        numColumns={1}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.topShell}>
            <View style={styles.heroCard}>
              <Text style={styles.heroMiniTitle}>AGRISPARK MARKETPLACE</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#7A8E81" />
                <TextInput
                  value={draftQuery}
                  onChangeText={setDraftQuery}
                  onSubmitEditing={applySearch}
                  placeholder="Search products, farms, category..."
                  placeholderTextColor="#7A8E81"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                <Pressable accessibilityRole="button" onPress={applySearch} style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>Go</Text>
                </Pressable>
              </View>

              {/* <View style={styles.statsRow}>
                {stats.map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View> */}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll} style={{ marginTop: 18 }}>
                {categories.map((category) => {
                  const active = category === activeCategory;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => setActiveCategory(category)}
                      style={({ pressed }) => [styles.categoryPill, active && styles.categoryPillActive, pressed && styles.categoryPillPressed]}
                    >
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={emptyComponent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E7A35" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FBF4",
  },
  glow1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(45,224,131,0.08)",
    top: -80,
    right: -60,
  },
  glow2: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 170,
    backgroundColor: "rgba(255,184,77,0.04)",
    bottom: 120,
    left: -50,
  },
  topShell: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  heroCard: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroMiniTitle: {
    color: "#1E7A35",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 25,
  },
  heroTitle: {
    color: "#15351F",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 14,
  },
  heroCopy: {
    color: "#5F7668",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  searchBar: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#F1F8EE",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  searchInput: {
    flex: 1,
    color: "#15351F",
    fontSize: 13,
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#1E7A35",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#F1F8EE",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  statValue: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: "#5F7668",
    fontSize: 11,
    marginTop: 5,
    fontWeight: "600",
  },
  categoryScroll: {
    gap: 10,
    paddingRight: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  categoryPillActive: {
    backgroundColor: "#D8F7E5",
    borderColor: "#D8F7E5",
  },
  categoryPillPressed: {
    opacity: 0.9,
  },
  categoryText: {
    color: "#5F7668",
    fontSize: 12,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: "#0A1711",
  },
  content: {
    paddingBottom: 120,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 220,
  },
  body: {
    padding: 14,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  name: {
    flex: 1,
    color: "#15351F",
    fontSize: 17,
    fontWeight: "900",
  },
  price: {
    color: "#1E7A35",
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: "#6A7E71",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  detailsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  farmerName: {
    flex: 1,
    color: "#15351F",
    fontSize: 13,
    fontWeight: "800",
  },
  listingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EEF7EA",
    borderWidth: 1,
    borderColor: "#D9E7D4",
  },
  listingChipText: {
    color: "#1E7A35",
    fontSize: 11,
    fontWeight: "800",
  },
  stateCard: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  stateTitle: {
    color: "#15351F",
    fontSize: 16,
    fontWeight: "800",
  },
  stateCopy: {
    color: "#66796F",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1E7A35",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

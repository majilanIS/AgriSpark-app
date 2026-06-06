import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";
import SearchBar from "../../src/buyer/components/SearchBar";
import CategoryTabs from "../../src/buyer/components/CategoryTabs";
import ProductCard from "../../src/buyer/components/ProductCard";
import MarketplaceHeaderBanner from "../../src/buyer/components/MarketplaceHeaderBanner";
import {
  fetchBuyerProfile,
  fetchMarketplaceProducts,
  upsertCartItem,
} from "../../src/buyer/buyerService";

const categories = ["All", "Vegetables", "Fruits", "Grains", "Legumes"];
const pageSize = 8;

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

export default function BuyerHomeScreen() {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("Buyer");
  const [draftQuery, setDraftQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const profileLoadInFlightRef = useRef(false);
  const productsLoadInFlightRef = useRef(false);

  const loadBuyerProfile = useCallback(async () => {
    if (profileLoadInFlightRef.current) return;

    try {
      profileLoadInFlightRef.current = true;
      const profile = await fetchBuyerProfile();
      setBuyerName(profile?.name || "Buyer");
    } catch {
      setBuyerName("Buyer");
    } finally {
      profileLoadInFlightRef.current = false;
    }
  }, []);

  const loadProducts = useCallback(
    async ({ reset = false, nextPage = 0 } = {}) => {
      const shouldReset = reset || nextPage === 0;

      if (productsLoadInFlightRef.current && shouldReset) {
        return;
      }

      try {
        productsLoadInFlightRef.current = true;
        if (shouldReset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError("");

        const { products: rows } = await fetchMarketplaceProducts({
          search: searchQuery,
          category: activeCategory,
          limit: pageSize,
          offset: nextPage * pageSize,
        });

        setProducts((current) => (shouldReset ? rows : [...current, ...rows]));
        setPage(nextPage);
        setHasMore(rows.length === pageSize);
      } catch (loadError) {
        setError(loadError?.message || "Could not load products right now.");
        if (shouldReset) {
          setProducts([]);
          setHasMore(false);
        }
      } finally {
        productsLoadInFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, searchQuery]
  );

  useFocusEffect(
    useCallback(() => {
      loadBuyerProfile();
    }, [loadBuyerProfile])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts({ reset: true, nextPage: 0 });
    }, 30000);

    return () => clearInterval(interval);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts({ reset: true, nextPage: 0 });
  }, [activeCategory, searchQuery, loadProducts]);

  const featuredSections = useMemo(() => {
    const newest = [...products].slice(0, 3);
    const bulk = products.filter((item) => item.is_bulk).slice(0, 3);
    const organic = products.filter((item) => item.is_organic).slice(0, 3);

    return { newest, bulk, organic };
  }, [products]);

  const applySearch = useCallback(() => {
    setSearchQuery(draftQuery.trim());
  }, [draftQuery]);

  const renderProduct = useCallback(
    ({ item }) => (
      <View style={styles.gridItem}>
        <ProductCard
          product={item}
          onPress={() => router.push({ pathname: "/buyer/product-details", params: { productId: String(item.id) } })}
          onAddToCart={async () => {
            try {
              await upsertCartItem({ productId: item.id, quantity: 1 });
              Alert.alert("Added to cart", `${item.name} was added to your cart.`);
            } catch (addError) {
              Alert.alert("Cart error", addError?.message || "Could not add this product right now.");
            }
          }}
        />
      </View>
    ),
    [router]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    loadProducts({ nextPage: page + 1 });
  }, [hasMore, loading, loadingMore, loadProducts, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts({ reset: true, nextPage: 0 });
  }, [loadProducts]);

  const listHeader = (
    <View style={styles.headerSection}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Good shopping,</Text>
          </View>

          <View style={styles.pill}>
            <Ionicons name="leaf-outline" size={14} color="#D8F7E5" />
            <Text style={styles.pillText}>Live market</Text>
          </View>
        </View>

        <Text style={styles.heroCopy}>Browse fresh farm products, compare prices, and add stock to your cart in one tap.</Text>
      </View>

      <SearchBar
        value={draftQuery}
        onChangeText={setDraftQuery}
        onSubmit={applySearch}
        placeholder="Search product name, category, or location"
      />

      <CategoryTabs categories={categories} value={activeCategory} onChange={setActiveCategory} />

      <View style={styles.sectionSpacer} />
      <Text style={styles.sectionTitle}>Featured market picks</Text>
      <MarketplaceHeaderBanner sections={featuredSections} onPressProduct={(item) => router.push({ pathname: "/buyer/product-details", params: { productId: String(item.id) } })} />

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Products</Text>
        <Text style={styles.sectionHint}>{products.length ? `${products.length} live listings` : "Updated from Supabase"}</Text>
      </View>
    </View>
  );

  const emptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Could not load products</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.stateButton} onPress={() => loadProducts({ reset: true, nextPage: 0 })}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="search-outline" size={28} color="#A5B0AB" />
          <Text style={styles.stateTitle}>No search results</Text>
          <Text style={styles.stateCopy}>No products matched “{searchQuery}”. Try another name, category, or location.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons name="storefront-outline" size={28} color="#A5B0AB" />
        <Text style={styles.stateTitle}>No products yet</Text>
        <Text style={styles.stateCopy}>There are no live product listings in the marketplace right now.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#2DE083" />
            </View>
          ) : (
            <View style={styles.bottomSpacer} />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2DE083" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <Pressable style={styles.chatFab} onPress={() => setChatOpen(true)}>
        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        <Text style={styles.chatFabText}>Ask AI</Text>
      </Pressable>

      <Modal visible={chatOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setChatOpen(false)}>
        <View style={styles.modalScreen}>
          <Pressable style={styles.modalClose} onPress={() => setChatOpen(false)}>
            <Ionicons name="close" size={24} color="#15351F" />
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          <AgriSparkAIChatbot autoGreeting dashboardRole="buyer" dashboardPage="Buyer Dashboard" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FBF4",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 132,
  },
  chatFab: { position: "absolute", right: 16, bottom: 104, zIndex: 2000, elevation: 20, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  chatFabText: { color: "#fff", fontWeight: "900" },
  modalScreen: { flex: 1, backgroundColor: "#F6FBF4" },
  modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  modalCloseText: { color: "#15351F", fontWeight: "800" },
  headerSection: {
    marginBottom: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  greeting: {
    color: "#5F7668",
    fontSize: 13,
    fontWeight: "600",
  },
  name: {
    color: "#15351F",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#D8F7E5",
  },
  pillText: {
    color: "#1E7A35",
    fontSize: 11,
    fontWeight: "800",
  },
  heroCopy: {
    color: "#66796F",
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionSpacer: {
    height: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHint: {
    color: "#6A7E71",
    fontSize: 12,
  },
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  skeletonCard: {
    width: "48%",
    height: 300,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    opacity: 0.72,
  },
  stateCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
  },
  stateTitle: {
    color: "#15351F",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 10,
  },
  stateCopy: {
    color: "#66796F",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
  stateButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#D8F7E5",
  },
  stateButtonText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  bottomSpacer: {
    height: 12,
  },
});
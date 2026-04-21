import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

const lowStockThreshold = 5;

const formatMoney = (value) => {
  return `ETB ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "F";

  return value
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const resolveImageUrl = (value) => {
  if (!value) return "";

  const v = value.trim();

  // If already full URL → return as is
  if (v.startsWith("http")) return v;

  // Clean path (remove leading slash + bucket name)
  const path = v.replace(/^\/|^product-images\//g, "");

  // Return public URL
  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
};

export default function FarmerHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (authError || !authUser?.email) {
      throw new Error("Please log in again.");
    }

    const normalizedEmail = authUser.email.trim().toLowerCase();
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id, full_name, role, location")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow?.id) {
      throw new Error("Farmer profile not found.");
    }

    if (userRow.role !== "farmer") {
      throw new Error("Only farmer accounts can access this dashboard.");
    }

    setProfile(userRow);

    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, name, category, quantity, price, location, image_url, created_at")
      .eq("farmer_id", userRow.id)
      .order("created_at", { ascending: false });

    if (productError) {
      throw productError;
    }

    const safeProducts = await Promise.all(
      (productRows || []).map(async (item) => ({
        ...item,
        resolved_image_url: resolveImageUrl(item.image_url),
      }))
    );
    setProducts(safeProducts);

    if (!safeProducts.length) {
      setPendingOrders(0);
      return;
    }

    const productIds = safeProducts.map((item) => item.id);

    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .in("product_id", productIds)

    if (orderError) {
      throw orderError;
    }

    setPendingOrders((orderRows || []).length);
  }, []);

  const runInitialLoad = useCallback(async () => {
    try {
      setLoading(true);
      await fetchDashboard();
    } catch (loadError) {
      console.log("[FarmerHome] Dashboard load failed", loadError?.message || loadError);
      setError(loadError?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchDashboard();
    } catch (refreshError) {
      console.log("[FarmerHome] Dashboard refresh failed", refreshError?.message || refreshError);
      setError(refreshError?.message || "Could not refresh dashboard data.");
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      runInitialLoad();
    }, [runInitialLoad])
  );

  const lowStockCount = useMemo(
    () => products.filter((item) => Number(item.quantity || 0) <= lowStockThreshold).length,
    [products]
  );

  const stockValue = useMemo(
    () =>
      products.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [products]
  );

  const stats = useMemo(
    () => [
      {
        label: "Pending Orders",
        value: String(pendingOrders),
        icon: "clipboard-outline",
        tone: "#FFE7E5",
      },
      {
        label: "Low Stock Alerts",
        value: String(lowStockCount),
        icon: "warning-outline",
        tone: "#FFF0D9",
      },
      {
        label: "Active Listings",
        value: String(products.length),
        icon: "bag-outline",
        tone: "#E8F4EA",
      },
      {
        label: "Stock Value",
        value: formatMoney(stockValue),
        icon: "cash-outline",
        tone: "#E8EEF8",
      },
    ],
    [pendingOrders, lowStockCount, products.length, stockValue]
  );

  const recentProducts = products.slice(0, 3).map((item) => {
    const quantity = Number(item.quantity || 0);
    const lowStock = quantity <= lowStockThreshold;

    return {
      id: item.id,
      title: item.name,
      category: item.category || "Grains",
      location: item.location || profile?.location || "Mekelle",
      price: item.price,
      imageUrl: item.resolved_image_url,
      stockLabel: lowStock ? `Low stock: ${quantity}kg` : `In stock: ${quantity}`,
      stockTone: lowStock ? styles.stockLow : styles.stockGood,
    };
  });

  const inquiryRows = useMemo(() => {
    const firstProduct = products[0];
    const secondProduct = products[1];
    const thirdProduct = products[2];

    return [
      {
        id: "inq-1",
        name: "Buyer Jane",
        message: `Is the ${firstProduct?.name || "tomatoes"} available in bulk this week?`,
        avatar: "BJ",
      },
      {
        id: "inq-2",
        name: "River Jane",
        message: `We want the ${secondProduct?.name || "maize"} if it is still in stock.`,
        avatar: "RJ",
      },
      {
        id: "inq-3",
        name: "Buyer Solomon",
        message: `Can you confirm the latest price for ${thirdProduct?.name || "teff"}?`,
        avatar: "BS",
      },
    ];
  }, [products]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ImageBackground
        source={require("../../assets/images/agri_hero-2.jpg")}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroShade} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>
            {profile?.full_name ? `Welcome back, ${profile.full_name}!` : "Welcome back, Farmer!"}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#143B18" />
            <Text style={styles.heroSubtitle}>{profile?.location || "Mekelle"}</Text>
          </View>
        </View>
      </ImageBackground>

      {!!error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={18} color="#9A3A2A" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1E7A35" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>FARM PULSE</Text>
          <Text style={styles.sectionTitleInline}>(snapshot)</Text>
        </View>
        <Text style={styles.sectionAction} onPress={onRefresh}>Refresh</Text>
      </View>
      <View style={styles.grid}>
        {stats.map((item) => (
          <View key={item.label} style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={[styles.cardIconWrap, { backgroundColor: item.tone }]}>
              <Ionicons name={item.icon} size={18} color="#155D2E" />
            </View>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>MY PRODUCTS</Text>
          <Text style={styles.sectionTitleInline}>(inventory)</Text>
        </View>
        <Text style={styles.sectionAction} onPress={() => router.push("/farmer/products")}>
          Manage
        </Text>
      </View>
      <View style={styles.productListWrap}>
        {recentProducts.length === 0 && (
          <Text style={styles.emptyText}>No products yet. Add your first listing.</Text>
        )}
        {recentProducts.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.productRow, pressed && styles.pressedCard]}
            onPress={() => router.push("/farmer/products")}
          >
            <View style={styles.productImageWrap}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productThumb}
                />
              ) : (
                <View style={styles.productThumbFallback}>
                  <Ionicons name="image-outline" size={16} color="#7DA58A" />
                </View>
              )}
            </View>

            <View style={styles.productBody}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.productMeta} numberOfLines={1}>
                {item.category} | {item.location}
              </Text>
              <View style={[styles.stockBadge, item.stockTone]}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>{item.stockLabel}</Text>
              </View>
            </View>

            <View style={styles.productRight}>
              <Text style={styles.priceText}>{`ETB ${Number(item.price || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}/Q`}</Text>
              <Ionicons name="ellipsis-vertical" size={18} color="#4B5F51" />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>RECENT INQUIRIES</Text>
          <Text style={styles.sectionTitleInline}>(chat)</Text>
        </View>
      </View>
      <View style={styles.inquiryListWrap}>
        {inquiryRows.map((item) => (
          <View key={item.id} style={styles.inquiryRow}>
            <View style={styles.inquiryAvatar}>
              <Text style={styles.inquiryAvatarText}>{item.avatar || getInitials(item.name)}</Text>
            </View>
            <View style={styles.inquiryBody}>
              <Text style={styles.inquiryName}>{item.name}</Text>
              <Text style={styles.inquiryMessage} numberOfLines={1}>
                {item.message}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  hero: {
    width: "100%",
    minHeight: 158,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#CFE8B0",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroShade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(209, 236, 169, 0.72)",
  },
  heroOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
    maxWidth: "80%",
  },
  heroTitle: {
    color: "#0D1710",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSubtitle: {
    color: "#203827",
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFE9E4",
    borderWidth: 1,
    borderColor: "#F3C3B8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: "#9A3A2A",
    fontWeight: "600",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingText: {
    color: "#23573A",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 2,
  },
  sectionEyebrow: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3D2B",
  },
  sectionTitleInline: {
    color: "#5D6D63",
    fontSize: 16,
    marginTop: 2,
  },
  sectionAction: {
    color: "#2E7D45",
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    minHeight: 108,
    position: "relative",
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#E55A4B",
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#173E2B",
    marginTop: 10,
  },
  cardLabel: {
    marginTop: 4,
    color: "#557765",
    fontSize: 12,
  },
  productListWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF4EE",
  },
  productImageWrap: {
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EAF4E8",
  },
  productThumb: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EAF4E8",
  },
  productThumbFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EAF4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    fontWeight: "800",
    color: "#1F2E24",
    fontSize: 16,
  },
  productMeta: {
    color: "#6B7D70",
    fontSize: 12,
  },
  stockBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockGood: {
    backgroundColor: "#EEF8F0",
  },
  stockLow: {
    backgroundColor: "#FFF3E1",
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#20A04A",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#355C3D",
  },
  productRight: {
    alignItems: "flex-end",
    gap: 8,
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  priceText: {
    color: "#16843B",
    fontWeight: "800",
    fontSize: 16,
  },
  pressedCard: {
    opacity: 0.75,
  },
  inquiryListWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inquiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF5EE",
  },
  inquiryAvatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#E7F3EA",
    alignItems: "center",
    justifyContent: "center",
  },
  inquiryAvatarText: {
    color: "#155D2E",
    fontWeight: "800",
    fontSize: 12,
  },
  inquiryBody: {
    flex: 1,
  },
  inquiryName: {
    fontWeight: "800",
    color: "#1F2E24",
    fontSize: 14,
  },
  inquiryMessage: {
    color: "#55675B",
    marginTop: 2,
    fontSize: 13,
  },
  emptyText: {
    color: "#557765",
    fontSize: 13,
    paddingVertical: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  actionText: {
    color: "#23573A",
    fontWeight: "700",
    fontSize: 12,
  },
});

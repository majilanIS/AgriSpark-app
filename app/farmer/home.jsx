import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

// const quickActions = [
//   { title: "Add Product", icon: "add-circle-outline", route: "/farmer/create" },
//   { title: "Track Orders", icon: "cube-outline", route: "/farmer/orders" },
//   { title: "My Products", icon: "leaf-outline", route: "/farmer/products" },
// ];

const formatMoney = (value) => {
  return `ETB ${Number(value || 0).toFixed(2)}`;
};

export default function FarmerHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [ordersToday, setOrdersToday] = useState(0);

  const fetchDashboard = async () => {
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
      .select("id, name, category, quantity, price, location, created_at")
      .eq("farmer_id", userRow.id)
      .order("created_at", { ascending: false });

    if (productError) {
      throw productError;
    }

    const safeProducts = productRows || [];
    setProducts(safeProducts);

    if (!safeProducts.length) {
      setOrdersToday(0);
      return;
    }

    const productIds = safeProducts.map((item) => item.id);
    const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .in("product_id", productIds)
      .gte("created_at", startOfDayIso);

    if (orderError) {
      throw orderError;
    }

    setOrdersToday((orderRows || []).length);
  };

  const runInitialLoad = async () => {
    try {
      setLoading(true);
      await fetchDashboard();
    } catch (loadError) {
      console.log("[FarmerHome] Dashboard load failed", loadError?.message || loadError);
      setError(loadError?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDashboard();
    } catch (refreshError) {
      console.log("[FarmerHome] Dashboard refresh failed", refreshError?.message || refreshError);
      setError(refreshError?.message || "Could not refresh dashboard data.");
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useMemo(
      () => () => {
        runInitialLoad();
      },
      []
    )
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
        label: "Active Listings",
        value: String(products.length),
        icon: "basket",
        tone: "#DFF4E5",
      },
      {
        label: "Orders Today",
        value: String(ordersToday),
        icon: "cart",
        tone: "#E7F0FF",
      },
      {
        label: "Stock Value",
        value: formatMoney(stockValue),
        icon: "cash-outline",
        tone: "#FFF2DC",
      },
      {
        label: "Low Stock",
        value: String(lowStockCount),
        icon: "alert-circle-outline",
        tone: "#FFE6E1",
      },
    ],
    [products.length, ordersToday, stockValue, lowStockCount]
  );

  const recentProducts = products.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.name,
    due:
      Number(item.quantity || 0) <= lowStockThreshold
        ? `Low stock: ${item.quantity || 0} left`
        : `${item.quantity || 0} units available`,
    done: Number(item.quantity || 0) > lowStockThreshold,
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/agri_hero-2.jpg")}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>FARMER CONTROL PANEL</Text>
          <Text style={styles.heroTitle}>
            {profile?.full_name ? `${profile.full_name}, dashboard` : "Grow smarter, sell faster."}
          </Text>
          <Text style={styles.heroSubtitle}>
            {profile?.location
              ? `Location: ${profile.location}`
              : "Monitor produce, orders, and revenue in one place."}
          </Text>
          <Pressable style={styles.heroButton} onPress={() => router.push("/farmer/create")}>
            <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
            <Text style={styles.heroButtonText}>Add Product</Text>
          </Pressable>
        </View>
      </View>

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
        <Text style={styles.sectionTitle}>Farm Snapshot</Text>
        <Text style={styles.sectionAction} onPress={onRefresh}>Refresh</Text>
      </View>
      <View style={styles.grid}>
        {stats.map((item) => (
          <View key={item.label} style={styles.card}>
            <View style={[styles.cardIconWrap, { backgroundColor: item.tone }]}>
              <Ionicons name={item.icon} size={18} color="#155D2E" />
            </View>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Products</Text>
        <Text style={styles.sectionAction}>Manage</Text>
      </View>
      <View style={styles.listWrap}>
        {recentProducts.length === 0 && (
          <Text style={styles.emptyText}>No products yet. Add your first listing.</Text>
        )}
        {recentProducts.map((item) => (
          <View key={item.title} style={styles.taskRow}>
            <View style={[styles.dot, item.done && styles.dotDone]} />
            <View style={styles.taskTextWrap}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={[styles.taskDue, item.done && styles.taskDone]}>{item.due}</Text>
            </View>
            <Ionicons
              name={item.done ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={item.done ? "#1E7A35" : "#9CB1A2"}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F8F1",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 26,
    gap: 14,
  },
  hero: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#123A1F",
  },
  heroImage: {
    width: "100%",
    height: 190,
    position: "absolute",
    opacity: 0.28,
  },
  heroOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
  },
  heroTag: {
    alignSelf: "flex-start",
    color: "#DCF7E6",
    fontWeight: "700",
    fontSize: 11,
    backgroundColor: "#1E7A35",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 31,
    maxWidth: "90%",
  },
  heroSubtitle: {
    color: "#D0E9D8",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "88%",
  },
  heroButton: {
    marginTop: 6,
    backgroundColor: "#1E7A35",
    borderRadius: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    alignItems: "center",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3D2B",
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
  listWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF5EE",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#F3B21A",
  },
  dotDone: {
    backgroundColor: "#1E7A35",
  },
  taskTextWrap: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "700",
    color: "#1F3B2B",
    fontSize: 14,
  },
  taskDue: {
    color: "#A36C09",
    marginTop: 2,
    fontSize: 12,
  },
  taskDone: {
    color: "#437B58",
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

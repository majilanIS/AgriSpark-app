import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchFarmerOrders, updateFarmerOrderStatus } from "../../lib/orderService";

const filters = ["All", "Pending", "Accepted", "Rejected"];

export default function FarmerOrdersScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await fetchFarmerOrders();
      setOrders(rows);
    } catch (loadError) {
      setOrders([]);
      setError(loadError?.message || "Could not load farmer orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === "All"
        ? orders
        : orders.filter((order) => order.status === activeFilter),
    [activeFilter, orders]
  );

  const statusTone = {
    Accepted: styles.acceptedBadge,
    Pending: styles.pendingBadge,
    Rejected: styles.rejectedBadge,
  };

  const handleOrderDecision = useCallback(
    async (orderId, nextStatus) => {
      try {
        setProcessingOrderId(String(orderId));
        await updateFarmerOrderStatus({ orderId, status: nextStatus });
        await loadOrders();
      } catch (statusError) {
        setError(statusError?.message || "Could not update order status.");
      } finally {
        setProcessingOrderId("");
      }
    },
    [loadOrders]
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Farmer orders</Text>
        <Text style={styles.subtitle}>Live orders linked to your products.</Text>

        <View style={styles.filterBar}>
          {filters.map((filter) => {
            const active = filter === activeFilter;

            return (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={styles.filterItem}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
                <View style={[styles.filterUnderline, active && styles.filterUnderlineActive]} />
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#1E7A35" />
            <Text style={styles.loadingText}>Loading farmer orders...</Text>
          </View>
        ) : !!error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Could not load orders</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadOrders}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Orders placed on your products will show up here automatically.</Text>
          </View>
        ) : filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>{order.displayId}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={[styles.statusBadge, statusTone[order.status]]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.productRow}>
              <View style={styles.art}>
                {order.imageUrl ? (
                  <Image source={{ uri: order.imageUrl }} style={styles.artImage} />
                ) : (
                  <View style={[styles.artFallback, { backgroundColor: order.accent }]}>
                    <Ionicons name={order.icon} size={24} color="#6FA96D" />
                  </View>
                )}
              </View>
              <View style={styles.productCopy}>
                <Text style={styles.productName}>{order.product}</Text>
                <Text style={styles.productFarmer}>Buyer: {order.buyer}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Quantity</Text>
                <Text style={styles.summaryValue}>{order.quantity}</Text>
              </View>
              <View style={styles.summaryItemRight}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.totalValue}>{order.total}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              {order.rawStatus === "pending" ? (
                <>
                  <Pressable
                    style={[styles.statusActionButton, styles.acceptActionButton]}
                    onPress={() => handleOrderDecision(order.orderId || order.id, "accepted")}
                    disabled={processingOrderId === String(order.orderId || order.id)}
                  >
                    <Ionicons name="checkmark" size={14} color="#062412" />
                    <Text style={styles.acceptActionText}>{processingOrderId === String(order.orderId || order.id) ? "Saving..." : "Accept"}</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.statusActionButton, styles.rejectActionButton]}
                    onPress={() => handleOrderDecision(order.orderId || order.id, "rejected")}
                    disabled={processingOrderId === String(order.orderId || order.id)}
                  >
                    <Ionicons name="close" size={14} color="#FFD7D7" />
                    <Text style={styles.rejectActionText}>Reject</Text>
                  </Pressable>
                </>
              ) : null}

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/ChatPage",
                    params: {
                      role: "farmer",
                      name: order.buyer,
                      product: order.product,
                      orderId: String(order.orderId || order.id),
                      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(order.buyer)}`,
                    },
                  })
                }
              >
                <Ionicons name="chatbubble-outline" size={14} color="#D9D6CE" />
                <Text style={styles.secondaryButtonText}>Chat</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6FBF4" },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 120 },
  title: { color: "#15351F", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F7668", marginTop: 4, marginBottom: 14, fontSize: 13 },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE9D8",
  },
  filterItem: { flex: 1, alignItems: "center", paddingBottom: 12 },
  filterText: { color: "#7A8E81", fontSize: 14, fontWeight: "600" },
  filterTextActive: { color: "#1E7A35" },
  filterUnderline: { width: "100%", height: 2, marginTop: 10, backgroundColor: "transparent" },
  filterUnderlineActive: { backgroundColor: "#1E7A35" },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  loadingText: { color: "#15351F", fontWeight: "600" },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    backgroundColor: "#FFFFFF",
    padding: 18,
  },
  emptyTitle: { color: "#15351F", fontSize: 16, fontWeight: "800" },
  emptyText: { color: "#66796F", marginTop: 6, fontSize: 13, lineHeight: 18 },
  retryButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F1F8EE",
  },
  retryButtonText: { color: "#1E7A35", fontWeight: "700" },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { color: "#15351F", fontSize: 13, fontWeight: "800" },
  orderDate: { color: "#7A8E81", marginTop: 2, fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, height: 24, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  acceptedBadge: { backgroundColor: "#D8F7E5" },
  pendingBadge: { backgroundColor: "#F8EFC7" },
  rejectedBadge: { backgroundColor: "#F5DDDA" },
  statusText: { color: "#1E7A35", fontSize: 12, fontWeight: "700" },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  art: { width: 54, height: 54, borderRadius: 13, overflow: "hidden", backgroundColor: "#F1F8EE" },
  artImage: { width: "100%", height: "100%" },
  artFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  productCopy: { flex: 1 },
  productName: { color: "#15351F", fontSize: 16, fontWeight: "800" },
  productFarmer: { color: "#6A7E71", marginTop: 3, fontSize: 12 },
  divider: { height: 1, backgroundColor: "#DDE9D8", marginTop: 12, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryItem: { flex: 1 },
  summaryItemRight: { alignItems: "flex-end" },
  summaryLabel: { color: "#7A8E81", fontSize: 12, marginBottom: 4 },
  summaryValue: { color: "#15351F", fontSize: 14, fontWeight: "700" },
  totalValue: { color: "#18A05D", fontSize: 14, fontWeight: "800" },
  actionsRow: { flexDirection: "row", gap: 10 },
  statusActionButton: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  acceptActionButton: {
    backgroundColor: "#D8F7E5",
  },
  rejectActionButton: {
    backgroundColor: "#F9ECEA",
    borderWidth: 1,
    borderColor: "#F1D1CB",
  },
  acceptActionText: {
    color: "#1E7A35",
    fontSize: 13,
    fontWeight: "800",
  },
  rejectActionText: {
    color: "#B25546",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F8FBF6",
  },
  secondaryButtonText: { color: "#1E7A35", fontSize: 13, fontWeight: "600" },
});

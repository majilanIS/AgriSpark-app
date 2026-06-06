import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";
import { fetchAdminOrders } from "../../src/admin/adminService";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [resolvedOrders, setResolvedOrders] = useState({});
  const [chatOpen, setChatOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const nextOrders = await fetchAdminOrders();
      setOrders(nextOrders);
    } catch (loadError) {
      setError(loadError?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const tabs = useMemo(() => ["All", "Pending", "Accepted", "Rejected", "Disputes"], []);

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return orders;
    if (activeTab === "Disputes") return orders.filter((order) => order.hasDispute);
    return orders.filter((order) => order.statusLabel === activeTab);
  }, [activeTab, orders]);

  const metrics = useMemo(() => {
    const disputeCount = orders.filter((order) => order.hasDispute).length;
    const resolvedCount = Object.values(resolvedOrders).filter(Boolean).length;

    return [
      { label: "Orders", value: orders.length },
      { label: "Disputes", value: disputeCount },
      { label: "Resolved", value: resolvedCount },
      { label: "Pending", value: orders.filter((order) => order.status === "pending").length },
    ];
  }, [orders, resolvedOrders]);

  const handleResolveDispute = (order) => {
    setResolvedOrders((current) => ({ ...current, [order.id]: true }));
    Alert.alert(
      "Dispute resolved",
      `Marked the dispute on ${order.productName} as resolved for this session. To persist this, add a moderation field later.`
    );
  };

  const isResolved = (orderId) => !!resolvedOrders[orderId];

  const renderOrderCard = (order) => {
    const resolved = isResolved(order.id);

    return (
      <View key={order.id} style={[styles.card, order.hasDispute && !resolved && styles.cardDispute, resolved && styles.cardResolved]}>
        <View style={styles.cardTop}>
          <Image source={{ uri: order.imageUrl || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }} style={styles.image} />

          <View style={styles.cardCopy}>
            <Text style={styles.name} numberOfLines={1}>{order.productName}</Text>
            <Text style={styles.meta} numberOfLines={1}>{order.buyerName} → {order.farmerName}</Text>
            <Text style={styles.meta} numberOfLines={1}>{order.buyerBusinessName || order.buyerLocation || "Buyer"}</Text>
            <Text style={styles.meta}>{order.createdLabel}</Text>
          </View>

          <View style={styles.statusWrap}>
            <View style={[styles.statusPill, order.status === "accepted" && styles.statusAccepted, order.status === "rejected" && styles.statusRejected, order.status === "pending" && styles.statusPending]}>
              <Text style={[styles.statusText, order.status === "rejected" && styles.statusTextRejected]}>{order.statusLabel}</Text>
            </View>
            {order.hasDispute ? (
              <View style={[styles.disputePill, resolved && styles.disputeResolved]}>
                <Text style={[styles.disputeText, resolved && styles.disputeTextResolved]}>{resolved ? "Resolved" : "Dispute"}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{order.quantityLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.detailValue}>{order.totalLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Product location</Text>
          <Text style={styles.detailValue}>{order.productLocation || "No location"}</Text>
        </View>

        {order.hasDispute ? (
          <View style={styles.disputeBox}>
            <Text style={styles.disputeTitle}>Dispute details</Text>
            <Text style={styles.disputeCopy} numberOfLines={3}>{order.disputeMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={() => Alert.alert("Order status", `${order.productName}: ${order.statusLabel}`)}>
            <Ionicons name="pulse-outline" size={14} color="#DCEFE4" />
            <Text style={styles.actionButtonText}>Track status</Text>
          </Pressable>

          {order.hasDispute && !resolved ? (
            <Pressable style={styles.actionButtonDanger} onPress={() => handleResolveDispute(order)}>
              <Ionicons name="checkmark-done-outline" size={14} color="#08110D" />
              <Text style={styles.actionButtonTextDanger}>Resolve dispute</Text>
            </Pressable>
          ) : order.hasDispute ? (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#08110D" />
              <Text style={styles.resolvedBadgeText}>Resolved this session</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.sub}>View all orders in the system, track statuses, and resolve disputes between farmers and buyers.</Text>

        <View style={styles.metricsRow}>
          {metrics.map((item) => (
            <View key={item.label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Could not load orders</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadOrders} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listWrap}>
          {filteredOrders.map(renderOrderCard)}
        </View>
      </ScrollView>

      <Pressable style={styles.chatFab} onPress={() => setChatOpen(true)}>
        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        <Text style={styles.chatFabText}>Ask AI</Text>
      </Pressable>

      <Modal visible={chatOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setChatOpen(false)}>
        <View style={styles.modalScreen}>
          <Pressable style={styles.modalClose} onPress={() => setChatOpen(false)}>
            <Ionicons name="close" size={24} color="#F4F2EC" />
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          <AgriSparkAIChatbot autoGreeting={false} dashboardRole="admin" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080A09" },
  content: { padding: 18, paddingBottom: 120 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "900", marginBottom: 8 },
  sub: { color: "#AAB4AF", marginBottom: 14, lineHeight: 20 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  metricCard: { width: "48%", borderRadius: 14, backgroundColor: "#0F1412", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  metricValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  metricLabel: { color: "#9DA9A3", marginTop: 6, fontSize: 12 },
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#1A1F1D", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  tabActive: { backgroundColor: "#E3F7EB", borderColor: "#E3F7EB" },
  tabText: { color: "#9BA7A3", fontSize: 12, fontWeight: "800" },
  tabTextActive: { color: "#08110D" },
  stateCard: { marginTop: 4, marginBottom: 14, borderRadius: 14, backgroundColor: "#0F1412", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  stateTitle: { color: "#F4F2EC", fontWeight: "900", marginTop: 8 },
  stateText: { color: "#9DA9A3", marginTop: 6, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#2B7BF6" },
  retryButtonText: { color: "#fff", fontWeight: "900" },
  listWrap: { gap: 12 },

  chatFab: { position: "absolute", right: 16, bottom: 18, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, elevation: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  chatFabText: { color: "#fff", fontWeight: "900" },
  modalScreen: { flex: 1, backgroundColor: "#07110C" },
  modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  modalCloseText: { color: "#F4F2EC", fontWeight: "800" },

  card: { borderRadius: 14, padding: 14, backgroundColor: "#1a5839", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  cardDispute: { borderColor: "rgba(255,92,92,0.28)" },
  cardResolved: { borderColor: "rgba(45,224,131,0.28)" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  image: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#1A201D" },
  cardCopy: { flex: 1, minWidth: 0 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  meta: { color: "#AAB4AF", marginTop: 3, fontSize: 12 },
  statusWrap: { alignItems: "flex-end", gap: 6 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#1A1F1D" },
  statusPending: { backgroundColor: "rgba(255,197,67,0.16)" },
  statusAccepted: { backgroundColor: "rgba(45,224,131,0.16)" },
  statusRejected: { backgroundColor: "rgba(255,92,92,0.14)" },
  statusText: { color: "#DCEFE4", fontSize: 11, fontWeight: "900" },
  statusTextRejected: { color: "#FFB9B3" },
  disputePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(255,92,92,0.14)" },
  disputeResolved: { backgroundColor: "rgba(45,224,131,0.16)" },
  disputeText: { color: "#FFB9B3", fontSize: 10, fontWeight: "900" },
  disputeTextResolved: { color: "#08110D" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
  detailLabel: { color: "#7F8B86", fontSize: 12, flexShrink: 0 },
  detailValue: { color: "#DCEFE4", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  disputeBox: { marginTop: 12, borderRadius: 12, padding: 12, backgroundColor: "rgba(255,92,92,0.08)", borderWidth: 1, borderColor: "rgba(255,92,92,0.15)" },
  disputeTitle: { color: "#FFB9B3", fontWeight: "900", marginBottom: 6 },
  disputeCopy: { color: "#F4F2EC", lineHeight: 18, fontSize: 12 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#171D1A", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  actionButtonDanger: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(255,197,67,0.18)" },
  actionButtonText: { color: "#DCEFE4", fontSize: 12, fontWeight: "800" },
  actionButtonTextDanger: { color: "#08110D", fontSize: 12, fontWeight: "800" },
  resolvedBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(45,224,131,0.16)" },
  resolvedBadgeText: { color: "#08110D", fontSize: 12, fontWeight: "800" },
});

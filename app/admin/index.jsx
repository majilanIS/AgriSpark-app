import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, ActivityIndicator, Image, Modal } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";
import { fetchAdminDashboardStats, fetchAdminProfile } from "../../src/admin/adminService";

export default function AdminHome() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [nextProfile, nextStats] = await Promise.all([fetchAdminProfile(), fetchAdminDashboardStats()]);
      setProfile(nextProfile);
      setStats(nextStats);
    } catch (loadError) {
      setError(loadError?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const tiles = useMemo(
    () => [
      {
        key: "users",
        title: "Users",
        subtitle: "Manage farmers and buyers, approve or remove accounts.",
        color: "#2B7BF6",
        icon: "people",
        value: stats ? `${stats.activeUsers}` : "--",
      },
      {
        key: "products",
        title: "Products",
        subtitle: "Monitor all products listed by farmers and manage them.",
        color: "#1CA85A",
        icon: "basket",
        value: stats ? `${stats.totalProducts}` : "--",
      },
      {
        key: "orders",
        title: "Orders",
        subtitle: "Track all orders, monitor status and resolve any disputes.",
        color: "#F08C2B",
        icon: "receipt",
        value: stats ? `${stats.totalOrders}` : "--",
      },
      {
        key: "chat",
        title: "Chat",
        subtitle: "Communicate with users and resolve issues.",
        color: "#8E44FF",
        icon: "chatbubbles",
        value: stats ? `${stats.openChats}` : "--",
      },
    ],
    [stats]
  );

  const overview = useMemo(
    () => [
      { key: "active", label: "Active Users", value: stats ? `${stats.activeUsers}` : "--", icon: "person-circle" },
      { key: "products", label: "Products", value: stats ? `${stats.totalProducts}` : "--", icon: "bag" },
      { key: "orders", label: "Orders", value: stats ? `${stats.totalOrders}` : "--", icon: "cart" },
      { key: "chats", label: "Open Chats", value: stats ? `${stats.openChats}` : "--", icon: "chatbubbles" },
    ],
    [stats]
  );

  const adminName = profile?.full_name || "Admin";
  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" />

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.profileRow}>
          <View>
            <Text style={styles.welcome}>Welcome, {adminName.split(" ")[0] || "Admin"} 👋</Text>
            <Text style={styles.welcomeSub}>Choose a section to get started</Text>
          </View>

          <Pressable onPress={() => router.push("/admin/reports")} style={styles.profileChip}>
            <View style={styles.avatarCircle}>
              {profile?.profile_image_url ? (
                <Image source={{ uri: profile.profile_image_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials || "A"}</Text>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{adminName}</Text>
              <Text style={styles.profileRole}>{profile?.role || "admin"}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9DA9A3" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading live admin data...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Could not load dashboard</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadDashboard} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.tilesRow}>
          {tiles.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tile, { backgroundColor: t.color }]}
              onPress={() => router.push(`/admin/${t.key}`)}
            >
              <View style={styles.tileInner}>
                <Ionicons name={t.icon} size={36} color="#fff" />
                <View>
                  <Text style={styles.tileTitle}>{t.title}</Text>
                  <Text style={styles.tileValue}>{t.value}</Text>
                  <Text style={styles.tileSub}>{t.subtitle}</Text>
                </View>
                <View style={styles.tileAction}>
                  <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>System Overview</Text>
            <Pressable onPress={() => router.push("/admin/reports")}>
              <Text style={styles.viewReport}>View Report</Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            {overview.map((s) => (
              <View key={s.key} style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Ionicons name={s.icon} size={20} color="#fff" />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
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
          <AgriSparkAIChatbot autoGreeting dashboardRole="admin" dashboardPage="Admin Dashboard" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0D0C" },
  content: { padding: 18, paddingBottom: 120 },
  chatFab: { position: "absolute", right: 16, bottom: 18, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, elevation: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  chatFabText: { color: "#fff", fontWeight: "900" },
  modalScreen: { flex: 1, backgroundColor: "#07110C" },
  modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  modalCloseText: { color: "#F4F2EC", fontWeight: "800" },
  profileRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  welcome: { color: "#F4F2EC", fontSize: 18, fontWeight: "800" },
  welcomeSub: { color: "#9DA9A3", marginTop: 2, fontSize: 12 },
  profileChip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111814", borderRadius: 999, paddingVertical: 8, paddingLeft: 8, paddingRight: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#20312A", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 34, height: 34 },
  avatarText: { color: "#F4F2EC", fontWeight: "900", fontSize: 12 },
  profileMeta: { minWidth: 0 },
  profileName: { color: "#F4F2EC", fontSize: 12, fontWeight: "800" },
  profileRole: { color: "#9DA9A3", fontSize: 10, textTransform: "capitalize" },
  tilesRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  tile: { width: "48%", borderRadius: 14, padding: 14, marginBottom: 12 },
  tileInner: { minHeight: 140, justifyContent: "space-between", gap: 8 },
  tileTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 6 },
  tileValue: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700", marginTop: 4 },
  tileSub: { color: "rgba(255,255,255,0.9)", marginTop: 8, fontSize: 12, opacity: 0.95 },
  tileAction: { position: "absolute", right: 12, bottom: 12 },
  overviewCard: { marginTop: 10, borderRadius: 12, backgroundColor: "#0F1412", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  overviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overviewTitle: { color: "#F4F2EC", fontWeight: "900" },
  viewReport: { color: "#2B7BF6", fontWeight: "700" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  statItem: { flex: 1, alignItems: "center", padding: 12 },
  statIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#9DA9A3", marginTop: 6, fontSize: 12 },
  stateCard: { marginTop: 8, marginBottom: 10, borderRadius: 14, backgroundColor: "#0F1412", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  stateTitle: { color: "#F4F2EC", fontWeight: "900", marginTop: 8 },
  stateText: { color: "#9DA9A3", marginTop: 6, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#2B7BF6" },
  retryButtonText: { color: "#fff", fontWeight: "900" },
});

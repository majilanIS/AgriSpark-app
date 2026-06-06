import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";
import { deleteAdminUser, fetchAdminUserDeletionPreview, fetchAdminUsers, setAdminUserState } from "../../src/admin/adminService";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const nextUsers = await fetchAdminUsers();
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const farmers = useMemo(() => users.filter((user) => user.userType === "farmer"), [users]);
  const buyers = useMemo(() => users.filter((user) => user.userType === "buyer"), [users]);

  const handleStateChange = async (user, nextState) => {
    try {
      await setAdminUserState({ userId: user.id, nextState });
      await loadUsers();
    } catch (actionError) {
      Alert.alert("Unable to update user", actionError?.message || "Please try again.");
    }
  };

  const handleDelete = (user) => {
    const confirmDelete = async () => {
      try {
        await deleteAdminUser({ userId: user.id });
        await loadUsers();
      } catch (actionError) {
        Alert.alert("Unable to delete user", actionError?.message || "Please try again.");
      }
    };

    const recommendInactive = async () => {
      try {
        await setAdminUserState({ userId: user.id, nextState: "inactive" });
        await loadUsers();
      } catch (actionError) {
        Alert.alert("Unable to deactivate user", actionError?.message || "Please try again.");
      }
    };

    const showDeletePrompt = (preview) => {
      const parts = [];
      if (preview.relatedProducts) parts.push(`${preview.relatedProducts} product${preview.relatedProducts === 1 ? "" : "s"}`);
      if (preview.relatedOrders) parts.push(`${preview.relatedOrders} order${preview.relatedOrders === 1 ? "" : "s"}`);
      if (preview.relatedMessages) parts.push(`${preview.relatedMessages} message${preview.relatedMessages === 1 ? "" : "s"}`);

      if (preview.hasRelatedData) {
        Alert.alert(
          "Recommend deactivation",
          `${user.name} still has ${parts.join(", ")}. The safer action is to make the account inactive instead of deleting it.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Set Inactive", onPress: recommendInactive },
            { text: "Delete Anyway", style: "destructive", onPress: confirmDelete },
          ]
        );
        return;
      }

      Alert.alert(
        "Delete user",
        `Delete ${user.name}? This action removes the user record permanently.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    };

    const runPreview = async () => {
      try {
        const preview = await fetchAdminUserDeletionPreview({ userId: user.id });
        showDeletePrompt(preview);
      } catch (actionError) {
        Alert.alert("Unable to review user", actionError?.message || "Please try again.");
      }
    };

    runPreview();
  };

  const renderUserCard = (user) => {
    const isActive = user.accountState === "active";
    const isInactive = user.accountState === "inactive";
    const valueLabel = user.businessName || user.location || "No details";
    const initials = user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return (
      <View key={user.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials || "U"}</Text>}
          </View>

          <View style={styles.cardCopy}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>{user.location || "No location"}</Text>
          </View>

          <View style={[styles.statusPill, isActive && styles.statusActive, isInactive && styles.statusInactive]}>
            <Text style={styles.statusText}>{user.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{user.displayLabel}</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{valueLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{user.phoneNumber || "No phone number"}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, isActive && styles.actionButtonPrimary]}
            onPress={() => handleStateChange(user, "active")}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={isActive ? "#08110D" : "#DCEFE4"} />
            <Text style={[styles.actionButtonText, isActive && styles.actionButtonTextPrimary]}>Active</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, isInactive && styles.actionButtonWarning]}
            onPress={() => handleStateChange(user, "inactive")}
          >
            <Ionicons name="pause-circle-outline" size={14} color={isInactive ? "#08110D" : "#D8DEDA"} />
            <Text style={[styles.actionButtonText, isInactive && styles.actionButtonTextWarning]}>Inactive</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(user)}>
            <Ionicons name="trash-outline" size={14} color="#FFB9B3" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.sub}>Manage farmers and buyers, make accounts inactive, or delete them when safe.</Text>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Could not load users</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadUsers} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Farmers</Text>
          <Text style={styles.sectionHint}>{farmers.length} users</Text>
          <View style={styles.listWrap}>{farmers.map(renderUserCard)}</View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Buyers</Text>
          <Text style={styles.sectionHint}>{buyers.length} users</Text>
          <View style={styles.listWrap}>{buyers.map(renderUserCard)}</View>
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
  stateCard: { marginTop: 8, marginBottom: 16, borderRadius: 14, backgroundColor: "#0F1412", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  stateTitle: { color: "#F4F2EC", fontWeight: "900", marginTop: 8 },
  stateText: { color: "#9DA9A3", marginTop: 6, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#2B7BF6" },
  retryButtonText: { color: "#fff", fontWeight: "900" },
  sectionCard: { marginTop: 12, borderRadius: 14, backgroundColor: "#0F1412", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  sectionTitle: { color: "#F4F2EC", fontSize: 16, fontWeight: "900" },
  sectionHint: { color: "#9DA9A3", marginTop: 4, marginBottom: 12, fontSize: 12 },
  listWrap: { gap: 12 },

  chatFab: { position: "absolute", right: 16, bottom: 18, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, elevation: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  chatFabText: { color: "#fff", fontWeight: "900" },
  modalScreen: { flex: 1, backgroundColor: "#07110C" },
  modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  modalCloseText: { color: "#F4F2EC", fontWeight: "800" },

  card: { borderRadius: 14, padding: 14, backgroundColor: "#1a5839", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#20312A", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 44, height: 44 },
  avatarText: { color: "#F4F2EC", fontWeight: "900" },
  cardCopy: { flex: 1, minWidth: 0 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  meta: { color: "#AAB4AF", marginTop: 3, fontSize: 12 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#1A1F1D" },
  statusActive: { backgroundColor: "rgba(45,224,131,0.16)" },
  statusInactive: { backgroundColor: "rgba(255,197,67,0.16)" },
  statusText: { color: "#DCEFE4", fontSize: 11, fontWeight: "900" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
  detailLabel: { color: "#7F8B86", fontSize: 12, flexShrink: 0 },
  detailValue: { color: "#DCEFE4", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#171D1A", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  actionButtonPrimary: { backgroundColor: "#E3F7EB" },
  actionButtonWarning: { backgroundColor: "rgba(255,197,67,0.18)" },
  actionButtonText: { color: "#DCEFE4", fontSize: 12, fontWeight: "800" },
  actionButtonTextPrimary: { color: "#08110D" },
  actionButtonTextWarning: { color: "#08110D" },
  deleteButton: { borderColor: "rgba(255,92,92,0.25)" },
  deleteButtonText: { color: "#FFB9B3" },
});

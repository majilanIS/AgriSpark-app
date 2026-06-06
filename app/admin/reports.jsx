import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchAdminReport } from "../../src/admin/adminService";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";

export default function AdminReports() {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminReport();
      setReport(data);
    } catch (loadError) {
      setError(loadError?.message || "Could not load report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#F4F2EC" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>System Report</Text>
        <Text style={styles.subTitle}>Live summary generated from your current database.</Text>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading report...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Report unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadReport} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {report ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Reported Issues</Text>
              {report.issues && report.issues.length ? (
                report.issues.map((issue) => (
                  <View key={issue.id} style={styles.issueCard}>
                    <Text style={styles.issueMeta}>{issue.senderName} → {issue.receiverName}</Text>
                    <Text style={styles.issueText} numberOfLines={3}>{issue.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.reportText}>No reported issues found.</Text>
              )}
            </View>
          </>
        ) : null}
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
  screen: { flex: 1, backgroundColor: "#0B0D0C" },
  content: { padding: 18, paddingBottom: 120 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  backText: { color: "#F4F2EC", fontWeight: "800" },
  title: { color: "#F4F2EC", fontSize: 24, fontWeight: "900" },
  subTitle: { color: "#9DA9A3", marginTop: 4, marginBottom: 14 },
  stateCard: { marginTop: 4, marginBottom: 16, borderRadius: 14, backgroundColor: "#0F1412", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  stateTitle: { color: "#F4F2EC", fontWeight: "900", marginTop: 8 },
  stateText: { color: "#9DA9A3", marginTop: 6, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#2B7BF6" },
  retryButtonText: { color: "#fff", fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  summaryCard: { width: "48%", borderRadius: 14, padding: 16, backgroundColor: "#111814", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", marginBottom: 12 },
  summaryValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  summaryLabel: { color: "#9DA9A3", marginTop: 6 },
  sectionCard: { marginTop: 8, borderRadius: 14, padding: 16, backgroundColor: "#111814", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", marginBottom: 12 },
  sectionTitle: { color: "#F4F2EC", fontWeight: "900", marginBottom: 12, fontSize: 16 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)" },
  statusLabel: { color: "#D8DEDA" },
  statusValue: { color: "#FFF", fontWeight: "900" },
  reportText: { color: "#D8DEDA", lineHeight: 20 },
  issueCard: { marginTop: 8, borderRadius: 12, padding: 12, backgroundColor: "#0F1412", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  issueMeta: { color: "#9DA9A3", fontSize: 12, marginBottom: 6 },
  issueText: { color: "#F4F2EC", lineHeight: 18 },

  chatFab: { position: "absolute", right: 16, bottom: 18, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, elevation: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  chatFabText: { color: "#fff", fontWeight: "900" },
  modalScreen: { flex: 1, backgroundColor: "#07110C" },
  modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  modalCloseText: { color: "#F4F2EC", fontWeight: "800" },
});

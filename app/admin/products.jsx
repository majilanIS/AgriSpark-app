import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";
import { deleteAdminProduct, fetchAdminProducts } from "../../src/admin/adminService";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flaggedProducts, setFlaggedProducts] = useState({});
  const [chatOpen, setChatOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const nextProducts = await fetchAdminProducts();
      setProducts(nextProducts);
    } catch (loadError) {
      setError(loadError?.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const flaggedCount = useMemo(() => Object.values(flaggedProducts).filter(Boolean).length, [flaggedProducts]);

  const handleRemove = (product) => {
    Alert.alert(
      "Remove product",
      `Remove ${product.name}? This will delete it from the live product list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminProduct({ productId: product.id });
              await loadProducts();
            } catch (actionError) {
              Alert.alert("Unable to remove product", actionError?.message || "Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleFlag = (product) => {
    setFlaggedProducts((current) => ({
      ...current,
      [product.id]: !current[product.id],
    }));
  };

  const renderProductCard = (product) => {
    const flagged = !!flaggedProducts[product.id];

    return (
      <View key={product.id} style={[styles.card, flagged && styles.cardFlagged]}>
        <View style={styles.cardTop}>
          <Image
            source={{ uri: product.imageUrl || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }}
            style={styles.image}
          />

          <View style={styles.cardCopy}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>{product.farmerName}</Text>
            <Text style={styles.meta} numberOfLines={1}>{product.location || "No location"}</Text>
            <Text style={styles.meta}>{product.category}</Text>
          </View>

          <View style={[styles.statusPill, flagged && styles.statusFlagged]}>
            <Text style={[styles.statusText, flagged && styles.statusTextFlagged]}>
              {flagged ? "Flagged" : "Live"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>{product.priceLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock</Text>
          <Text style={styles.detailValue}>{product.stockLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Listed</Text>
          <Text style={styles.detailValue}>{product.createdLabel}</Text>
        </View>

        {product.description ? <Text style={styles.description} numberOfLines={3}>{product.description}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, flagged && styles.actionButtonWarning]}
            onPress={() => handleFlag(product)}
          >
            <Ionicons name="flag-outline" size={14} color={flagged ? "#08110D" : "#FFD7A6"} />
            <Text style={[styles.actionButtonText, flagged && styles.actionButtonTextWarning]}>
              {flagged ? "Flagged" : "Flag"}
            </Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleRemove(product)}>
            <Ionicons name="trash-outline" size={14} color="#FFB9B3" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.sub}>View all products listed by farmers. Remove or flag inappropriate products.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{products.length}</Text>
            <Text style={styles.summaryLabel}>Listed products</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{flaggedCount}</Text>
            <Text style={styles.summaryLabel}>Flagged in session</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading products...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Could not load products</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadProducts} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listWrap}>
          {products.map(renderProductCard)}
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
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 2 },
  summaryCard: { flex: 1, borderRadius: 14, backgroundColor: "#13140f", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  summaryValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  summaryLabel: { color: "#9DA9A3", marginTop: 6, fontSize: 12 },
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
  cardFlagged: { borderColor: "rgba(255,183,78,0.35)" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  image: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#1A201D" },
  cardCopy: { flex: 1, minWidth: 0 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  meta: { color: "#AAB4AF", marginTop: 3, fontSize: 12 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#1A1F1D" },
  statusFlagged: { backgroundColor: "rgba(255,197,67,0.18)" },
  statusText: { color: "#DCEFE4", fontSize: 11, fontWeight: "900" },
  statusTextFlagged: { color: "#08110D" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
  detailLabel: { color: "#7F8B86", fontSize: 12, flexShrink: 0 },
  detailValue: { color: "#DCEFE4", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  description: { color: "#D8DEDA", marginTop: 10, lineHeight: 18, fontSize: 12 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#171D1A", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  actionButtonWarning: { backgroundColor: "rgba(255,197,67,0.18)" },
  actionButtonText: { color: "#DCEFE4", fontSize: 12, fontWeight: "800" },
  actionButtonTextWarning: { color: "#08110D" },
  deleteButton: { borderColor: "rgba(255,92,92,0.25)" },
  deleteButtonText: { color: "#FFB9B3" },
});

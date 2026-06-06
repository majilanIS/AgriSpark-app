import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchProductById, placeSingleOrder, upsertCartItem } from "../../src/buyer/buyerService";

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = String(params.productId || "");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError("Missing product id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const row = await fetchProductById(productId);
      setProduct(row);
      setQuantity(1);
    } catch (loadError) {
      setError(loadError?.message || "Could not load product details.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      loadProduct();
    }, [loadProduct])
  );

  const maxQuantity = Number(product?.quantity || 1);
  const priceLabel = useMemo(() => product?.price_label || "ETB 0", [product]);

  const changeQuantity = useCallback((delta) => {
    setQuantity((current) => Math.min(maxQuantity, Math.max(1, current + delta)));
  }, [maxQuantity]);

  const handleAddToCart = useCallback(async () => {
    if (!product?.id || busy) return;

    try {
      setBusy(true);
      await upsertCartItem({ productId: product.id, quantity });
      Alert.alert("Added to cart", `${product.name} was added to your cart.`);
    } catch (addError) {
      Alert.alert("Cart error", addError?.message || "Could not add this product.");
    } finally {
      setBusy(false);
    }
  }, [busy, product, quantity]);

  const handleBuyNow = useCallback(async () => {
    if (!product?.id || busy) return;

    if (quantity > maxQuantity) {
      Alert.alert("Quantity unavailable", "The selected quantity exceeds current stock.");
      return;
    }

    try {
      setBusy(true);
      await placeSingleOrder({ productId: product.id, quantity });
      Alert.alert("Order placed", "Your order was created successfully.");
      router.replace("/buyer/orders");
    } catch (orderError) {
      Alert.alert("Checkout failed", orderError?.message || "Could not create this order.");
    } finally {
      setBusy(false);
    }
  }, [busy, maxQuantity, product, quantity, router]);

  if (loading) {
    return (
      <View style={styles.screen}>
          <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2DE083" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.screen}>
          <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Product not available</Text>
          <Text style={styles.stateCopy}>{error || "We could not find that product."}</Text>
          <Pressable style={styles.stateButton} onPress={() => router.back()}>
            <Text style={styles.stateButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const remainingStock = Number(product.quantity || 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: product.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }} style={styles.image} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#F4F2EC" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description || "Fresh harvest direct from the farm."}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="pricetag-outline" size={14} color="#D8F7E5" />
              <Text style={styles.metaText}>{product.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={14} color="#D8F7E5" />
              <Text style={styles.metaText}>{product.location || product.farmer_location || "Local farm"}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>{priceLabel}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={styles.infoValue}>{remainingStock} left</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Farmer</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{product.farmer_name}</Text>
            </View>
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepButton} onPress={() => changeQuantity(-1)}>
                <Ionicons name="remove" size={16} color="#F4F2EC" />
              </Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
              <Pressable style={[styles.stepButton, quantity >= remainingStock && styles.stepButtonDisabled]} onPress={() => changeQuantity(1)} disabled={quantity >= remainingStock}>
                <Ionicons name="add" size={16} color="#F4F2EC" />
              </Pressable>
            </View>
          </View>

          <Text style={styles.stockHint}>{quantity > remainingStock ? "Selected quantity exceeds stock." : `You can order up to ${remainingStock}.`}</Text>

          <View style={styles.actionRow}>
            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={handleAddToCart} disabled={busy}>
              <Ionicons name="bag-add-outline" size={16} color="#EAF7EF" />
              <Text style={styles.secondaryButtonText}>{busy ? "Working..." : "Add to cart"}</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleBuyNow} disabled={busy}>
              <Ionicons name="flash-outline" size={16} color="#08110D" />
              <Text style={styles.primaryButtonText}>{busy ? "Processing..." : "Buy now"}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FBF4",
  },
  content: {
    paddingBottom: 132,
  },
  hero: {
    height: 340,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  card: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 18,
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  name: {
    color: "#15351F",
    fontSize: 24,
    fontWeight: "900",
  },
  description: {
    color: "#98A6A1",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F8EE",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  metaText: {
    color: "#1E7A35",
    fontSize: 12,
    fontWeight: "700",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  infoCard: {
    flexGrow: 1,
    minWidth: "30%",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#F8FBF6",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  infoLabel: {
    color: "#7A8E81",
    fontSize: 11,
  },
  infoValue: {
    color: "#15351F",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "900",
  },
  quantityRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: "#15351F",
    fontSize: 16,
    fontWeight: "900",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8F7E5",
    borderWidth: 1,
    borderColor: "#CDEBD8",
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  quantity: {
    minWidth: 26,
    textAlign: "center",
    color: "#15351F",
    fontSize: 17,
    fontWeight: "900",
  },
  stockHint: {
    marginTop: 10,
    color: "#66796F",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8FBF6",
    borderWidth: 1,
    borderColor: "#DDE9D8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#D8F7E5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  primaryButtonText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  loadingCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#15351F",
    marginTop: 10,
    fontWeight: "700",
  },
  stateCard: {
    flex: 1,
    margin: 16,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  stateTitle: {
    color: "#15351F",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  stateCopy: {
    color: "#66796F",
    textAlign: "center",
    marginTop: 8,
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
});
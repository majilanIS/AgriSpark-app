import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  clearBuyerCart,
  fetchCartItems,
  placeOrdersFromCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../../src/buyer/buyerService";

const deliveryFee = 180;

function SkeletonItem() {
  return <View style={styles.skeletonItem} />;
}

export default function BuyerCartScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [busyItemId, setBusyItemId] = useState("");

  const loadCart = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const rows = await fetchCartItems();
      setItems(rows);
    } catch (loadError) {
      setError(loadError?.message || "Could not load your cart.");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0), [items]);
  const total = subtotal + (items.length ? deliveryFee : 0);
  const cartStats = useMemo(
    () => [
      { label: "Items", value: items.length },
      { label: "Subtotal", value: `ETB ${subtotal.toLocaleString()}` },
      { label: "Delivery", value: `ETB ${(items.length ? deliveryFee : 0).toLocaleString()}` },
    ],
    [items.length, subtotal]
  );

  const handleQuantity = useCallback(async (item, delta) => {
    const nextQuantity = Number(item.quantity || 1) + delta;

    try {
      setBusyItemId(String(item.id));

      if (nextQuantity <= 0) {
        await removeCartItem({ cartItemId: item.id });
        setItems((current) => current.filter((row) => row.id !== item.id));
        return;
      }

      await updateCartItemQuantity({ cartItemId: item.id, quantity: nextQuantity });
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                quantity: nextQuantity,
                subtotal: Number(row.price || 0) * nextQuantity,
                subtotal_label: `ETB ${(Number(row.price || 0) * nextQuantity).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
              }
            : row
        )
      );
    } catch (updateError) {
      Alert.alert("Cart error", updateError?.message || "Could not update this item.");
    } finally {
      setBusyItemId("");
    }
  }, []);

  const handleRemove = useCallback(async (item) => {
    try {
      setBusyItemId(String(item.id));
      await removeCartItem({ cartItemId: item.id });
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (removeError) {
      Alert.alert("Cart error", removeError?.message || "Could not remove this item.");
    } finally {
      setBusyItemId("");
    }
  }, []);

  const handleClear = useCallback(async () => {
    if (!items.length) return;

    try {
      await clearBuyerCart();
      setItems([]);
    } catch (clearError) {
      Alert.alert("Cart error", clearError?.message || "Could not clear your cart.");
    }
  }, [items.length]);

  const handlePlaceOrder = useCallback(async () => {
    if (!items.length || placingOrder) return;

    try {
      setPlacingOrder(true);
      const createdOrders = await placeOrdersFromCart();
      setItems([]);
      Alert.alert("Order placed", `Created ${createdOrders.length} order${createdOrders.length === 1 ? "" : "s"}.`);
      router.replace("/buyer/orders");
    } catch (checkoutError) {
      Alert.alert("Checkout failed", checkoutError?.message || "Could not place your order.");
    } finally {
      setPlacingOrder(false);
    }
  }, [items.length, placingOrder, router]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.product?.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }} style={styles.image} />

      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <View style={styles.cardCopy}>
            <Text style={styles.name} numberOfLines={1}>{item.product_name}</Text>
            <Text style={styles.meta} numberOfLines={1}>{item.farmer_name} · {item.location || "Local farm"}</Text>
            <Text style={styles.price}>{item.price_label}</Text>
          </View>

          <Pressable onPress={() => handleRemove(item)} style={({ pressed }) => [styles.removeButton, pressed && styles.buttonPressed]}>
            <Ionicons name="trash-outline" size={16} color="#FFB9B3" />
          </Pressable>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.stepper}>
            <Pressable onPress={() => handleQuantity(item, -1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.buttonPressed]} disabled={busyItemId === String(item.id)}>
              <Ionicons name="remove" size={15} color="#d8351c" />
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable onPress={() => handleQuantity(item, 1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.buttonPressed]} disabled={busyItemId === String(item.id)}>
              <Ionicons name="add" size={15} color="#34c50f" />
            </Pressable>
          </View>

          <Text style={styles.subtotal}>{item.subtotal_label}</Text>
        </View>
      </View>
    </View>
  );

  const emptyState = () => {
    if (loading) {
      return (
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Could not load cart</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.stateButton} onPress={loadCart}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons name="bag-handle-outline" size={28} color="#A6B0AC" />
        <Text style={styles.stateTitle}>Your cart is empty</Text>
        <Text style={styles.stateCopy}>Add products from the home page to build your order.</Text>
        <Pressable style={styles.stateButton} onPress={() => router.push("/buyer/home")}>
          <Text style={styles.stateButtonText}>Browse products</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="cart-outline" size={14} color="#D8F7E5" />
                <Text style={styles.heroBadgeText}>Ready to checkout</Text>
              </View>

              <Pressable style={styles.clearButton} onPress={handleClear}>
                <Ionicons name="trash-outline" size={15} color="#FFB9B3" />
                <Text style={styles.clearText}>Clear cart</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>Cart</Text>
            <Text style={styles.subtitle}>{items.length} item{items.length === 1 ? "" : "s"} ready for a fast checkout</Text>

            <View style={styles.statsRow}>
              {cartStats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={emptyState}
        ListFooterComponent={
          items.length ? (
            <View style={styles.summaryWrap}>
              <Text style={styles.sectionTitle}>Order summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryAccent} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>ETB {subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery fee</Text>
                  <Text style={styles.summaryValue}>ETB {(items.length ? deliveryFee : 0).toLocaleString()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>ETB {total.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.summaryNoteCard}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#D8F7E5" />
                <Text style={styles.summaryNoteText}>Secure checkout and order tracking are ready once you place the order.</Text>
              </View>

              <Pressable style={({ pressed }) => [styles.placeButton, (pressed || placingOrder) && styles.buttonPressed]} onPress={handlePlaceOrder} disabled={placingOrder}>
                {placingOrder ? <ActivityIndicator color="#08110D" /> : <Ionicons name="cash-outline" size={18} color="#08110D" />}
                <Text style={styles.placeButtonText}>{placingOrder ? "Placing order..." : "Place order"}</Text>
              </Pressable>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCart(); }} tintColor="#2DE083" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5FBF4",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 132,
  },
  header: {
    marginBottom: 14,
  },
  heroCard: {
    padding: 16,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(200, 158, 20, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
  },
  heroBadgeText: {
    color: "#8A6A00",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: "#15351F",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 14,
  },
  subtitle: {
    color: "#5F7668",
    marginTop: 4,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#F1F8EE",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  statValue: {
    color: "#15351F",
    fontSize: 15,
    fontWeight: "900",
  },
  statLabel: {
    color: "#5F7668",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#f55454",
    borderWidth: 1,
    borderColor: "#F0D1CD",
  },
  clearText: {
    color: "#fffafa",
    fontWeight: "500",
    fontSize: 12,
  },
  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    marginBottom: 12,
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
  },
  cardBody: {
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardCopy: {
    flex: 1,
  },
  name: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: "#6A7E71",
    marginTop: 4,
    fontSize: 12,
  },
  price: {
    color: "#1E7A35",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4F3",
    borderWidth: 1,
    borderColor: "#F0D1CD",
  },
  controlsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF6EA",
    borderWidth: 1,
    borderColor: "#D9E7D4",
  },
  quantity: {
    minWidth: 24,
    textAlign: "center",
    color: "#15351F",
    fontSize: 15,
    fontWeight: "900",
  },
  subtotal: {
    color: "#15351F",
    fontSize: 15,
    fontWeight: "900",
  },
  summaryWrap: {
    marginTop: 14,
  },
  sectionTitle: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  summaryCard: {
    position: "relative",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    padding: 16,
    overflow: "hidden",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  summaryAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#D4AF37",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    color: "#66796F",
    fontSize: 13,
  },
  summaryValue: {
    color: "#15351F",
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#DDE9D8",
    marginVertical: 10,
  },
  summaryNoteCard: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.14)",
  },
  summaryNoteText: {
    color: "#8A6A00",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  totalLabel: {
    color: "#15351F",
    fontSize: 17,
    fontWeight: "900",
  },
  totalValue: {
    color: "#1E7A35",
    fontSize: 17,
    fontWeight: "900",
  },
  placeButton: {
    marginTop: 14,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  placeButtonText: {
    color: "#2C2100",
    fontWeight: "900",
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  stateCard: {
    marginTop: 20,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
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
    backgroundColor: "#D4AF37",
  },
  stateButtonText: {
    color: "#2C2100",
    fontWeight: "900",
  },
  skeletonWrap: {
    gap: 12,
    marginTop: 14,
  },
  skeletonItem: {
    height: 250,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    opacity: 1,
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
});
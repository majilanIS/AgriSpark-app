import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, RefreshControl, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchBuyerOrders, fetchBuyerProfile, subscribeToBuyerOrders } from "../../src/buyer/buyerService";

const tabs = ["All", "Pending", "Accepted", "Rejected"];
const paymentMethods = [
  { id: "cash", label: "Cash on delivery", hint: "Pay when you receive the product" },
  { id: "mobile_money", label: "Mobile money", hint: "Simulated instant mobile payment" },
  { id: "bank_transfer", label: "Bank transfer", hint: "Simulated bank transfer" },
];

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [buyerId, setBuyerId] = useState("");
  const [paymentBatch, setPaymentBatch] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[1].id);
  const [paymentState, setPaymentState] = useState({});
  const [cardNumber, setCardNumber] = useState("");
  const [paymentStage, setPaymentStage] = useState("method");
  const paymentStorageKey = useMemo(() => (buyerId ? `agrispark-paid-orders:${buyerId}` : ""), [buyerId]);

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const profile = await fetchBuyerProfile();
      setBuyerId(String(profile.id));
      const rows = await fetchBuyerOrders();
      setOrders(rows);
    } catch (loadError) {
      setError(loadError?.message || "Could not load your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  useEffect(() => {
    if (!buyerId) return undefined;
    const unsubscribe = subscribeToBuyerOrders(buyerId, () => {
      loadOrders();
    });

    return unsubscribe;
  }, [buyerId, loadOrders]);

  useEffect(() => {
    if (!paymentStorageKey) return undefined;

    let cancelled = false;

    const loadPaidOrders = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(paymentStorageKey);
        if (cancelled) return;

        setPaymentState(storedValue ? JSON.parse(storedValue) : {});
      } catch {
        if (!cancelled) {
          setPaymentState({});
        }
      }
    };

    loadPaidOrders();

    return () => {
      cancelled = true;
    };
  }, [paymentStorageKey]);

  useEffect(() => {
    if (!paymentStorageKey) return;

    AsyncStorage.setItem(paymentStorageKey, JSON.stringify(paymentState)).catch(() => null);
  }, [paymentStorageKey, paymentState]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return orders;
    return orders.filter((order) => order.status === activeTab);
  }, [activeTab, orders]);

  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.rawStatus === "accepted"),
    [orders]
  );

  const unpaidAcceptedOrders = useMemo(
    () => acceptedOrders.filter((order) => !paymentState[String(order.id)]),
    [acceptedOrders, paymentState]
  );

  const visibleOrders = useMemo(() => {
    if (activeTab === "Accepted") return acceptedOrders;
    return filteredOrders.filter((order) => order.rawStatus !== "accepted");
  }, [acceptedOrders, activeTab, filteredOrders]);

  const paymentBatchTotal = useMemo(
    () => paymentBatch.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [paymentBatch]
  );

  const paymentBatchLabel = paymentBatch.length === 1 ? paymentBatch[0]?.product_name : `${paymentBatch.length} accepted orders`;

  const openPaymentSheet = useCallback(() => {
    if (!unpaidAcceptedOrders.length) return;

    setPaymentBatch(unpaidAcceptedOrders);
    setSelectedPaymentMethod((current) => paymentState[String(unpaidAcceptedOrders[0].id)]?.method || current);
    setCardNumber("");
    setPaymentStage("method");
  }, [paymentState, unpaidAcceptedOrders]);

  const closePaymentSheet = useCallback(() => {
    setPaymentBatch([]);
    setCardNumber("");
    setPaymentStage("method");
  }, []);

  const confirmMethodSelection = useCallback(() => {
    if (!paymentBatch.length) return;

    setPaymentStage("card");
  }, [paymentBatch.length]);

  const confirmPayment = useCallback(() => {
    if (!paymentBatch.length) return;

    const digitsOnly = cardNumber.replace(/\D/g, "");
    if (digitsOnly.length < 12) {
      setPaymentStage("card");
      return;
    }

    const method = paymentMethods.find((item) => item.id === selectedPaymentMethod) || paymentMethods[0];
    const paymentRecord = {
      status: "paid",
      method: method.label,
      cardLast4: digitsOnly.slice(-4),
      paidAt: new Date().toLocaleString(),
      batchCount: paymentBatch.length,
      batchTotal: paymentBatchTotal,
    };

    setPaymentState((current) => {
      const nextState = { ...current };

      paymentBatch.forEach((order) => {
        nextState[String(order.id)] = paymentRecord;
      });

      return nextState;
    });

    setPaymentBatch([]);
    setCardNumber("");
    setPaymentStage("method");
  }, [cardNumber, paymentBatch, paymentBatchTotal, selectedPaymentMethod]);

  const paymentSummaryFooter = useMemo(() => {
    const unpaidOrders = acceptedOrders.filter((order) => !paymentState[String(order.id)]);
    const paidOrders = acceptedOrders.filter((order) => paymentState[String(order.id)]);
    const total = unpaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    // const paidCount = paidOrders.length;
    const allPaid = unpaidOrders.length === 0;
    const hasAcceptedOrders = acceptedOrders.length > 0;

    return (
      <View style={styles.batchSummaryCard}>
        <View style={styles.batchSummaryHeader}>
          <View style={styles.batchSummaryCopyWrap}>
            <Text style={styles.batchSummaryTitle}>One payment for all accepted orders</Text>
            <Text style={styles.batchSummaryCopy}>
              {!hasAcceptedOrders
                ? "No accepted orders yet, so the current total is zero."
                : allPaid
                ? "All accepted products in this batch have been paid."
                : "These accepted products were placed together, so pay them together in one checkout."}
            </Text>
          </View>

          <View style={styles.batchSummaryAmountPill}>
            <Text style={styles.batchSummaryAmountLabel}>Total</Text>
            <Text style={styles.batchSummaryAmountValue}>ETB {total.toLocaleString()}</Text>
          </View>
        </View>

        {hasAcceptedOrders && unpaidOrders.length ? (
          <View style={styles.batchList}>
            {unpaidOrders.map((order) => (
              <View key={order.id} style={styles.batchListItem}>
                <View style={styles.batchListCopy}>
                  <Text style={styles.batchListName} numberOfLines={1}>{order.product_name}</Text>
                  <Text style={styles.batchListMeta}>{order.farmer_name} · Qty {order.quantity}</Text>
                </View>
                <Text style={styles.batchListTotal}>{order.total_label}</Text>
              </View>
            ))}
          </View>
        ) : !hasAcceptedOrders ? (
          <View style={styles.batchList}>
            <View style={styles.batchListItem}>
              <View style={styles.batchListCopy}>
                <Text style={styles.batchListName}>No accepted orders</Text>
                <Text style={styles.batchListMeta}>The batch total stays at zero until an order is accepted.</Text>
              </View>
              <Text style={styles.batchListTotal}>ETB 0</Text>
            </View>
          </View>
        ) : null}

        {hasAcceptedOrders && unpaidOrders.length ? (
          <Pressable style={styles.batchPayButton} onPress={openPaymentSheet}>
            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
            <Text style={styles.batchPayButtonText}>Pay in batch</Text>
          </Pressable>
        ) : hasAcceptedOrders ? (
          <View style={styles.paidBatchBadge}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#1E7A35" />
            <Text style={styles.paidBatchBadgeText}>Batch paid</Text>
          </View>
        ) : (
          <View style={styles.paidBatchBadge}>
            <Ionicons name="information-circle-outline" size={16} color="#1E7A35" />
            <Text style={styles.paidBatchBadgeText}>Waiting for accepted orders</Text>
          </View>
        )}
      </View>
    );
  }, [acceptedOrders, openPaymentSheet, paymentState]);

  const renderItem = ({ item }) => {
    const isAccepted = item.rawStatus === "accepted";
    const isPending = item.rawStatus === "pending";
    const isRejected = item.rawStatus === "rejected";
    const paymentInfo = paymentState[String(item.id)];
    const isPaid = Boolean(paymentInfo?.status === "paid");

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Image source={{ uri: item.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }} style={styles.image} />

          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>{item.product_name}</Text>
            <Text style={styles.meta} numberOfLines={1}>{item.farmer_name} · {item.location || "Local farm"}</Text>
            <Text style={styles.detail}>Qty {item.quantity}</Text>
            <Text style={styles.detail}>Total {item.total_label}</Text>
          </View>

          <View style={[styles.statusPill, isAccepted && styles.accepted, isPending && styles.pending, isRejected && styles.rejected]}>
            <Text style={[styles.statusText, isRejected && styles.rejectedText]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.orderDate}>{item.created_label}</Text>
            <Text style={styles.orderHint}>
              {isAccepted
                ? isPaid
                  ? `Paid in one batch via ${paymentInfo.method}`
                  : "Farmer accepted - payment is ready"
                : isPending
                  ? "Waiting for farmer response"
                  : "Order rejected"}
            </Text>
          </View>

          {isAccepted ? (
            <View style={styles.acceptedActions}>
              {isPaid ? (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#1E7A35" />
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              ) : (
                <View style={styles.batchBadge}>
                  <Ionicons name="receipt-outline" size={14} color="#1E7A35" />
                  <Text style={styles.batchBadgeText}>In payment batch</Text>
                </View>
              )}

              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/ChatPage",
                    params: {
                      role: "buyer",
                      orderId: String(item.id),
                      name: item.farmer_name,
                      product: item.product_name,
                      avatar: item.image_url || "https://i.pravatar.cc/150?img=12",
                    },
                  })
                }
              >
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#08110D" />
                <Text style={styles.primaryButtonText}>Chat</Text>
              </Pressable>
            </View>
          ) : isPending ? (
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Pending</Text>
            </View>
          ) : (
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Rejected</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const emptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2DE083" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Could not load orders</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.stateButton} onPress={loadOrders}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons name="receipt-outline" size={28} color="#A6B0AC" />
        <Text style={styles.stateTitle}>{activeTab === "All" ? "No orders yet" : `No ${activeTab.toLowerCase()} orders`}</Text>
        <Text style={styles.stateCopy}>{activeTab === "All" ? "Place an order from the cart to see it here." : "Try a different tab or place a new order."}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Orders</Text>

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
            </View>

            {paymentSummaryFooter}
          </View>
        }
        ListEmptyComponent={emptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor="#2DE083" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />

      <Modal visible={Boolean(paymentBatch.length)} transparent animationType="fade" onRequestClose={closePaymentSheet}>
        <Pressable style={styles.modalOverlay} onPress={closePaymentSheet}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose payment method</Text>
            <Text style={styles.modalSubtitle}>
              Simulated payment for <Text style={styles.modalStrong}>{paymentBatchLabel || "accepted orders"}</Text>
            </Text>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Amount to pay</Text>
              <Text style={styles.amountValue}>ETB {paymentBatchTotal.toLocaleString()}</Text>
              <Text style={styles.amountHint}>This single payment covers the whole accepted batch.</Text>
            </View>

            {paymentStage === "method" ? (
              <View style={styles.paymentMethodList}>
                {paymentMethods.map((method) => {
                  const active = selectedPaymentMethod === method.id;

                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                      style={[styles.paymentMethodItem, active && styles.paymentMethodItemActive]}
                    >
                      <View style={[styles.paymentRadio, active && styles.paymentRadioActive]}>
                        {active ? <View style={styles.paymentRadioDot} /> : null}
                      </View>
                      <View style={styles.paymentMethodCopy}>
                        <Text style={styles.paymentMethodTitle}>{method.label}</Text>
                        <Text style={styles.paymentMethodHint}>{method.hint}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>Enter card number</Text>
                <Text style={styles.cardSectionHint}>This is a simulation, so any 12 to 19 digit card number will work for the full batch.</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="number-pad"
                  maxLength={23}
                  style={styles.cardInput}
                />
                <View style={styles.cardPreviewRow}>
                  <Text style={styles.cardPreviewLabel}>Method</Text>
                  <Text style={styles.cardPreviewValue}>{paymentMethods.find((item) => item.id === selectedPaymentMethod)?.label || "Card"}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closePaymentSheet}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              {paymentStage === "method" ? (
                <Pressable style={styles.modalConfirmButton} onPress={confirmMethodSelection}>
                  <Text style={styles.modalConfirmText}>Continue</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.modalConfirmButton} onPress={confirmPayment}>
                  <Text style={styles.modalConfirmText}>Pay batch now</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FBF4",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 132,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: "#15351F",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  tabActive: {
    backgroundColor: "#D8F7E5",
    borderColor: "#D8F7E5",
  },
  tabText: {
    color: "#6A7E71",
    fontSize: 12,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#1E7A35",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#F1F8EE",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#15351F",
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: "#6A7E71",
    marginTop: 3,
    fontSize: 12,
  },
  detail: {
    color: "#4F6658",
    marginTop: 4,
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F1F8EE",
  },
  accepted: {
    backgroundColor: "#D8F7E5",
  },
  pending: {
    backgroundColor: "#F8EFC7",
  },
  rejected: {
    backgroundColor: "#F5DDDA",
  },
  statusText: {
    color: "#1E7A35",
    fontSize: 11,
    fontWeight: "900",
  },
  rejectedText: {
    color: "#B25546",
  },
  bottomRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#DDE9D8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  orderDate: {
    color: "#7A8E81",
    fontSize: 12,
    fontWeight: "700",
  },
  orderHint: {
    color: "#66796F",
    marginTop: 4,
    fontSize: 11,
  },
  primaryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#D8F7E5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  acceptedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  batchBadge: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#E9F8EE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "#CDEDD9",
  },
  batchBadgeText: {
    color: "#1E7A35",
    fontWeight: "900",
    fontSize: 12,
  },
  payButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#1E7A35",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  paidBadge: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#E6F8ED",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "#CDEDD9",
  },
  paidBadgeText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  batchSummaryCard: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  batchSummaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  batchSummaryCopyWrap: {
    flex: 1,
    minWidth: 0,
  },
  batchSummaryTitle: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "900",
  },
  batchSummaryCopy: {
    color: "#66796F",
    marginTop: 4,
    lineHeight: 18,
  },
  batchSummaryAmountPill: {
    minWidth: 112,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F1F8EE",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  batchSummaryAmountLabel: {
    color: "#7A8E81",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  batchSummaryAmountValue: {
    color: "#1E7A35",
    marginTop: 3,
    fontSize: 16,
    fontWeight: "900",
  },
  batchList: {
    gap: 10,
    marginBottom: 14,
  },
  batchListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F8FBF6",
    borderWidth: 1,
    borderColor: "#E2ECDD",
  },
  batchListCopy: {
    flex: 1,
    minWidth: 0,
  },
  batchListName: {
    color: "#15351F",
    fontWeight: "800",
    fontSize: 13,
  },
  batchListMeta: {
    color: "#7A8E81",
    marginTop: 2,
    fontSize: 11,
  },
  batchListTotal: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  batchPayButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1E7A35",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  batchPayButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  batchPaidSection: {
    marginTop: 12,
  },
  batchPaidSectionTitle: {
    color: "#7A8E81",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  paidBatchBadge: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#E6F8ED",
    borderWidth: 1,
    borderColor: "#CDEDD9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  paidBatchBadgeText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  secondaryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F8FBF6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#1E7A35",
    fontWeight: "800",
  },
  loadingCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#15351F",
    marginTop: 10,
    fontWeight: "700",
  },
  stateCard: {
    marginTop: 18,
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
    backgroundColor: "#D8F7E5",
  },
  stateButtonText: {
    color: "#1E7A35",
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 18, 12, 0.42)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#DDE9D8",
  },
  modalHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6E5D0",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: {
    color: "#15351F",
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: "#66796F",
    marginTop: 6,
    lineHeight: 18,
  },
  amountBox: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#F4FBF7",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  amountLabel: {
    color: "#6A7E71",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amountValue: {
    color: "#15351F",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  amountHint: {
    color: "#66796F",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  modalStrong: {
    color: "#1E7A35",
    fontWeight: "800",
  },
  paymentMethodList: {
    marginTop: 16,
    gap: 10,
  },
  paymentMethodItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  paymentMethodItemActive: {
    borderColor: "#1E7A35",
    backgroundColor: "#F1FBF5",
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#B7C8BC",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentRadioActive: {
    borderColor: "#1E7A35",
  },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#1E7A35",
  },
  paymentMethodCopy: {
    flex: 1,
  },
  paymentMethodTitle: {
    color: "#15351F",
    fontWeight: "800",
    fontSize: 14,
  },
  paymentMethodHint: {
    color: "#6A7E71",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  cardSection: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  cardSectionTitle: {
    color: "#15351F",
    fontSize: 14,
    fontWeight: "900",
  },
  cardSectionHint: {
    color: "#6A7E71",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  cardInput: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    backgroundColor: "#F8FBF6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#15351F",
    fontSize: 14,
    letterSpacing: 1.1,
  },
  cardPreviewRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardPreviewLabel: {
    color: "#6A7E71",
    fontSize: 11,
    fontWeight: "700",
  },
  cardPreviewValue: {
    color: "#15351F",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    flexShrink: 1,
  },
  modalActions: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modalCancelText: {
    color: "#15351F",
    fontWeight: "800",
  },
  modalConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E7A35",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchBuyerConversations, fetchBuyerProfile, subscribeToBuyerMessages, subscribeToBuyerOrders } from "../../src/buyer/buyerService";

export default function BuyerChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [buyerId, setBuyerId] = useState("");

  const loadChats = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const profile = await fetchBuyerProfile();
      setBuyerId(String(profile.id));
      const rows = await fetchBuyerConversations();
      setConversations(rows);
    } catch (loadError) {
      setError(loadError?.message || "Could not load your chats.");
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  useEffect(() => {
    if (!buyerId) return undefined;

    const unsubscribeOrders = subscribeToBuyerOrders(buyerId, () => {
      loadChats();
    });

    return unsubscribeOrders;
  }, [buyerId, loadChats]);

  useEffect(() => {
    if (!conversations.length) return undefined;

    const unsubscribers = conversations.map((conversation) =>
      subscribeToBuyerMessages(conversation.id, () => {
        loadChats();
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [conversations, loadChats]);

  const latestPreview = useMemo(() => conversations.slice(0, 1)[0]?.lastMessage || "", [conversations]);

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/ChatPage",
          params: {
            role: "buyer",
            orderId: String(item.id),
            name: item.name,
            product: item.product,
            partnerId: String(item.farmerId || ""),
            avatar: item.image || "https://i.pravatar.cc/150?img=12",
          },
        })
      }
    >
      <Image source={{ uri: item.image || "https://i.pravatar.cc/150?img=12" }} style={styles.avatar} />

      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.product} numberOfLines={1}>{item.product}</Text>
        <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
      </View>

      <View style={styles.metaCol}>
        <Text style={styles.time}>{item.time}</Text>
        <View style={styles.chatBadge}>
          <Text style={styles.chatBadgeText}>Chat</Text>
        </View>
      </View>
    </Pressable>
  );

  const emptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2DE083" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Could not load chats</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.stateButton} onPress={loadChats}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#A6B0AC" />
        <Text style={styles.stateTitle}>Chats unlock after orders are accepted</Text>
        <Text style={styles.stateCopy}>Once a farmer accepts your order, the conversation will appear here.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Chat</Text>
              <Text style={styles.subtitle}>{latestPreview ? `Latest: ${latestPreview}` : "Your accepted order conversations"}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={loading ? null : emptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
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
  },
  subtitle: {
    color: "#5F7668",
    marginTop: 4,
    fontSize: 13,
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F1F8EE",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#15351F",
    fontSize: 16,
    fontWeight: "900",
  },
  product: {
    color: "#6A7E71",
    marginTop: 3,
    fontSize: 12,
  },
  preview: {
    color: "#4F6658",
    marginTop: 6,
    fontSize: 13,
  },
  metaCol: {
    alignItems: "flex-end",
    gap: 8,
  },
  time: {
    color: "#7A8E81",
    fontSize: 11,
    fontWeight: "700",
  },
  chatBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#D8F7E5",
  },
  chatBadgeText: {
    color: "#1E7A35",
    fontSize: 11,
    fontWeight: "900",
  },
  loadingCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
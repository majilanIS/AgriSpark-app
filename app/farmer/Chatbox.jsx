import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchFarmerConversations, fetchFarmerProfile, subscribeToBuyerMessages } from "../../src/buyer/buyerService";

export default function FarmerChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [farmerId, setFarmerId] = useState("");

  const loadChats = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const profile = await fetchFarmerProfile();
      setFarmerId(String(profile.id || ""));
      const rows = await fetchFarmerConversations();
      setConversations(rows);
    } catch (loadError) {
      setError(loadError?.message || "Could not load farmer chats.");
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
    const activeThreads = conversations.filter((conversation) => conversation.canChat);
    if (!activeThreads.length) return undefined;

    const unsubscribers = activeThreads.map((conversation) =>
      subscribeToBuyerMessages(conversation.id, () => {
        loadChats();
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [conversations, loadChats]);

  const latestPreview = useMemo(() => conversations.slice(0, 1)[0]?.lastMessage || "", [conversations]);
  const activeConversations = useMemo(() => conversations.filter((conversation) => conversation.canChat), [conversations]);

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/ChatPage",
          params: {
            role: "farmer",
            orderId: String(item.id),
            name: item.name,
            product: item.product,
            partnerId: String(item.buyerId || ""),
            avatar: item.image || "https://i.pravatar.cc/150?img=17",
          },
        })
      }
    >
      <Image source={{ uri: item.image || "https://i.pravatar.cc/150?img=17" }} style={styles.avatar} />

      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.product} numberOfLines={1}>{item.product} · Order #{String(item.id).slice(0, 8)}</Text>
        <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
      </View>

      <View style={styles.metaCol}>
        <Text style={styles.time}>{item.time}</Text>
        <View style={[styles.statusBadge, item.canChat ? styles.statusAccepted : styles.statusPending]}>
          <Text style={styles.statusBadgeText}>{item.canChat ? "Accepted" : "Pending"}</Text>
        </View>
      </View>
    </Pressable>
  );

  const emptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2DE083" />
          <Text style={styles.loadingText}>Loading order chats...</Text>
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
        <Text style={styles.stateTitle}>No active order chats yet</Text>
        <Text style={styles.stateCopy}>Chats become active only after you accept a buyer order.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D0C" translucent={false} />

      <FlatList
        data={activeConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Order Chats</Text>
              <Text style={styles.subtitle}>{latestPreview ? `Latest: ${latestPreview}` : "Active chats from accepted orders"}</Text>
            </View>
            <Text style={styles.metaText}>{farmerId ? `Farmer: ${farmerId.slice(0, 8)}` : ""}</Text>
          </View>
        }
        ListEmptyComponent={emptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadChats(); }} tintColor="#2DE083" />}
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
  metaText: {
    color: "#7A8E81",
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
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
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusAccepted: {
    backgroundColor: "#D8F7E5",
  },
  statusPending: {
    backgroundColor: "#F8EFC7",
  },
  statusBadgeText: {
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
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B4D2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
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

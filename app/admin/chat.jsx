import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { deleteAdminChatThreadMessages, fetchAdminChatThread, fetchAdminChatUsers, sendAdminChatMessage } from "../../src/admin/adminService";

export default function AdminChat() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [thread, setThread] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setError("");
      const nextUsers = await fetchAdminChatUsers();
      setUsers(nextUsers);

      if (!selectedUserId) {
        const firstChatUser = nextUsers.find((user) => user.canChat) || nextUsers[0] || null;
        if (firstChatUser?.id) {
          setSelectedUserId(firstChatUser.id);
        }
      }
    } catch (loadError) {
      setError(loadError?.message || "Could not load chat users.");
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedUserId]);

  const loadThread = useCallback(
    async (userId) => {
      const selected = users.find((item) => item.id === userId);
      if (!selected?.latestOrderId) {
        setThread(null);
        setReceiverId("");
        return;
      }

      try {
        setLoadingThread(true);
        const nextThread = await fetchAdminChatThread({ orderId: selected.latestOrderId });
        setThread(nextThread);
        setReceiverId(nextThread.receiverOptions[0]?.value || "");
      } catch (loadError) {
        setError(loadError?.message || "Could not load chat thread.");
      } finally {
        setLoadingThread(false);
      }
    },
    [users]
  );

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  useFocusEffect(
    useCallback(() => {
      if (!selectedUserId) return undefined;
      loadThread(selectedUserId);
      return undefined;
    }, [loadThread, selectedUserId])
  );

  const selectedUser = useMemo(() => users.find((item) => item.id === selectedUserId) || null, [selectedUserId, users]);

  const selectUser = async (userId) => {
    setSelectedUserId(userId);
    const nextSelected = users.find((item) => item.id === userId);

    if (!nextSelected?.latestOrderId) {
      setThread(null);
      setReceiverId("");
      return;
    }

    try {
      setLoadingThread(true);
      const nextThread = await fetchAdminChatThread({ orderId: nextSelected.latestOrderId });
      setThread(nextThread);
      setReceiverId(nextThread.receiverOptions[0]?.value || "");
    } catch (loadError) {
      setError(loadError?.message || "Could not load chat thread.");
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSend = async () => {
    if (!thread?.order?.id) return;

    try {
      await sendAdminChatMessage({ orderId: thread.order.id, receiverId, message });
      setMessage("");
      const nextThread = await fetchAdminChatThread({ orderId: thread.order.id });
      setThread(nextThread);
    } catch (sendError) {
      Alert.alert("Unable to send message", sendError?.message || "Please try again.");
    }
  };

  const handleClearThread = () => {
    if (!thread?.order?.id) return;

    Alert.alert(
      "Clear chat thread",
      "This will remove all messages in the selected order thread for everyone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminChatThreadMessages({ orderId: thread.order.id });
              const nextThread = await fetchAdminChatThread({ orderId: thread.order.id });
              setThread(nextThread);
            } catch (clearError) {
              Alert.alert("Unable to clear thread", clearError?.message || "Please try again.");
            }
          },
        },
      ]
    );
  };

  const userCounts = useMemo(
    () => ({
      total: users.length,
      withChats: users.filter((item) => item.canChat).length,
      farmers: users.filter((item) => item.userType === "farmer").length,
      buyers: users.filter((item) => item.userType === "buyer").length,
    }),
    [users]
  );

  const renderMessage = (item) => {
    const mine = thread?.order?.buyer_id === item.sender_id && selectedUser?.userType === "buyer";
    const admin = item.sender_id !== thread?.buyer?.id && item.sender_id !== thread?.farmer?.id;

    return (
      <View key={item.id} style={[styles.messageBubble, admin && styles.messageAdmin, mine && styles.messageMine]}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.sub}>Admin can review order-linked chats, talk to the buyer or farmer, and clear bad or unnecessary conversations.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{userCounts.total}</Text><Text style={styles.summaryLabel}>Users</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{userCounts.withChats}</Text><Text style={styles.summaryLabel}>With chats</Text></View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{userCounts.farmers}</Text><Text style={styles.summaryLabel}>Farmers</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{userCounts.buyers}</Text><Text style={styles.summaryLabel}>Buyers</Text></View>
        </View>

        {loadingUsers ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2B7BF6" />
            <Text style={styles.stateText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFB9B3" />
            <Text style={styles.stateTitle}>Could not load chat</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={loadUsers} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Users</Text>
          <Text style={styles.sectionHint}>Pick a user to open the latest order chat linked to them.</Text>
          <View style={styles.userList}>
            {users.map((user) => {
              const active = user.id === selectedUserId;
              return (
                <Pressable key={user.id} style={[styles.userCard, active && styles.userCardActive]} onPress={() => selectUser(user.id)}>
                  <View style={styles.userAvatar}>
                    {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.userAvatarImage} /> : <Text style={styles.userAvatarText}>{user.name.split(" ").filter(Boolean).slice(0, 1).map((part) => part[0]?.toUpperCase()).join("") || "U"}</Text>}
                  </View>

                  <View style={styles.userCopy}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userMeta}>{user.userType} · {user.accountState}</Text>
                    <Text style={styles.userMeta}>{user.latestMessage}</Text>
                  </View>

                  <View style={styles.userRight}>
                    <Text style={styles.userThreadCount}>{user.threadCount} thread{user.threadCount === 1 ? "" : "s"}</Text>
                    <Text style={styles.userMeta}>{user.latestMessageAt ? new Date(user.latestMessageAt).toLocaleDateString() : "No chat"}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          {loadingThread ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#2B7BF6" />
              <Text style={styles.stateText}>Loading conversation...</Text>
            </View>
          ) : thread?.order ? (
            <>
              <View style={styles.threadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadTitle}>{thread.product?.name || "Order chat"}</Text>
                  <Text style={styles.threadSub}>{thread.buyer?.name || "Buyer"} ↔ {thread.farmer?.name || "Farmer"}</Text>
                  <Text style={styles.threadSub}>Order status: {thread.order.status}</Text>
                </View>
                <Pressable onPress={handleClearThread} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={14} color="#FFB9B3" />
                  <Text style={styles.clearButtonText}>Clear chat</Text>
                </Pressable>
              </View>

              <View style={styles.receiverRow}>
                <Text style={styles.receiverLabel}>Reply to</Text>
                <View style={styles.receiverChoices}>
                  {thread.receiverOptions.map((option) => {
                    const active = receiverId === option.value;
                    return (
                      <Pressable key={option.value} onPress={() => setReceiverId(option.value)} style={[styles.receiverChip, active && styles.receiverChipActive]}>
                        <Text style={[styles.receiverChipText, active && styles.receiverChipTextActive]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.messagesWrap}>
                {thread.messages.length ? thread.messages.map(renderMessage) : <Text style={styles.emptyText}>No messages yet in this thread.</Text>}
              </View>

              <View style={styles.composer}>
                <TextInput
                  placeholder="Type an admin message..."
                  placeholderTextColor="#6F7A74"
                  value={message}
                  onChangeText={setMessage}
                  style={styles.input}
                  multiline
                />
                <Pressable style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="send" size={14} color="#08110D" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.stateCard}>
              <Ionicons name="chatbubbles-outline" size={26} color="#AAB4AF" />
              <Text style={styles.stateTitle}>No thread available</Text>
              <Text style={styles.stateText}>This user does not yet have an order-linked chat in the current database structure.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080A09" },
  content: { padding: 18, paddingBottom: 120 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "900", marginBottom: 8 },
  sub: { color: "#AAB4AF", marginBottom: 14, lineHeight: 20 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, backgroundColor: "#0F1412", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  summaryValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  summaryLabel: { color: "#9DA9A3", marginTop: 6, fontSize: 12 },
  stateCard: { marginTop: 8, marginBottom: 12, borderRadius: 14, backgroundColor: "#0F1412", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  stateTitle: { color: "#F4F2EC", fontWeight: "900", marginTop: 8 },
  stateText: { color: "#9DA9A3", marginTop: 6, textAlign: "center", lineHeight: 18 },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#2B7BF6" },
  retryButtonText: { color: "#fff", fontWeight: "900" },
  sectionCard: { marginTop: 12, borderRadius: 14, padding: 14, backgroundColor: "#0F1412", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  sectionTitle: { color: "#F4F2EC", fontWeight: "900", fontSize: 16 },
  sectionHint: { color: "#9DA9A3", marginTop: 4, marginBottom: 12, fontSize: 12 },
  userList: { gap: 10 },

  userCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: "#3d5548", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  userCardActive: { borderColor: "rgba(45,224,131,0.28)" },
  userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#20312A", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImage: { width: 42, height: 42 },
  userAvatarText: { color: "#F4F2EC", fontWeight: "900" },
  userCopy: { flex: 1, minWidth: 0 },
  userName: { color: "#FFF", fontWeight: "900", fontSize: 14 },
  userMeta: { color: "#AAB4AF", marginTop: 3, fontSize: 11 },
  userRight: { alignItems: "flex-end" },
  userThreadCount: { color: "#F4F2EC", fontWeight: "800", fontSize: 12 },
  threadHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  threadTitle: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  threadSub: { color: "#AAB4AF", marginTop: 4, fontSize: 12 },
  clearButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(255,92,92,0.12)" },
  clearButtonText: { color: "#FFB9B3", fontWeight: "800", fontSize: 12 },
  receiverRow: { marginBottom: 12 },
  receiverLabel: { color: "#9DA9A3", fontSize: 12, marginBottom: 8 },
  receiverChoices: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  receiverChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#171D1A", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  receiverChipActive: { backgroundColor: "#E3F7EB", borderColor: "#E3F7EB" },
  receiverChipText: { color: "#D8DEDA", fontSize: 12, fontWeight: "800" },
  receiverChipTextActive: { color: "#08110D" },
  messagesWrap: { gap: 10, marginBottom: 12 },
  messageBubble: { alignSelf: "flex-start", maxWidth: "86%", backgroundColor: "#151B19", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  messageAdmin: { backgroundColor: "rgba(43,123,246,0.12)", alignSelf: "flex-end", borderColor: "rgba(43,123,246,0.2)" },
  messageMine: { backgroundColor: "rgba(45,224,131,0.12)", borderColor: "rgba(45,224,131,0.2)" },
  messageText: { color: "#F4F2EC", lineHeight: 18 },
  messageTime: { color: "#8F9A95", marginTop: 6, fontSize: 10 },
  emptyText: { color: "#9DA9A3", fontStyle: "italic" },
  composer: { gap: 10 },
  input: { minHeight: 76, borderRadius: 14, backgroundColor: "#111814", color: "#F4F2EC", paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  sendButton: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#E3F7EB" },
  sendButtonText: { color: "#08110D", fontWeight: "900" },
});

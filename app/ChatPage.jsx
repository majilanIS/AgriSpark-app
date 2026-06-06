import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchChatThread, sendChatMessage, subscribeToBuyerMessages } from "../src/buyer/buyerService";
import StatusBarTop from "./components/StatusBarTop";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatChatTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || "");
  const role = String(params.role || "buyer").toLowerCase();
  const partnerId = String(params.partnerId || "");
  const scrollViewRef = useRef(null);
  const sendLockRef = useRef(false);
  const lastSentRef = useRef({ text: "", ts: 0 });

  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  const loadThread = useCallback(async ({ silent = false } = {}) => {
    try {
      setError("");
      if (!silent) setLoading(true);
      const data = await fetchChatThread(orderId, role);
      setThread(data);
    } catch (loadError) {
      setError(loadError?.message || "Could not load chat.");
      setThread(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, role]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (!orderId) return undefined;

    const unsubscribe = subscribeToBuyerMessages(orderId, () => {
      loadThread({ silent: true });
    });

    return unsubscribe;
  }, [loadThread, orderId]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [thread?.messages?.length]);

  const contactName = thread?.participantName || params.name || (role === "farmer" ? "Buyer" : "Farmer");
  const productName = thread?.product?.name || params.product || "Product";
  const avatar = thread?.product?.image_url || params.avatar || "https://i.pravatar.cc/150?img=12";
  const canChat = Boolean(thread?.canChat);

  const groupedMessages = useMemo(
    () => {
      const dedupedRows = [];
      const seen = new Set();

      (thread?.messages || []).forEach((row) => {
        const key = String(row?.id || `${row?.sender_id}-${row?.created_at}-${row?.message}`);
        if (seen.has(key)) return;
        seen.add(key);
        dedupedRows.push(row);
      });

      return dedupedRows.map((row) => ({
        id: row.id || `${row?.sender_id}-${row?.created_at}-${row?.message}`,
        senderId: String(row.sender_id),
        text: row.message,
        time: formatChatTime(row.created_at),
      }));
    },
    [thread?.messages]
  );

  const selfId = useMemo(() => String(thread?.selfId || ""), [thread?.selfId]);
  const participantId = useMemo(() => String(thread?.participantId || ""), [thread?.participantId]);

  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !canChat || sending || !orderId) return;
    if (sendLockRef.current) return;

    const now = Date.now();
    const lastText = String(lastSentRef.current.text || "").trim().toLowerCase();
    const isRapidDuplicate = lastText === text.toLowerCase() && now - Number(lastSentRef.current.ts || 0) < 1500;
    if (isRapidDuplicate) return;

    try {
      sendLockRef.current = true;
      setSending(true);
      lastSentRef.current = { text, ts: now };
      await sendChatMessage({
        orderId,
        message: text,
        role,
        receiverId: participantId || partnerId || String(params.receiverId || ""),
      });
      setMessage("");
      await loadThread({ silent: true });
    } catch (sendError) {
      setError(sendError?.message || "Could not send message.");
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  }, [canChat, loadThread, message, orderId, params.receiverId, participantId, partnerId, role, sending]);

  if (error && !thread) {
    return (
      <View style={styles.screen}>
        <StatusBarTop backgroundColor="#101513" />
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={28} color="#FFB9B3" />
          <Text style={styles.stateTitle}>Chat unavailable</Text>
          <Text style={styles.stateCopy}>{error}</Text>
          <Pressable style={styles.stateButton} onPress={() => router.back()}>
            <Text style={styles.stateButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBarTop backgroundColor="#101513" />

      <View style={[styles.header, { paddingTop: (insets.top || 14) }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#F4F2EC" />
        </Pressable>

        <Image source={{ uri: avatar }} style={styles.avatar} />

        <View style={styles.headerCopy}>
          <Text style={styles.name}>{contactName}</Text>
          <Text style={styles.subtitle}>{productName}</Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{canChat ? "Active" : "Waiting"}</Text>
        </View>
      </View>

      <View style={styles.orderCard}>
        <Text style={styles.orderLabel}>Order chat</Text>
        <Text style={styles.orderTitle}>{productName}</Text>
        <Text style={styles.orderHint}>
          {canChat
            ? role === "farmer"
              ? "You can message the buyer for this accepted order."
              : "You can message the farmer now."
            : "This chat opens only after the farmer accepts the order."}
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} style={[styles.chatContainer, { paddingBottom: (insets.bottom || 16) }]} showsVerticalScrollIndicator={false}>
        {groupedMessages.length ? (
          groupedMessages.map((msg) => {
            const isMine = msg.senderId === selfId;

            return (
              <View key={msg.id} style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
                {!isMine ? <Image source={{ uri: avatar }} style={styles.messageAvatar} /> : null}
                <View style={[styles.bubble, isMine ? styles.buyerBubble : styles.farmerBubble]}>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#A6B0AC" />
            <Text style={styles.stateTitle}>{canChat ? "No messages yet" : "Chat locked"}</Text>
            <Text style={styles.stateCopy}>{canChat ? "Send the first message to the farmer." : "Wait for the order to be accepted before chatting."}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(12, insets.bottom || 12) }]}> 
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={canChat ? "Type a message..." : "Chat available after acceptance"}
          placeholderTextColor="#7C8A85"
          style={styles.input}
          editable={canChat}
          multiline
        />

        <Pressable style={({ pressed }) => [styles.sendButton, (pressed || sending || !canChat) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!canChat || sending}>
          <Ionicons name="send" size={16} color="#08110D" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#101513",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#131916",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#1A201D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A201D",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#F4F2EC",
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: "#8E9C97",
    marginTop: 2,
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(45,224,131,0.16)",
  },
  statusText: {
    color: "#D8F7E5",
    fontSize: 11,
    fontWeight: "900",
  },
  orderCard: {
    margin: 16,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#151B19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  orderLabel: {
    color: "#7E8C87",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderTitle: {
    color: "#F4F2EC",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  orderHint: {
    color: "#97A6A1",
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buyerBubble: {
    backgroundColor: "#E3F7EB",
  },
  farmerBubble: {
    backgroundColor: "#1A201D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  messageText: {
    color: "#102118",
    fontSize: 14,
    lineHeight: 19,
  },
  messageTime: {
    color: "#77827E",
    marginTop: 6,
    fontSize: 11,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 16,
    backgroundColor: "#131916",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 16,
    backgroundColor: "#1A201D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    color: "#F4F2EC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2DE083",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  stateCard: {
    flex: 1,
    margin: 16,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151B19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptyChat: {
    marginTop: 24,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151B19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  stateTitle: {
    color: "#F4F2EC",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  stateCopy: {
    color: "#96A29D",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  stateButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2DE083",
  },
  stateButtonText: {
    color: "#08110D",
    fontWeight: "900",
  },
});
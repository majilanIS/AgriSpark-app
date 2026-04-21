import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

export default function FarmerChatScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }
    router.replace("/login-register?mode=login");
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Farmer Chat</Text>
      <Text style={styles.subtitle}>Chat and buyer inquiries will appear here.</Text>
      <View style={styles.chatPlaceholder}>
        <Text style={styles.chatPlaceholderText}>No conversations yet.</Text>
      </View>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#F5F9F2" },
  title: { fontSize: 24, fontWeight: "800", color: "#1B5E20" },
  subtitle: { marginTop: 8, color: "#45684E" },
  chatPlaceholder: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E8D8",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  chatPlaceholderText: {
    color: "#53725D",
    fontWeight: "600",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#1E7A35",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "800" },
});

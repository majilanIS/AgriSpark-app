import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

export default function FarmerProfileScreen() {
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
      <Text style={styles.title}>Farmer Profile</Text>
      <Text style={styles.subtitle}>Profile content for farmers.</Text>
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
  button: {
    marginTop: 16,
    backgroundColor: "#1E7A35",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "800" },
});

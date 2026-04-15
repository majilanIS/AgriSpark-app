import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { testConnection } from "../lib/supabase_test";

export default function SupabaseTestScreen() {
  const [status, setStatus] = useState("Not tested");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setDetails("");

    const result = await testConnection();

    setStatus(result.ok ? "CONNECTED" : "FAILED");
    setDetails(result.message || "No message");
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Supabase Connection Test</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={[styles.status, status === "CONNECTED" ? styles.ok : status === "FAILED" ? styles.fail : null]}>
          {status}
        </Text>

        <Text style={styles.label}>Details</Text>
        <Text style={styles.details}>{details || "Tap the button to test."}</Text>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Testing..." : "Run Connection Test"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7FBF4",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
  },
  label: {
    marginTop: 6,
    fontWeight: "700",
    color: "#2C4331",
  },
  status: {
    fontSize: 16,
    fontWeight: "800",
    color: "#384A3D",
  },
  ok: {
    color: "#1E7A35",
  },
  fail: {
    color: "#B00020",
  },
  details: {
    color: "#3E5D47",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#1E7A35",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});

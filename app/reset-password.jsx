import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";

const ResetPasswordScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Missing email", "Enter the email address for your account.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: "agrispark://new-password",
      });

      if (error) {
        Alert.alert("Reset failed", error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "We sent a password reset link. Click the link in your email to set a new password."
      );
      router.back();
    } catch (err) {
      Alert.alert("Error", err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={20} color="#1E7A35" />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
        </View>

        <Text style={styles.subtitle}>
          Enter your email and we will send you a link to reset your password.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          style={styles.input}
          editable={!loading}
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} disabled={loading}>
          <Text style={styles.backText}>{loading ? "" : "Back to login"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7FBF4",
    padding: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E5F1E1",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
  },
  subtitle: {
    color: "#4B6352",
    lineHeight: 20,
  },
  label: {
    fontWeight: "700",
    color: "#2C4331",
    marginTop: 6,
  },
  input: {
    backgroundColor: "#F8FBF5",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    marginTop: 4,
    backgroundColor: "#1E7A35",
    borderRadius: 14,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "800",
  },
  backText: {
    textAlign: "center",
    color: "#1E7A35",
    fontWeight: "700",
    marginTop: 4,
  },
});

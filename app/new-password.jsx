import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";

export default function NewPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Check if user has a valid recovery session from the email link
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasValidSession(true);
        setChecking(false);
      }
    });

    const checkRecoverySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.log("Session error:", error);
        }

        if (!data?.session) {
          Alert.alert(
            "Waiting for reset session",
            "If you just opened the reset link, wait a moment for the app to finish loading."
          );
          return;
        }

        setHasValidSession(true);
      } catch (err) {
        console.error("Session check error:", err);
        Alert.alert("Error", "Could not verify your session.");
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(() => {
      checkRecoverySession();
    }, 1200);

    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please enter both passwords.");
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert("Weak password", "Password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert("Update failed", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Your password has been reset. Please log in with your new password."
      );

      // Clear all auth state and redirect to login
      await supabase.auth.signOut();
      router.replace("/login-register?mode=login");
    } catch (err) {
      Alert.alert("Error", err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Verifying your session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasValidSession) {
    return null; // Will redirect in useEffect
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1E7A35" />
          </Pressable>
          <Text style={styles.headerTitle}>Set New Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={24} color="#1E7A35" />
          </View>

          <Text style={styles.title}>Create a new password</Text>
          <Text style={styles.subtitle}>
            Enter a strong password to protect your account.
          </Text>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="Enter new password"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#8EA08D"
              />
            </Pressable>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="Confirm new password"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#8EA08D"
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Password"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelText}>
              {loading ? "" : "Cancel"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7FBF4",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#4B6352",
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#173C1D",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E5F1E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
  },
  subtitle: {
    color: "#4B6352",
    lineHeight: 20,
    fontSize: 14,
  },
  label: {
    fontWeight: "700",
    color: "#2C4331",
    marginTop: 4,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBF5",
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2C4331",
  },
  button: {
    marginTop: 8,
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
    fontSize: 16,
  },
  cancelText: {
    textAlign: "center",
    color: "#1E7A35",
    fontWeight: "700",
    paddingVertical: 12,
  },
});

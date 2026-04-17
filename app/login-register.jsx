import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabaseClient";

// ✅ Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginRegisterScreen() {
  const { mode: initialMode } = useLocalSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("farmer");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //data states entered by user
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resolveUserRole = async (userId, fallbackRole) => {
  const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    return data?.role || fallbackRole || "buyer";
  };

  const syncUserProfile = async (user) => {
    const meta = user.user_metadata || {};

    const profile = {
      id: user.id,
      full_name: meta.full_name || "",
      email: user.email,
      role: meta.role || "buyer",
      phone_number: meta.phone_number || "",
      business_name: meta.business_name || "",
      location: meta.location || "",
    };

    await supabase.from("users").upsert(profile);
  };

  // const redirectByRole = (resolvedRole) => {
  //   if (resolvedRole === "farmer") {
  //     router.replace("/farmer/home");
  //     return;
  //   }

  //   router.replace("/buyer/home");
  // };

  // ✅ Mode + Session check
  useEffect(() => {
    const normalizedMode = Array.isArray(initialMode)
      ? initialMode[0]
      : initialMode;
    const isAuthFormMode =
      normalizedMode === "login" || normalizedMode === "register";

    if (isAuthFormMode) {
      setMode(normalizedMode);
    }

    // Keep user on auth forms when they explicitly open login/register.
    // This prevents instant redirect from a previously cached session.
    // if (isAuthFormMode) {
    //   return;
    // }

    // const checkSession = async () => {
    //   const { data } = await supabase.auth.getSession();
    //   const user = data?.session?.user;

    //   if (user) {
    //     const resolvedRole = await resolveUserRole(user);
    //     redirectByRole(resolvedRole);
    //   }
    // };

    // checkSession();

  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange(async (_event, session) => {
  //     const user = session?.user;
  //     if (!user) return;

  //     const resolvedRole = await resolveUserRole(user);
  //     redirectByRole(resolvedRole);
  //   });

  //   return () => subscription.unsubscribe();
  }, [initialMode, router]);

  const handleRegister = async () => {
      if (!fullName || !registerEmail || !password || !confirmPassword) return;

      if (!emailRegex.test(registerEmail)) return;
      if (password.length < 6) return;
      if (password !== confirmPassword) return;
      setIsSubmitting(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email: registerEmail.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              phone_number: phoneNumber,
              business_name: businessName,
              location,
            },
          },
        });

        if (error) throw error;
        if (data?.user) {
          await syncUserProfile(data.user);
        }

        Alert.alert("Success", "Check your email to verify account.");
        setMode("login");
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

  // ✅ LOGIN
 const handleLogin = async () => {
    if (!loginIdentifier || !password) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) return;

      await syncUserProfile(user);

      const role = await resolveUserRole(user.id, user.user_metadata?.role);

      router.replace(role === "farmer" ? "/farmer/home" : "/buyer/home");
    } catch (err) {
      Alert.alert("Login failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <View style={styles.logoWrap}>
              <Ionicons name="leaf" size={20} color="#1E7A35" />
            </View>
            <Text style={styles.brandText}>AgriSpark</Text>
          </View>
          <Text style={styles.secureText}>Secure • Verified</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Image
            source={require("../assets/images/bruna-branco.jpg")}
            style={styles.heroImage}
          />
          <Text style={styles.heroTitle}>Welcome to AgriSpark</Text>
          <Text style={styles.heroSubtitle}>
            Connect directly with verified farmers and buyers.
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleRow}>
          <Text style={styles.sectionLabel}>Sign in as</Text>
          <View style={styles.rolePills}>
            <Pressable
              onPress={() => setRole("farmer")}
              style={[
                styles.rolePill,
                role === "farmer" && styles.rolePillActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "farmer" && styles.roleTextActive,
                ]}
              >
                Farmer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRole("buyer")}
              style={[
                styles.rolePill,
                role === "buyer" && styles.rolePillActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "buyer" && styles.roleTextActive,
                ]}
              >
                Buyer
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {mode === "register" ? (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                placeholder="+251 9XX XXX XXX"
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="example@gmail.com"
                style={styles.input}
                value={registerEmail}
                onChangeText={setRegisterEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>
                {role === "farmer" ? "Farm Name" : "Business Name"}
              </Text>
              <TextInput
                placeholder="Your name"
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                placeholder="Add location"
                style={styles.input}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#8EA08D"
                  />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Enter email"
                style={styles.input}
                value={loginIdentifier}
                onChangeText={setLoginIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Enter password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#8EA08D"
                  />
                </Pressable>
              </View>
            </>
          )}

          {/* Button */}
          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            disabled={isSubmitting}
            onPress={mode === "login" ? handleLogin : handleRegister}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : "Register"}
            </Text>
          </Pressable>
        </View>
        
        <View>
          <Pressable
            style={[styles.googleButton, isSubmitting && styles.disabledButton]}
            onPress={() => Alert.alert("Coming soon", "Google sign-in will be added soon.")}
            disabled={isSubmitting}
          >
            <Ionicons name="logo-google" size={18} color="#1E7A35" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>
        </View>

        <View>
          <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
            <Text style={{ textAlign: "center", marginTop: 14, color: "#1E7A35" }}>
              {mode === "login"
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </Text>
          </Pressable>
        </View>
        <View>
            <Pressable onPress={() => router.push("/reset-password")}>
              <Text style={{ textAlign: "center", marginTop: 14, color: "#1E7A35" }}>
                Forgot password? Reset here
              </Text>
            </Pressable>
        </View>
        {/* <View>
        <Text style={styles.supportText}>Need help? support@agrispark.co</Text>
        <Text>Full_Year.NOw()</Text>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ Styles unchanged
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FBF4" },
  content: { padding: 16, paddingBottom: 30 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoWrap: { backgroundColor: "#E5F1E1", borderRadius: 12, height: 34, width: 34, justifyContent: "center", alignItems: "center" },
  brandText: { fontSize: 22, fontWeight: "800", color: "#1B5E20" },
  secureText: { fontSize: 12, color: "#6A756B" },
  heroCard: { backgroundColor: "#fff", borderRadius: 20, marginTop: 16, padding: 14 },
  heroImage: { height: 180, borderRadius: 14, width: "100%" },
  heroTitle: { fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 10 },
  heroSubtitle: { textAlign: "center", marginTop: 6, color: "#4B6352" },
  roleRow: { marginTop: 16 },
  sectionLabel: { fontWeight: "700", marginBottom: 10 },
  rolePills: { flexDirection: "row", gap: 10 },
  rolePill: { flex: 1, padding: 10, borderRadius: 999, borderWidth: 1, borderColor: "#D7E5D2" },
  rolePillActive: { backgroundColor: "#E5F1E1", borderColor: "#1E7A35" },
  roleText: { textAlign: "center" },
  roleTextActive: { color: "#1E7A35", fontWeight: "700" },
  formCard: { backgroundColor: "#fff", borderRadius: 20, padding: 14, marginTop: 16 },
  inputLabel: { marginTop: 10, fontWeight: "700" },
  input: { backgroundColor: "#F8FBF5", borderRadius: 14, padding: 12, marginTop: 5 },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FBF5", borderRadius: 14, paddingHorizontal: 10, marginTop: 5 },
  passwordInput: { flex: 1, padding: 12 },
  primaryButton: { backgroundColor: "#1E7A35", padding: 14, borderRadius: 14, marginTop: 14 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  googleButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E5D2",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  googleButtonText: {
    color: "#1E7A35",
    textAlign: "center",
    fontWeight: "800",
  },
  footerFullWidthWrap: {
    marginTop: 8,
    marginHorizontal: -16,
    marginBottom: -30,
  },
  supportText: { textAlign: "center", marginTop: 16, marginBottom: 8, fontSize: 12, color: "#3E5D47" },
});
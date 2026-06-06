import { useEffect, useState, useRef} from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabaseClient";
import { blocksLogin } from "../src/admin/accountRules";

// ✅ Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

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


  const inputRef = useRef(null);
  const emailRedirectTo = Linking.createURL("/login-register", {
    queryParams: { mode: "login" },
  });

  const ensureFreshAuthState = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const hasSession = !!sessionData?.session;

    if (!hasSession) return;

    const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

    // This happens when a user was deleted in Supabase Auth but a stale token is still cached locally.
    if (authUserError || !authUserData?.user) {
      await supabase.auth.signOut();
    }
  };

  const resolveUserRole = async (userId, userEmail, fallbackRole) => {
    const normalizedEmail = cleanText(userEmail).toLowerCase();

    const { data: byId } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (byId?.role) {
      return byId.role;
    }

    if (normalizedEmail) {
      const { data: byEmail } = await supabase
        .from("users")
        .select("role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (byEmail?.role) {
        return byEmail.role;
      }
    }

    return fallbackRole || "buyer";
  };

 const syncUserProfile = async (user) => {
  const meta = user.user_metadata || {};

  const optionalBusinessName = cleanText(meta.business_name);
  const optionalLocation = cleanText(meta.location);

  const profile = {
    id: user.id,
    full_name: cleanText(meta.full_name),
    email: user.email,
    phone_number: cleanText(meta.phone_number),
    // Never mirror auth passwords into the public users table.
    password: null,
  };

  // Only include role when it's explicitly provided in the auth metadata.
  // This prevents accidentally overwriting an existing DB role (e.g. admin) with the default 'buyer'.
  if (meta.role) {
    profile.role = meta.role;
  }

  if (optionalBusinessName) {
    profile.business_name = optionalBusinessName;
  }

  if (optionalLocation) {
    profile.location = optionalLocation;
  }

  try {
    const normalizedEmail = cleanText(user.email).toLowerCase();

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .or(`id.eq.${user.id},email.eq.${normalizedEmail}`)
      .maybeSingle();

    if (error) throw error;

    if (!existingUser) {
      // When creating a new user record, ensure we include a role (default to buyer if missing)
      const insertProfile = { ...profile, role: profile.role || "buyer" };
      await supabase.from("users").insert(insertProfile);
    } else {
      // When updating an existing record, do not overwrite role unless provided.
      const updateProfile = { ...profile };
      if (!profile.role) delete updateProfile.role;
      await supabase.from("users").update(updateProfile).eq("id", user.id);
    }
  } catch (err) {
    console.log("Sync error:", err.message);
  }
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

    // Keep local auth state clean when returning to auth screens.
    ensureFreshAuthState();

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
      if (!fullName || !registerEmail || !password || !confirmPassword) {
          Alert.alert("Missing fields", "Please fill all required fields.");
          return;
        }

        if (!emailRegex.test(registerEmail)) {
          Alert.alert("Invalid email", "Enter a valid email address.");
          return;
        }

        if (password.length < 6) {
          Alert.alert("Weak password", "Password must be at least 6 characters.");
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert("Mismatch", "Passwords do not match.");
          return;
        }

      if (password !== confirmPassword) return;
      setIsSubmitting(true);

      try {
        await ensureFreshAuthState();

        const normalizedEmail = registerEmail.trim().toLowerCase();

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo,
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

        const identityCount = data?.user?.identities?.length || 0;

        if (identityCount === 0) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: normalizedEmail,
            options: { emailRedirectTo },
          });

          if (resendError) throw resendError;

          Alert.alert(
            "Verification token sent",
            "This account already exists. A new confirmation token was sent to your email."
          );
          setMode("login");
          return;
        }

        if (data?.user) {
          await syncUserProfile(data.user);
        }

        Alert.alert("Success", "Check your email for the verification token.");
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
      await ensureFreshAuthState();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) return;

      await syncUserProfile(user);

      const role = (await resolveUserRole(user.id, user.email, user.user_metadata?.role))?.toLowerCase();

      if (blocksLogin(role)) {
        await supabase.auth.signOut();
        Alert.alert("Account restricted", "This account is inactive. Please contact the administrator.");
        return;
      }

      if (role === "farmer") {
        router.replace("/farmer/home");
      } else if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/buyer/home");
      }
    } catch (err) {
      Alert.alert("Login failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                placeholder="Enter your full name"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                placeholder="Enter your phone number"
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Enter your email address"
                style={styles.input}
                value={registerEmail}
                onChangeText={setRegisterEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>
                {role === "farmer" ? "Farm Name" : "Business Name"} (optional)
              </Text>
              <TextInput
                placeholder={role === "farmer" ? "Enter your farm name" : "Enter your business name"}
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="default"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Location (optional)</Text>
              <TextInput
                placeholder="Enter your city, town, or region"
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Create a password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="next"
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
                  placeholder="Confirm your password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="password"
                  returnKeyType="done"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Enter your email address"
                style={styles.input}
                value={loginIdentifier}
                onChangeText={setLoginIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Enter your password"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
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
            onPress={() => {
              if (mode === "login") {
                handleLogin();
              } else {
                handleRegister();
              }

              inputRef.current?.blur();
            }}
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
                Forgot password? Reset
              </Text>
            </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
  footerFullWidthWrap: {
    marginTop: 8,
    marginHorizontal: -16,
    marginBottom: -30,
  },
  supportText: { textAlign: "center", marginTop: 16, marginBottom: 8, fontSize: 12, color: "#3E5D47" },
});
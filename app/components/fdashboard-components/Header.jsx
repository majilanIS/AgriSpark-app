import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../lib/supabaseClient";

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "F";

  return value
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function Header({ role = "farmer" }) {
  const router = useRouter();
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const isBuyer = role === "buyer";
  const ordersRoute = isBuyer ? "/buyer/orders" : "/farmer/orders";
  const profileRoute = isBuyer ? "/buyer/profile" : "/Profile";

  const loadProfilePhoto = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (!authUser?.email) {
      setProfileImageUrl("");
      setFullName("");
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("full_name, profile_image_url")
      .eq("email", authUser.email.trim().toLowerCase())
      .maybeSingle();

    setProfileImageUrl(userRow?.profile_image_url || "");
    setFullName(userRow?.full_name || "");
  }, []);

  useEffect(() => {
    loadProfilePhoto();
  }, [loadProfilePhoto]);

  useFocusEffect(
    useCallback(() => {
      loadProfilePhoto();
    }, [loadProfilePhoto])
  );

  const initials = useMemo(() => getInitials(fullName), [fullName]);

  return (
    <View style={styles.container}>
      <View style={styles.brandWrap}>
        <Image source={require("../../../assets/images/logo-5.png")} style={styles.logo} />
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isBuyer ? "Open buyer orders" : "Open farmer orders"}
          onPress={() => router.push(ordersRoute)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={24} color="#2A2A2A" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push(profileRoute)}
          style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
        >
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileFallback}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDE3",
    height: 74,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 190,
  },
  logo: {
    width: 190,
    height: 190,
    resizeMode: "contain",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F2",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2554A",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3E6",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backfaceVisibility: "hidden",
  },
  profileFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDECDC",
  },
  profileInitials: {
    color: "#1F6E33",
    fontSize: 12,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.7,
  },
});
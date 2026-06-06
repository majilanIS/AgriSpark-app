import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../lib/supabaseClient";
import { fetchBuyerOrders, fetchFarmerOrders } from "../../../lib/orderService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function Header({ role = "farmer", profileImageUrl: propProfileImageUrl = "", fullName: propFullName = "", logo }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profileImageUrl, setProfileImageUrl] = useState(propProfileImageUrl || "");
  const [fullName, setFullName] = useState(propFullName || "");
  const [notificationCount, setNotificationCount] = useState(0);
  const isBuyer = role === "buyer";
  const ordersRoute = isBuyer ? "/buyer/orders" : "/farmer/orders";
  const quickActionRoute = isBuyer ? "/buyer/cart" : "/farmer/create";
  const quickActionIcon = isBuyer ? "bag-handle-outline" : "add-circle-outline";
  const dashboardLabel = isBuyer ? "Buyer Dashboard" : "Farmer Dashboard";
  const profileRoute = "/profile";

  const loadProfilePhoto = useCallback(async () => {
    try {
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
      setFullName(userRow?.full_name || authUser.user_metadata?.full_name || "");
    } catch {
      setProfileImageUrl("");
      setFullName("");
    }
  }, []);

  useEffect(() => {
    // If caller provided profile props, skip fetching from Supabase
    if (propProfileImageUrl || propFullName) return;
    loadProfilePhoto();
  }, [loadProfilePhoto, propProfileImageUrl, propFullName]);

  useFocusEffect(
    useCallback(() => {
      if (propProfileImageUrl || propFullName) return;
      loadProfilePhoto();
    }, [loadProfilePhoto, propProfileImageUrl, propFullName])
  );

  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const displayName = fullName || (isBuyer ? "Buyer" : "Farmer");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const loadNotificationCount = useCallback(async () => {
    try {
      const orders = isBuyer ? await fetchBuyerOrders() : await fetchFarmerOrders();
      const pendingCount = orders.filter((order) => String(order.rawStatus || "").toLowerCase() === "pending").length;
      setNotificationCount(pendingCount);
    } catch {
      setNotificationCount(0);
    }
  }, [isBuyer]);

  useEffect(() => {
    loadNotificationCount();

    const intervalId = setInterval(() => {
      loadNotificationCount();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadNotificationCount]);

  return (
    <View style={[styles.container, isBuyer ? styles.buyerContainer : styles.farmerContainer, { paddingTop: (insets.top || (Platform.OS === 'android' ? 0 : 0)) }]}>
      <View style={styles.titleWrap}>
        {logo ? <Image source={{ uri: logo }} style={styles.logo} /> : null}
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{dashboardLabel}</Text>
        </View>
      </View>

      <View style={styles.headerActions}>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isBuyer ? "Open buyer orders" : "Open farmer orders"}
          onPress={() => router.push(ordersRoute)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="receipt-outline" size={20} color="#F5F9F6" />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text>
            </View>
          ) : null}
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
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    minHeight: 94,
  },
  buyerContainer: {
    backgroundColor: "#1F7F4D",
  },
  farmerContainer: {
    backgroundColor: "#215634",
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  greeting: {
    color: "#DCEFE3",
    fontSize: 13,
    fontWeight: "500",
  },
  displayName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 2,
  },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  rolePillText: {
    color: "#ECF7EE",
    fontSize: 11,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 15,
    height: 15,
    borderRadius: 999,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2554A",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  profileButton: {
    width: 56,
    height: 56,
    marginTop: 4,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginBottom: 6,
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
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.7,
  },
});
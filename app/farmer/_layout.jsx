import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Pressable,
  View,
  Animated,
  Platform,
} from "react-native";
import Header from "../components/fdashboard-components/Header";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";

const iconByRoute = {
  home: "home",
  products: "basket",
  create: "add-circle",
  orders: "cart",
  Chatbox: "chatbubble-ellipses",
};

export default function FarmerTabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <Header role="farmer"/>,

        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: "#0F9D58",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,

        // 🔥 Press feedback
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: "#E8F5E9" }}
            style={({ pressed }) => [
              { flex: 1, opacity: pressed ? 0.6 : 1 },
            ]}
          />
        ),

        tabBarIcon: ({ color, focused }) => {
          if (route.name === "create") {
            return (
              <Pressable
                onPress={() => router.push("/farmer/create")}
                style={({ pressed }) => [
                  styles.fabWrap,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </Pressable>
            );
          }

          // 🔥 Animated icon
          const scale = useRef(new Animated.Value(1)).current;

          useEffect(() => {
            Animated.spring(scale, {
              toValue: focused ? 1.2 : 1,
              useNativeDriver: true,
            }).start();
          }, [focused]);

          const baseName = iconByRoute[route.name] || "ellipse";
          const iconName = focused
            ? baseName
            : `${baseName}-outline`;

          return (
            <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
              <Ionicons name={iconName} size={24} color={color} />
            </Animated.View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />

      <Tabs.Screen
        name="create"
        options={{ title: "" }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="Chatbox" options={{ title: "Chat" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: Platform.OS === "ios" ? 24 : 18,
    height: 72,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,

    // shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },

    // elevation (Android)
    elevation: 10,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },

  tabIcon: {
    marginBottom: 2,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  fabWrap: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F9D58",
    marginTop: -35,

    elevation: 12,
    shadowColor: "#0A7E3F",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
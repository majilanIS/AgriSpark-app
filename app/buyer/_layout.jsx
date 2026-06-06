import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Header from "../components/fdashboard-components/Header";

const iconByRoute = {
  home: "home",
  orders: "reader",
  cart: "cart",
  chatbot: "chatbubble-ellipses",
};

function AnimatedTabIcon({ routeName, focused, color }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const baseName = iconByRoute[routeName] || "ellipse";
  const iconName = focused ? baseName : `${baseName}-outline`;

  return (
    <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={28} color={color} />
        {routeName === "cart" ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function BuyerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <Header role="buyer" />,
        headerShown: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: "#1E7A35",
        tabBarInactiveTintColor: "#6A7E71",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: "#E4F8EB" }}
            style={({ pressed }) => [
              { flex: 1, opacity: pressed ? 0.65 : 1 },
            ]}
          />
        ),
        tabBarIcon: ({ color, focused }) => {
          return (
            <AnimatedTabIcon
              routeName={route.name}
              focused={focused}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="orders" options={{ title: "Order" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Chat" }} />
      <Tabs.Screen name="product-details" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 68,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    // borderTopColor: "#DDE9D8",
    // borderWidth: 1,
    // borderColor: "#E2ECDD",

    shadowColor: "#1B4D2B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },

    elevation: 16,
    // borderRadius: 24,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2554A",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});

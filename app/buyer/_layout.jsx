import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Header from "../components/fdashboard-components/Header";

const iconByRoute = {
  home: "home",
  orders: "cart",
  chatbot: "chatbubble-ellipses",
  profile: "person",
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
      <Ionicons name={iconName} size={24} color={color} />
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
        tabBarActiveTintColor: "#0E698C",
        tabBarInactiveTintColor: "#94A8B5",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: "#E8F3F8" }}
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
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 72,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },

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
});

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

const iconByRoute = {
  home: "home",
  products: "cube",
  create: "add-circle",
  orders: "cart",
  profile: "person",
};

export default function BuyerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#0E698C",
        tabBarInactiveTintColor: "#7892A0",
        tabBarStyle: {
          height: 74,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 8,
          borderTopColor: "#DCECF5",
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, focused }) => {
          const baseName = iconByRoute[route.name] || "ellipse";
          const iconName = focused ? baseName : `${baseName}-outline`;

          if (route.name === "create") {
            return (
              <View style={styles.fabWrap}>
                <Ionicons name="add" size={34} color="#FFFFFF" />
              </View>
            );
          }

          const iconColor = route.name === "orders" ? "#E55648" : color;
          return <Ionicons name={iconName} size={24} color={iconColor} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Chat" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0D4B6B",
  },
  headerActions: {
    flexDirection: "row",
    marginRight: 8,
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F8FC",
  },
  fabWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08A64A",
    marginTop: -28,
    shadowColor: "#0A7E3F",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

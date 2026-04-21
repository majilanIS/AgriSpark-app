import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Pressable } from "react-native";
import Header from "../components/fdashboard-components/Header";
import { useRouter } from "expo-router";

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
        header: () => <Header />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#1D7B36",
        tabBarInactiveTintColor: "#7A897B",
        tabBarActiveBackgroundColor: "#E8F5E9",

        tabBarStyle: {
          height: 74,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 8,
          borderTopColor: "#E5EDE3",
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
        },

        tabBarIcon: ({ color, focused }) => {
          // 🔥 FAB (Create Button)
          if (route.name === "create") {
            return (
              <Pressable
                onPress={() => router.push("/farmer/create")}
                style={({ pressed }) => [
                  styles.fabWrap,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Ionicons name="add" size={34} color="#FFFFFF" />
              </Pressable>
            );
          }

          const baseName = iconByRoute[route.name] || "ellipse";
          const iconName = focused ? baseName : `${baseName}-outline`;

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />

      {/* Create (Action Button, not real tab) */}
      <Tabs.Screen
        name="create"
        options={{ title: "Create" }}
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
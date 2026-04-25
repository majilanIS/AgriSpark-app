import { StyleSheet, Text, View } from "react-native";

export default function BuyerOrdersScreen() {
  return (
    <View style={styles.orderScreen}>
      <Text style={styles.title}>Buyer Orders</Text>
      <Text style={styles.subtitle}>Orders content for buyers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  orderScreen: { 
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0D4F70" },
  subtitle: { marginTop: 8, color: "#3F6D84" },
});

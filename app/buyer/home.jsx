import { StyleSheet, Text, View } from "react-native";

export default function BuyerHomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buyer Home</Text>
      <Text style={styles.subtitle}>Home content for buyers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#F3F8FB" },
  title: { fontSize: 24, fontWeight: "800", color: "#0D4F70" },
  subtitle: { marginTop: 8, color: "#3F6D84" },
});

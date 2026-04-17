import { StyleSheet, Text, View } from "react-native";

export default function FarmerProductsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Farmer Products</Text>
      <Text style={styles.subtitle}>Products content for farmers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#F5F9F2" },
  title: { fontSize: 24, fontWeight: "800", color: "#1B5E20" },
  subtitle: { marginTop: 8, color: "#45684E" },
});

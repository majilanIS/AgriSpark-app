import { StyleSheet, Text, View } from "react-native";

export default function LogoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logout</Text>
      <Text style={styles.text}>Implement secure sign out logic here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7FBF4",
    flex: 1,
    padding: 16,
  },
  title: {
    color: "#1B5E20",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#314D38",
    fontSize: 16,
  },
});

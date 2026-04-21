import { StyleSheet, Text, View } from "react-native";

export default function BuyerChatScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buyer Chat</Text>
      <Text style={styles.subtitle}>Talk with farmers and track replies here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F8FB",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0D4F70",
  },
  subtitle: {
    marginTop: 8,
    color: "#3F6D84",
    textAlign: "center",
  },
});

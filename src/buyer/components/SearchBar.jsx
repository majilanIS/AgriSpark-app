import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({ value, onChangeText, onSubmit, placeholder = "Search products" }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inputShell}>
        <Ionicons name="search" size={18} color="#7A8E81" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor="#7A8E81"
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      <Pressable onPress={onSubmit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Ionicons name="options-outline" size={18} color="#1E7A35" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDE9D8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: "#15351F",
    fontSize: 15,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#D8F7E5",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});

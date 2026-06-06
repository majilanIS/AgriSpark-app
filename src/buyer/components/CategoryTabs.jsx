import { ScrollView, Pressable, StyleSheet, Text } from "react-native";

export default function CategoryTabs({ categories, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const active = value === category;

        return (
          <Pressable key={category} onPress={() => onChange(category)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  tabActive: {
    backgroundColor: "#D8F7E5",
    borderColor: "#D8F7E5",
  },
  text: {
    color: "#6A7E71",
    fontSize: 13,
    fontWeight: "700",
  },
  textActive: {
    color: "#1E7A35",
  },
});

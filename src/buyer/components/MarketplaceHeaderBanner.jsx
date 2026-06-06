import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const bannerMeta = {
  newest: {
    title: "Newest arrivals",
    subtitle: "Fresh listings just added",
    icon: "sparkles-outline",
    tone: "#D8F7E5",
  },
  bulk: {
    title: "Bulk deals",
    subtitle: "Stock up with larger orders",
    icon: "cube-outline",
    tone: "#F8EFC7",
  },
  organic: {
    title: "Organic picks",
    subtitle: "Certified clean harvests",
    icon: "leaf-outline",
    tone: "#E7F4EA",
  },
};

export default function MarketplaceHeaderBanner({ sections = {}, onPressProduct }) {
  const banners = Object.entries(sections)
    .flatMap(([key, items]) => (items || []).slice(0, 1).map((item) => ({ ...item, key })))
    .slice(0, 3);

  if (!banners.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {banners.map((item) => {
        const meta = bannerMeta[item.key] || bannerMeta.newest;

        return (
          <Pressable key={`${item.key}-${item.id}`} onPress={() => onPressProduct?.(item)} style={styles.card}>
            <View style={[styles.imageWrap, { backgroundColor: meta.tone }]}>
              <Image source={{ uri: item.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }} style={styles.image} />
            </View>

            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Ionicons name={meta.icon} size={16} color="#EAF7EF" />
                <Text style={styles.title}>{meta.title}</Text>
              </View>
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>{item.price_label} · {item.location || item.farmer_location}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingVertical: 8,
  },
  card: {
    width: 228,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  imageWrap: {
    height: 110,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.95,
  },
  copy: {
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#1E7A35",
    fontSize: 13,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6A7E71",
    fontSize: 11,
    marginTop: 4,
  },
  name: {
    color: "#15351F",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  meta: {
    color: "#66796F",
    fontSize: 12,
    marginTop: 6,
  },
});

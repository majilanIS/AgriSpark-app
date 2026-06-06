import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProductCard({ product, onPress, onAddToCart }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [scale]);

  if (!product) return null;

  const badges = [product.is_organic ? "Organic" : null, product.is_bulk ? "Bulk" : null].filter(Boolean);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.setValue(0.98)}
        onPressOut={() => scale.setValue(1)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: product.image_url || "https://images.unsplash.com/photo-1464226184884-fa280b87c399" }}
            style={styles.image}
          />
          <View style={styles.badges}>
            {badges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{product.description || "Fresh harvest from a verified farmer."}</Text>

          <View style={styles.row}>
            <Ionicons name="location-outline" size={13} color="#8F9B97" />
            <Text style={styles.meta} numberOfLines={1}>{product.location || product.farmer_location || "Local farm"}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.price}>{product.price_label}</Text>
            <Text style={styles.stock}>{product.stock_label}</Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.farmerLabel}>Farmer</Text>
              <Text style={styles.farmerName} numberOfLines={1}>{product.farmer_name}</Text>
            </View>

            <Pressable onPress={onAddToCart} style={({ pressed }) => [styles.cartButton, pressed && styles.cartButtonPressed]}>
              <Ionicons name="bag-add-outline" size={16} color="#222" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECDD",
    marginBottom: 14,
    shadowColor: "#1B4D2B",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.96,
  },
  imageWrap: {
    height: 176,
    backgroundColor: "#F1F8EE",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badges: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#DDE9D8",
  },
  badgeText: {
    color: "#1E7A35",
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    padding: 14,
  },
  name: {
    color: "#15351F",
    fontSize: 16,
    fontWeight: "800",
  },
  desc: {
    color: "#66796F",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  meta: {
    color: "#6A7E71",
    fontSize: 12,
    flex: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  price: {
    color: "#1E7A35",
    fontSize: 16,
    fontWeight: "800",
  },
  stock: {
    color: "#7A8E81",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  farmerLabel: {
    color: "#7A8E81",
    fontSize: 11,
  },
  farmerName: {
    color: "#15351F",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 170,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8F7E5",
  },
  cartButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});

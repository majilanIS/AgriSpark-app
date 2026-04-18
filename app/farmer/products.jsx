import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";
import { DeleteProduct, EditProduct } from "../components/fdashboard-components/Delete_Edit";

const formatPrice = (value) => `ETB ${Number(value || 0).toFixed(2)}`;

const resolveImageUrl = (value) => {
  if (!value) return "";

  const v = value.trim();

  // If already full URL → return as is
  if (v.startsWith("http")) return v;

  // Clean path (remove leading slash + bucket name)
  const path = v.replace(/^\/|^product-images\//g, "");

  // Return public URL
  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
};

export default function FarmerProductsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (authError || !authUser?.email) {
      throw new Error("Please log in again.");
    }

    const normalizedEmail = authUser.email.trim().toLowerCase();
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow?.id) {
      throw new Error("User profile not found.");
    }

    if (userRow.role !== "farmer") {
      throw new Error("Only farmer accounts can access this page.");
    }

    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, name, category, description, price, quantity, location, image_url, created_at")
      .eq("farmer_id", userRow.id)
      .order("created_at", { ascending: false });

    if (productError) {
      throw productError;
    }

    const productsWithImage = await Promise.all(
      (productRows || []).map(async (item) => ({
        ...item,
        resolved_image_url: resolveImageUrl(item.image_url),
      }))
    );

    setProducts(productsWithImage);
  };

  const handleDeleteProduct = (productId) => {
    setProducts((currentProducts) => currentProducts.filter((item) => item.id !== productId));
  };

  const handleEditProduct = (product) => {
    if (!product?.id) return;

    router.push({
      pathname: "/farmer/create",
      params: { productId: String(product.id) },
    });
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      await fetchProducts();
    } catch (loadError) {
      console.log("[FarmerProducts] Load failed", loadError?.message || loadError);
      setError(loadError?.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchProducts();
    } catch (refreshError) {
      console.log("[FarmerProducts] Refresh failed", refreshError?.message || refreshError);
      setError(refreshError?.message || "Could not refresh products.");
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Farmer Products</Text>
      <Text style={styles.subtitle}>Your live product listings.</Text>

      {!!error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={18} color="#9A3A2A" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1E7A35" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No products yet.</Text>}
          renderItem={({ item }) => {
            const resolvedImageUrl = item.resolved_image_url;

            return (
              <View style={styles.card}>
                <View style={styles.cardImageWrap}>
                  {resolvedImageUrl ? (
                    <Image source={{ uri: resolvedImageUrl }} style={styles.image} />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Ionicons name="image-outline" size={20} color="#7DA58A" />
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDescription} numberOfLines={3}>
                    {item.description || "No description available."}
                  </Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                </View>

                <View style={styles.cardActions}>
                  <EditProduct product={item} onEdit={handleEditProduct} label="Edit" />
                  <DeleteProduct product={item} onDeleted={handleDeleteProduct} />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F9F2",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1B5E20",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 12,
    color: "#45684E",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFE9E4",
    borderWidth: 1,
    borderColor: "#F3C3B8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#9A3A2A",
    flex: 1,
    fontWeight: "600",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    color: "#45684E",
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
  },
  emptyText: {
    color: "#557765",
    marginTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    padding: 10,
    gap: 10,
  },
  cardImageWrap: {
    width: "100%",
  },
  image: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    backgroundColor: "#EAF4E8",
  },
  imageFallback: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    backgroundColor: "#EAF4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    gap: 4,
  },
  productName: {
    fontWeight: "800",
    color: "#1F3B2B",
    fontSize: 16,
  },
  productDescription: {
    color: "#5A7864",
    fontSize: 12,
    lineHeight: 18,
  },
  price: {
    marginTop: 2,
    color: "#1E7A35",
    fontWeight: "800",
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

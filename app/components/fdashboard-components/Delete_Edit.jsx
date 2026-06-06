import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabaseClient";

// -----------------------------
// DELETE PRODUCT
// -----------------------------
export function DeleteProduct({ product, productId, onDeleted, onError }) {
  const [loading, setLoading] = useState(false);
  const resolvedProductId = productId ?? product?.id;

  const handleDelete = () => {
    if (!resolvedProductId || loading) return;

    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);

            try {
              const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", resolvedProductId);

              if (error) throw error;

              onDeleted?.(resolvedProductId);
            } catch (err) {
              console.log("[DeleteProduct]", err.message);
              onError?.(err);
              Alert.alert("Error", err.message || "Delete failed");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles.deleteButton,
        pressed && styles.pressed,
      ]}
      onPress={handleDelete}
      disabled={loading}
    >
      <Ionicons name="trash-outline" size={16} color="#B42318" />
      <Text style={styles.deleteText}>
        {loading ? "Deleting..." : "Delete"}
      </Text>
    </Pressable>
  );
}

// -----------------------------
// EDIT PRODUCT
// -----------------------------
export function EditProduct({ product, onEdit }) {
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    if (!product || loading) return;

    setLoading(true);

    try {
      onEdit?.(product);
    } catch (err) {
      console.log("[EditProduct]", err.message);
      Alert.alert("Error", "Could not open edit form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles.editButton,
        pressed && styles.pressed,
      ]}
      onPress={handleEdit}
      disabled={loading}
    >
      <Ionicons name="create-outline" size={16} color="#1E7A35" />
      <Text style={styles.editText}>
        {loading ? "Opening..." : "Edit"}
      </Text>
    </Pressable>
  );
}

// -----------------------------
// COMBINED ACTIONS
// -----------------------------
export default function ProductActions({ product, onEdit, onDeleted, onError }) {
  return (
    <View style={styles.column}>
      <EditProduct product={product} onEdit={onEdit} />
      <DeleteProduct
        product={product}
        onDeleted={onDeleted}
        onError={onError}
      />
    </View>
  );
}

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
  column: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  button: {
    minWidth: 84,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: "#ECF8EF",
    borderColor: "#CFE8D5",
  },
  deleteButton: {
    backgroundColor: "#FFF1EE",
    borderColor: "#F4C7BE",
  },
  editText: {
    color: "#1E7A35",
    fontSize: 12,
    fontWeight: "800",
  },
  deleteText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
});
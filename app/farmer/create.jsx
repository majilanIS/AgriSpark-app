import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";
import {
  pickImageFromDevice,
  uploadImageToStorage,
  deleteImageFromStorage,
} from "../../utils/ImageUpload";

export default function FarmerCreateScreen() {
  const [category, setCategory] = useState("Vegetables");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [localImageUri, setLocalImageUri] = useState("");
  const [localImageName, setLocalImageName] = useState("");
  const [localImageBase64, setLocalImageBase64] = useState("");
  const [localImageMimeType, setLocalImageMimeType] = useState("image/jpeg");

  const [imageSource, setImageSource] = useState("url");
  const [saving, setSaving] = useState(false);

  const categories = ["Vegetables", "Fruits", "Grains", "Dairy", "Livestock"];

  const resolveFarmerId = async (authUser) => {
    const authEmail = authUser?.email?.trim().toLowerCase();

    if (!authEmail) {
      throw new Error("Authenticated user email is missing.");
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id, role, email")
      .eq("email", authEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow?.id) {
      throw new Error("User profile not found in users table.");
    }

    if (userRow.role !== "farmer") {
      throw new Error("Only farmer accounts can publish products.");
    }

    return userRow.id;
  };

  const checkDuplicateProduct = async ({ farmerId, name, category, location }) => {
    const { data: duplicateProduct, error } = await supabase
      .from("products")
      .select("id, name, category, location")
      .eq("farmer_id", farmerId)
      .ilike("name", name)
      .ilike("category", category)
      .ilike("location", location)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (duplicateProduct?.id) {
      throw new Error("This product already exists for your account.");
    }
  };

  // -----------------------------
  // PICK IMAGE
  // -----------------------------
  const handlePickImage = async () => {
    console.log("[CreateProduct] Picking image from device");
    const asset = await pickImageFromDevice();
    if (!asset) {
      console.log("[CreateProduct] No image selected");
      return;
    }

    setLocalImageUri(asset.uri);
    setLocalImageName(asset.fileName || `product-${Date.now()}.jpg`);
    setLocalImageBase64(asset.base64 || "");
    setLocalImageMimeType(asset.mimeType || "image/jpeg");
    console.log("[CreateProduct] Image stored in state", {
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setImageSource("upload");
    setImageUrl("");
  };

  // -----------------------------
  // SUBMIT PRODUCT
  // -----------------------------
  const handleSubmit = async () => {
    const name = productName.trim();
    const desc = description.trim();
    const loc = location.trim();
    const priceNum = Number(price);
    const qtyNum = Number(quantity);

    if (!name || !desc || !loc || isNaN(priceNum) || isNaN(qtyNum)) {
      console.log("[CreateProduct] Validation failed", { name, desc, loc, priceNum, qtyNum });
      Alert.alert("Invalid input", "Please fill all fields correctly.");
      return;
    }

    if (imageSource === "upload" && !localImageUri) {
      console.log("[CreateProduct] Upload mode selected but no image was chosen");
      Alert.alert("Image required", "Please select an image.");
      return;
    }

    console.log("[CreateProduct] Submit started", {
      imageSource,
      hasLocalImage: Boolean(localImageUri),
      hasUrlImage: Boolean(imageUrl.trim()),
    });

    setSaving(true);

    let uploadedFilePath = null;
    let finalImageUrl = imageUrl.trim();

    try {
      // -----------------------------
      // USER
      // -----------------------------
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError || !user) {
        console.log("[CreateProduct] No authenticated user found");
        throw new Error("Not logged in. Please sign in again.");
      }

      console.log("[CreateProduct] Authenticated user", { userId: user.id });

      const farmerId = await resolveFarmerId(user);
      console.log("[CreateProduct] Resolved farmer id", { farmerId });

      await checkDuplicateProduct({
        farmerId,
        name,
        category,
        location: loc,
      });

      console.log("[CreateProduct] Duplicate check passed");

      // -----------------------------
      // IMAGE UPLOAD
      // -----------------------------
      if (imageSource === "upload") {
        console.log("[CreateProduct] Uploading image");
        const uploadResult = await uploadImageToStorage({
          localImageBase64,
          mimeType: localImageMimeType,
          fileName: localImageName,
          ownerUserId: farmerId,
        });

        if (!uploadResult?.publicUrl || !uploadResult?.filePath) {
          throw new Error("Image upload did not return a valid file.");
        }

        finalImageUrl = uploadResult.publicUrl;
        uploadedFilePath = uploadResult.filePath;
        console.log("[CreateProduct] Image upload complete", uploadResult);
      }

      // -----------------------------
      // INSERT PRODUCT
      // -----------------------------
      const { error } = await supabase.from("products").insert({
        farmer_id: farmerId,
        name,
        category,
        description: desc,
        price: priceNum,
        quantity: qtyNum,
        location: loc,
        image_url: finalImageUrl,
      });

      if (error) {
        console.log("[CreateProduct] Product insert failed", error?.message || error);
        throw error;
      }

      console.log("[CreateProduct] Product published successfully");
      Alert.alert("Success", "Product published successfully!");

      // -----------------------------
      // RESET FORM
      // -----------------------------
      setProductName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setLocation("");
      setImageUrl("");
      setLocalImageUri("");
      setLocalImageName("");
      setLocalImageBase64("");
      setLocalImageMimeType("image/jpeg");
      setImageSource("url");
      setCategory("Vegetables");
    } catch (err) {
      console.log("[CreateProduct] Publish failed", err?.message || err);
      if (uploadedFilePath) {
        console.log("[CreateProduct] Cleanup rollback after failure");
        await deleteImageFromStorage({
          filePath: uploadedFilePath,
        });
      }

      const message = err?.message || "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.tag}>ADD PRODUCT</Text>
        <Text style={styles.title}>List your farm product in a few steps.</Text>
        <Text style={styles.subtitle}>
          Fill out the listing details, set your price, and publish a product buyers can discover.
        </Text>
      </View>

      {/* STEP 1 */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Ionicons name="create-outline" size={18} color="#1E7A35" />
          <Text style={styles.stepTitle}>Step 1: Product Basics</Text>
        </View>

        <TextInput
          placeholder="Product Name"
          value={productName}
          onChangeText={setProductName}
          style={styles.input}
        />

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>

      {/* STEP 2 */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Ionicons name="pricetag-outline" size={18} color="#1E7A35" />
          <Text style={styles.stepTitle}>Step 2: Stock & Pricing</Text>
        </View>

        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
        />
      </View>

      {/* STEP 3 */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Ionicons name="image-outline" size={18} color="#1E7A35" />
          <Text style={styles.stepTitle}>Step 3: Add Image</Text>
        </View>

        <View style={styles.pillRow}>
          <Pressable
            onPress={() => setImageSource("url")}
            style={[styles.pill, imageSource === "url" && styles.pillActive]}
          >
            <Text style={styles.pillText}>Paste URL</Text>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            style={[styles.pill, imageSource === "upload" && styles.pillActive]}
          >
            <Text style={styles.pillText}>Upload</Text>
          </Pressable>
        </View>

        {imageSource === "url" ? (
          <TextInput
            placeholder="Image URL"
            value={imageUrl}
            onChangeText={setImageUrl}
            style={styles.input}
          />
        ) : (
          <Pressable onPress={handlePickImage} style={styles.uploadCard}>
            <Text style={{ color: "#1E7A35", fontWeight: "700" }}>
              {localImageUri ? "Change Image" : "Choose Image"}
            </Text>
          </Pressable>
        )}

        <View style={styles.previewBox}>
          {localImageUri || imageUrl ? (
            <Image
              source={{ uri: imageSource === "upload" ? localImageUri : imageUrl }}
              style={styles.previewImage}
            />
          ) : (
            <Ionicons name="image-outline" size={24} color="#7DA58A" />
          )}
        </View>
      </View>

      {/* SUBMIT */}
      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>
          {saving ? "Saving..." : "Publish Product"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8F1",
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#143D23",
    borderRadius: 20,
    padding: 16,
  },
  tag: {
    color: "#D9F3E2",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 8,
    color: "#CDE3D3",
    lineHeight: 20,
  },
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E4EEE2",
    gap: 10,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E7F4E9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A3D2B",
  },
  label: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: "#294936",
  },
  input: {
    backgroundColor: "#F7FBF5",
    borderWidth: 1,
    borderColor: "#DCE8D8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#EDF5EA",
  },
  pillActive: {
    backgroundColor: "#1E7A35",
  },
  pillText: {
    color: "#316243",
    fontWeight: "700",
    fontSize: 12,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  uploadCard: {
    gap: 8,
    padding: 12,
    backgroundColor: "#F7FBF5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE8D8",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#EAF6ED",
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#1E7A35",
    fontWeight: "800",
    fontSize: 13,
  },
  uploadHint: {
    color: "#577064",
    fontSize: 12,
    lineHeight: 18,
  },
  previewBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CFE0D0",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FAFCF9",
    overflow: "hidden",
    minHeight: 140,
  },
  previewImage: {
    width: "100%",
    height: 110,
    borderRadius: 12,
  },
  previewText: {
    color: "#53725E",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1E7A35",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});

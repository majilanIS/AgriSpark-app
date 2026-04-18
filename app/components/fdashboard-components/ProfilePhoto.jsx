import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabaseClient";
import { pickImageFromDevice, uploadImageToStorage } from "../../../utils/ImageUpload";

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "F";
  return value
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function ProfilePhoto({ userId, fullName, photoUrl, onUpdated, style }) {
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const savePhotoUrl = async (nextUrl) => {
    if (!userId) {
      setModalVisible(false);
      return;
    }

    try {
      setUploading(true);

      const { error } = await supabase
        .from("users")
        .update({ profile_image_url: nextUrl || null })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      onUpdated?.(nextUrl || "");
    } catch (error) {
      console.log("[ProfilePhoto] Save failed", error?.message || error);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFromDevice = async () => {
    if (!userId) {
      setModalVisible(false);
      return;
    }

    try {
      setUploading(true);
      setModalVisible(false);

      const asset = await pickImageFromDevice();
      if (!asset?.base64) {
        setUploading(false);
        return;
      }

      const uploadResult = await uploadImageToStorage({
        localImageBase64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
        fileName: asset.fileName || `avatar-${userId}-${Date.now()}.jpg`,
        ownerUserId: userId,
      });

      const uploadedUrl = uploadResult?.publicUrl || "";
      if (!uploadedUrl) {
        throw new Error("Upload did not return a valid photo URL.");
      }

      await savePhotoUrl(uploadedUrl);
    } catch (error) {
      console.log("[ProfilePhoto] Upload failed", error?.message || error);
      setUploading(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.wrap, style, pressed && styles.pressed]}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.fallbackPhoto}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        <View style={styles.cameraBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Profile Photo</Text>
            <Text style={styles.modalSubtitle}>Upload or remove your profile photo.</Text>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.primaryButton]} onPress={handleUploadFromDevice}>
                <Text style={styles.primaryButtonText}>Upload Photo</Text>
              </Pressable>

              {photoUrl ? (
                <Pressable
                  style={[styles.modalButton, styles.dangerButton]}
                  onPress={() => {
                    setModalVisible(false);
                    savePhotoUrl("");
                  }}
                >
                  <Text style={styles.dangerButtonText}>Remove Photo</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Text>Add Your Biography</Text>
              <TextInput placeholder="Write something about yourself..." multiline style={{borderWidth:1, borderColor:"#ccc", borderRadius:8, padding:8, minHeight:80}} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    marginBottom: 10,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  fallbackPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#1E7A35",
    borderWidth: 2,
    borderColor: "#143D23",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3D2B",
  },
  modalSubtitle: {
    color: "#557765",
  },
  modalButtons: {
    gap: 8,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1E7A35",
  },
  secondaryButton: {
    backgroundColor: "#EDF5EA",
  },
  dangerButton: {
    backgroundColor: "#FFF1EE",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: "#294936",
    fontWeight: "700",
  },
  dangerButtonText: {
    color: "#B42318",
    fontWeight: "700",
  },
});
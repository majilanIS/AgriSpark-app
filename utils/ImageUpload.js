import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../lib/supabaseClient";

const BUCKET = "product-images";
const FOLDER = "products";

const normalizeDirUri = (dir) => {
  if (!dir) return null;
  return dir.endsWith("/") ? dir : `${dir}/`;
};

const getWritableBaseDir = () => {
  const legacyCache = normalizeDirUri(FileSystem.cacheDirectory);
  const legacyDocument = normalizeDirUri(FileSystem.documentDirectory);

  return legacyCache || legacyDocument || null;
};

/**
 * Convert local uri → blob (RELIABLE in React Native)
 */
const getUploadUrl = (bucket, filePath) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL");
  }

  return `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(filePath)}`;
};

const createTempFile = async (base64, fileName) => {
  if (!base64) {
    throw new Error("No image data was provided for upload");
  }

  const baseDir = getWritableBaseDir();

  if (!baseDir) {
    throw new Error("No writable file directory available");
  }

  try {
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  } catch {
    // Ignore if directory already exists or platform handles it implicitly.
  }

  const tempUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(tempUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return tempUri;
};

/**
 * Pick image
 */
export const pickImageFromDevice = async () => {
  console.log("[ImageUpload] Opening gallery picker");

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    console.log("[ImageUpload] Gallery permission denied");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) {
    console.log("[ImageUpload] Image picking canceled");
    return null;
  }

  console.log("[ImageUpload] Image selected", {
    uri: result.assets?.[0]?.uri,
    fileName: result.assets?.[0]?.fileName,
    mimeType: result.assets?.[0]?.mimeType,
  });
  return result.assets[0];
};

/**
 * Upload image (SAFE + NO network failure)
 */
export const uploadImageToStorage = async ({
  localImageBase64,
  mimeType = "image/jpeg",
  fileName,
  ownerUserId,
}) => {
  if (!localImageBase64) {
    console.log("[ImageUpload] Upload skipped: no base64 image data");
    return null;
  }

  console.log("[ImageUpload] Converting image and uploading", {
    fileName,
    mimeType,
  });

  const safeName = fileName || `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const ownerFolder = ownerUserId ? `${FOLDER}/${ownerUserId}` : FOLDER;
  const filePath = `${ownerFolder}/${safeName}`;
  const tempFileUri = await createTempFile(localImageBase64, safeName);
  const uploadUrl = getUploadUrl(BUCKET, filePath);
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseKey) {
    throw new Error("Missing Supabase publishable key");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    await FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => {});
    throw new Error("Not authenticated");
  }

  try {
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, tempFileUri, {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
    });

    console.log("[ImageUpload] Upload response", {
      status: uploadResult.status,
      body: uploadResult.body,
    });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(uploadResult.body || "Image upload failed");
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    console.log("[ImageUpload] Upload success", {
      filePath,
      publicUrl: data.publicUrl,
    });

    return {
      filePath,
      publicUrl: data.publicUrl,
    };
  } finally {
    await FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => {});
  }
};

/**
 * Delete image
 */
export const deleteImageFromStorage = async ({ filePath }) => {
  if (!filePath) return;

  console.log("[ImageUpload] Deleting uploaded image", { filePath });

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.log("[ImageUpload] Delete failed", error?.message || error);
    throw error;
  }

  console.log("[ImageUpload] Delete success", { filePath });
};
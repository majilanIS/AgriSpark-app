import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import ProfilePhoto from "./components/fdashboard-components/ProfilePhoto";

const statCard = ({ label, value, icon, tone }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: tone }]}>
      <Ionicons name={icon} size={18} color="#1B5E20" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function FarmerProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [bioDraft, setBioDraft] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);

  const loadProfile = async () => {
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (authError || !authUser?.email) {
      throw new Error("Please log in again.");
    }

    const normalizedEmail = authUser.email.trim().toLowerCase();
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userRow?.id) {
      throw new Error("Profile not found.");
    }

    if (userRow.role !== "farmer") {
      throw new Error("Only farmer accounts can view this page.");
    }

    const { count: productsTotal, error: productError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("farmer_id", userRow.id);

    if (productError) {
      throw productError;
    }

    const { count: ordersTotal, error: orderError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (orderError) {
      throw orderError;
    }

    setProfile(userRow);
    setBioDraft(userRow?.biography || "");
    setSavedBio(userRow?.biography || "");
    setProductCount(productsTotal || 0);
    setOrderCount(ordersTotal || 0);
  };

  const handleSaveBiography = async () => {
    if (!profile?.id) return;

    try {
      setBioSaving(true);

      const { error: saveError } = await supabase
        .from("users")
        .update({ biography: bioDraft.trim() || null })
        .eq("id", profile.id);

      if (saveError) {
        throw saveError;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              biography: bioDraft.trim() || null,
            }
          : current
      );
      setSavedBio(bioDraft.trim());
    } catch (saveBioError) {
      Alert.alert(
        "Biography",
        saveBioError?.message || "Could not save biography. Add `biography` column in users table if missing."
      );
    } finally {
      setBioSaving(false);
    }
  };

  useEffect(() => {
    setBioDraft(profile?.biography || "");
    setSavedBio(profile?.biography || "");
  }, [profile?.biography]);

  const runInitialLoad = async () => {
    try {
      setLoading(true);
      await loadProfile();
    } catch (loadError) {
      console.log("[FarmerProfile] Load failed", loadError?.message || loadError);
      setError(loadError?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProfile();
    } catch (refreshError) {
      console.log("[FarmerProfile] Refresh failed", refreshError?.message || refreshError);
      setError(refreshError?.message || "Could not refresh profile.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      Alert.alert("Logout failed", signOutError.message || "Could not log out.");
      return;
    }

    router.replace("/login-register?mode=login");
  };

  useFocusEffect(
    useCallback(() => {
      runInitialLoad();
    }, [])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.heroCard}>
        <ProfilePhoto
          userId={profile?.id}
          fullName={profile?.full_name}
          photoUrl={profile?.profile_image_url}
          onUpdated={(nextUrl) => {
            setProfile((current) =>
              current
                ? {
                    ...current,
                    profile_image_url: nextUrl || null,
                  }
                : current
            );
          }}
          style={styles.profilePhoto}
        />
        {/* <Text style={styles.tag}>FARMER PROFILE</Text> */}
        <Text style={styles.title}>{profile?.full_name || "Your farm account"}</Text>
        <Text style={styles.subtitle}>
          {profile?.location
            ? `${profile.location} • ${profile.role || "farmer"}`
            : profile?.role || "farmer account"}
        </Text>
      </View>

      {!!error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={18} color="#9A3A2A" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1E7A35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Summary</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Biography</Text>
              <TextInput
                value={bioDraft}
                onChangeText={(text) => {
                  setBioDraft(text);
                  if (text !== savedBio) {
                    setSavedBio((currentSavedBio) => currentSavedBio);
                  }
                }}
                style={styles.bioInput}
                placeholder="Tell buyers about your farm and produce"
                placeholderTextColor="#7A9A83"
                multiline
              />
            </View>

            {bioDraft.trim() === savedBio.trim() ? (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#1E7A35" />
                <Text style={styles.savedBadgeText}>Already saved</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.saveBioButton, bioSaving && styles.saveBioButtonDisabled]}
                onPress={handleSaveBiography}
                disabled={bioSaving}
              >
                <Text style={styles.saveBioButtonText}>{bioSaving ? "Saving..." : "Save Biography"}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.grid}>
            {statCard({ label: "Products", value: String(productCount), icon: "basket", tone: "#DFF4E5" })}
            {statCard({ label: "Orders", value: String(orderCount), icon: "cart", tone: "#E7F0FF" })}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{profile?.role || "farmer"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{profile?.location || "Not set"}</Text>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F9F2",
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#143D23",
    borderRadius: 22,
    padding: 18,
  },
  profilePhoto: {
    width: 150,
    height: 120,
    borderRadius: 22,
    alignSelf: "center",
    marginBottom: 12,
    backfaceVisibility: "hidden",
    backgroundColor: "transparent",
  },
  tag: {
    color: "#D9F3E2",
    fontSize: 11,
    fontWeight: "800",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3D2B",
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A3D2B",
  },
  statLabel: {
    color: "#5A7864",
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EFE2",
    padding: 14,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: "#6D8373",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    color: "#1A3D2B",
    fontSize: 14,
    fontWeight: "700",
  },
  bioInput: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: "#DCE8D8",
    backgroundColor: "#F7FBF5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#1A3D2B",
  },
  saveBioButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#1E7A35",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBioButtonDisabled: {
    opacity: 0.6,
  },
  saveBioButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#ECF8EF",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  savedBadgeText: {
    color: "#1E7A35",
    fontWeight: "800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#B42318",
    marginTop: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
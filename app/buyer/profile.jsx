import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { supabase } from "../../lib/supabaseClient";
import ProfilePhoto from "../components/fdashboard-components/ProfilePhoto";

export default function BuyerProfileScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
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

    if (userRow.role !== "buyer") {
      throw new Error("Only buyer accounts can view this page.");
    }

    setProfile(userRow);
    setBioDraft(userRow?.biography || "");
    setSavedBio(userRow?.biography || "");
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
      console.log("[BuyerProfile] Load failed", loadError?.message || loadError);
      setError(loadError?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
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
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgArtLayer}>
        <View style={[styles.bgOrb, styles.bgOrbTop]} />
        <View style={[styles.bgOrb, styles.bgOrbMid]} />
        <View style={[styles.bgOrb, styles.bgOrbBottom]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.title}>{profile?.full_name || "Your buyer account"}</Text>
          <Text style={styles.subtitle}>
            {profile?.location
              ? `${profile.location} • ${profile.role || "buyer"}`
              : profile?.role || "buyer account"}
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
            <ActivityIndicator size="small" color="#0E698C" />
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
                  onChangeText={setBioDraft}
                  style={styles.bioInput}
                  placeholder="Tell farmers what you usually buy and where you operate"
                  placeholderTextColor="#7A9AA6"
                  multiline
                />
              </View>

              {bioDraft.trim() === savedBio.trim() ? (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#0E698C" />
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

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{profile?.role || "buyer"}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF4FA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  bgArtLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  bgOrbTop: {
    width: 280,
    height: 280,
    top: -110,
    right: -90,
    backgroundColor: "rgba(78, 164, 205, 0.28)",
  },
  bgOrbMid: {
    width: 240,
    height: 240,
    top: 230,
    left: -130,
    backgroundColor: "rgba(18, 103, 140, 0.18)",
  },
  bgOrbBottom: {
    width: 320,
    height: 320,
    bottom: -160,
    right: -120,
    backgroundColor: "rgba(19, 144, 117, 0.14)",
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 14,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    backfaceVisibility: "hidden",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#1A3D2B",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "#45684E",
    lineHeight: 20,
    textAlign: "center",
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
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,220,232,0.9)",
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
    borderColor: "#D7E4EA",
    backgroundColor: "#F7FBFD",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#1A3D2B",
  },
  saveBioButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#0E698C",
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
    color: "#0E698C",
    fontWeight: "800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#b42424",
    marginTop: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

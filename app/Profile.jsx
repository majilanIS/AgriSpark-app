import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import ProfilePhoto from "./components/fdashboard-components/ProfilePhoto";

export default function ProfileScreen() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [profile, setProfile] = useState(null);
	const [bioDraft, setBioDraft] = useState("");
	const [savedBio, setSavedBio] = useState("");
	const [bioSaving, setBioSaving] = useState(false);

	const role = profile?.role || "account";
	const roleLabel = useMemo(() => {
		if (role === "buyer") return "buyer account";
		if (role === "farmer") return "farmer account";
		return "account";
	}, [role]);

	const bioPlaceholder = useMemo(() => {
		if (role === "buyer") return "Tell farmers what you usually buy and where you operate";
		if (role === "farmer") return "Tell buyers about your farm and produce";
		return "Tell people a bit about yourself";
	}, [role]);

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
			setError(loadError?.message || "Could not load profile.");
		} finally {
			setLoading(false);
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
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
				<Text style={styles.title}>{profile?.full_name || "Your account"}</Text>
				<Text style={styles.subtitle}>
					{profile?.location ? `${profile.location} • ${roleLabel}` : roleLabel}
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
					<View style={styles.infoCard}>
						<Text style={styles.infoLabel}>Biography</Text>
						<TextInput
							value={bioDraft}
							onChangeText={setBioDraft}
							style={styles.bioInput}
							placeholder={bioPlaceholder}
							placeholderTextColor="#7A9AA6"
							multiline
						/>

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
							<Text style={styles.infoValue}>{role}</Text>
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
		color: "#0E698C",
	},
	infoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4EFE2",
		padding: 14,
		gap: 10,
	},
	infoLabel: {
		fontWeight: "700",
		color: "#143D23",
		marginBottom: 6,
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	bioInput: {
		minHeight: 100,
		borderWidth: 1,
		borderColor: "#D9E8D8",
		borderRadius: 14,
		padding: 12,
		color: "#143D23",
		textAlignVertical: "top",
		backgroundColor: "#F7FBF5",
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
		fontWeight: "700",
	},
	saveBioButton: {
		backgroundColor: "#0E698C",
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
	},
	saveBioButtonDisabled: {
		opacity: 0.7,
	},
	saveBioButtonText: {
		color: "#FFFFFF",
		fontWeight: "800",
	},
	infoRow: {
		marginBottom: 6,
	},
	infoValue: {
		color: "#45684E",
		fontWeight: "600",
	},
	logoutButton: {
		marginTop: 4,
		backgroundColor: "#1E7A35",
		paddingVertical: 12,
		borderRadius: 12,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
	},
	logoutText: {
		color: "#FFFFFF",
		textAlign: "center",
		fontWeight: "800",
	},
});
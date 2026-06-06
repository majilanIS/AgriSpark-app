import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { Slot, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchAdminDashboardStats, fetchAdminProfile } from "../../src/admin/adminService";

export default function AdminLayout() {
	const router = useRouter();
	const drawerX = useRef(new Animated.Value(-320)).current;
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [profile, setProfile] = useState(null);
	const [stats, setStats] = useState(null);

	const loadShellData = useCallback(async () => {
		try {
			const [nextProfile, nextStats] = await Promise.all([fetchAdminProfile(), fetchAdminDashboardStats()]);
			setProfile(nextProfile);
			setStats(nextStats);
		} catch (loadError) {
			console.log("Admin shell load error:", loadError?.message || loadError);
		}
	}, []);

	useEffect(() => {
		loadShellData();
	}, [loadShellData]);

	useEffect(() => {
		Animated.timing(drawerX, {
			toValue: drawerOpen ? 0 : -320,
			duration: 220,
			useNativeDriver: true,
		}).start();
	}, [drawerOpen, drawerX]);

	const adminName = profile?.full_name || "Admin";
	const notifications = stats ? stats.notificationCount : 0;

	const menuItems = [
		{ label: "Dashboard", icon: "grid-outline", href: "/admin" },
		{ label: "Users", icon: "people-outline", href: "/admin/users" },
		{ label: "Products", icon: "basket-outline", href: "/admin/products" },
		{ label: "Orders", icon: "receipt-outline", href: "/admin/orders" },
		{ label: "Chat", icon: "chatbubbles-outline", href: "/admin/chat" },
		{ label: "Reports", icon: "document-text-outline", href: "/admin/reports" },
	];

	return (
		<View style={styles.screen}>
			<StatusBar barStyle="light-content" backgroundColor="#080A09" />
			<View style={styles.shellHeader}>
				<Pressable onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
					<Ionicons name="menu" size={26} color="#F4F2EC" />
				</Pressable>

				<View style={styles.shellTitleWrap}>
					<Text style={styles.shellTitle}>Admin Dashboard</Text>
					<Text style={styles.shellSubtitle}>Manage and monitor the entire system</Text>
				</View>

				<Pressable onPress={() => router.push("/admin/reports")} style={styles.notificationWrap}>
					<Ionicons name="notifications-outline" size={26} color="#D8DEDA" />
					<View style={styles.notificationBadge}>
						<Text style={styles.notificationBadgeText}>{notifications}</Text>
					</View>
				</Pressable>
			</View>

			{drawerOpen ? <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} /> : null}
			<Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
				<View style={styles.drawerTop}>
					<View style={styles.drawerAvatar}>
						<Text style={styles.drawerAvatarText}>{adminName.split(" ").filter(Boolean).slice(0, 1).map((part) => part[0]?.toUpperCase()).join("") || "A"}</Text>
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.drawerName}>{adminName}</Text>
						<Text style={styles.drawerRole}>{profile?.role || "admin"}</Text>
					</View>
					<Pressable onPress={() => setDrawerOpen(false)} style={styles.drawerClose}>
						<Ionicons name="close" size={22} color="#F4F2EC" />
					</Pressable>
				</View>

				<View style={styles.drawerSection}>
					{menuItems.map((item) => (
						<Pressable
							key={item.href}
							onPress={() => {
								setDrawerOpen(false);
								router.push(item.href);
							}}
							style={styles.drawerItem}
						>
							<Ionicons name={item.icon} size={18} color="#D8DEDA" />
							<Text style={styles.drawerItemText}>{item.label}</Text>
							<Ionicons name="chevron-forward" size={16} color="#7E8A84" />
						</Pressable>
					))}
				</View>

				<View style={styles.drawerFooter}>
					<Text style={styles.drawerFooterLabel}>Live notifications</Text>
					<Text style={styles.drawerFooterValue}>{notifications}</Text>
				</View>
			</Animated.View>
			<Slot />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#080A09" },
	shellHeader: { height: 76, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)", backgroundColor: "#080A09" },
	menuButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
	shellTitleWrap: { flex: 1, alignItems: "center" },
	shellTitle: { color: "#F4F2EC", fontSize: 18, fontWeight: "900" },
	shellSubtitle: { color: "#9DA9A3", fontSize: 11, marginTop: 2 },
	notificationWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
	notificationBadge: { position: "absolute", right: 0, top: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#FF3B30", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
	notificationBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
	backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 20 },
	drawer: { position: "absolute", left: 0, top: 0, bottom: 0, width: 300, backgroundColor: "#0F1412", borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.06)", paddingTop: 54, paddingHorizontal: 14, zIndex: 30, elevation: 20 },
	drawerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
	drawerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#20312A", alignItems: "center", justifyContent: "center" },
	drawerAvatarText: { color: "#F4F2EC", fontSize: 16, fontWeight: "900" },
	drawerName: { color: "#F4F2EC", fontWeight: "900", fontSize: 16 },
	drawerRole: { color: "#9DA9A3", fontSize: 12, marginTop: 2, textTransform: "capitalize" },
	drawerClose: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: "rgba(255,255,255,0.05)" },
	drawerSection: { gap: 8 },
	drawerItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)" },
	drawerItemText: { flex: 1, color: "#F4F2EC", fontWeight: "700" },
	drawerFooter: { marginTop: "auto", marginBottom: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	drawerFooterLabel: { color: "#9DA9A3", fontSize: 12 },
	drawerFooterValue: { color: "#F4F2EC", fontWeight: "900", fontSize: 16 },
});

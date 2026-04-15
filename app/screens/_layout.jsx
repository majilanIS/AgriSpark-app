import { Drawer } from "expo-router/drawer";

export default function ScreensLayout() {
	return (
		<Drawer
			screenOptions={{
				drawerActiveTintColor: "#1E7A35",
				drawerLabelStyle: { fontSize: 16, fontWeight: "600" },
				headerStyle: { backgroundColor: "#F3F8F0" },
				headerTintColor: "#1B5E20",
                headerShown: false,
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					drawerLabel: "Home",
					title: "AgriSpark",
					headerShown: false,
				}}
			/>
			<Drawer.Screen name="help" options={{ drawerLabel: "Help", title: "Help" }} />
			<Drawer.Screen
				name="settings"
				options={{ drawerLabel: "Settings", title: "Settings" }}
			/>
			<Drawer.Screen
				name="logout"
				options={{ drawerLabel: "Logout", title: "Logout" }}
			/>
		</Drawer>
	);
}

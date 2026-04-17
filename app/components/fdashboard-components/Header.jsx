import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({ onNotificationsPress, onMessagesPress }) {
	return (
		<View style={styles.container}>
			<View style={styles.leftGroup}>
				<View style={styles.actionsWrap}>
					<Pressable onPress={onNotificationsPress} style={styles.iconButton}>
						<Ionicons name="notifications-outline" size={20} color="#294936" />
					</Pressable>
				</View>

				<View style={styles.brandWrap}>
					<Image source={require("../../../assets/images/logo-5.png")} style={styles.logo} />
					{/* <Text style={styles.brandText}>AgriSpark</Text> */}
				</View>
			</View>

			<View style={styles.avatarWrap}>
			     <Ionicons name="person" size={16} color="#1C6E34" />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 8,
		// paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5EDE3",
	},
	leftGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	brandWrap: {
		flexDirection: "row",
		alignItems: "center",
		// gap: 8,
		marginLeft: 0,
	},
	avatarWrap: {
		width: 30,
		height: 30,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#E8F3E6",
	},
	brandText: {
		fontSize: 20,
		fontWeight: "800",
		color: "#1C6E34",
	},
	actionsWrap: {
		flexDirection: "row",
		gap: 4,
	},
	iconButton: {
		width: 34,
		height: 34,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F5FAF3",
	},
	logo: {
		width: 220,
		height: 68,
		resizeMode: "cover",
	},
});

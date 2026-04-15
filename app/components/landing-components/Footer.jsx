import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Footer = ({ compact = false }) => {
	return (
		<View style={[styles.wrapper, compact && styles.wrapperCompact]}>
			<View style={[styles.card, compact && styles.cardCompact]}>

				{/* Title */}
				<Text style={[styles.title, compact && styles.titleCompact]}>
					Grow with AgriSpark
				</Text>

				{/* Subtitle */}
				<Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
					Helping buyers and farmers connect directly with trusted profiles.
				</Text>

				{/* Contact */}
				<View style={styles.chipRow}>
					<View style={styles.chip}>
						<Ionicons name="mail-outline" size={14} color="#1E7A35" />
						<Text style={styles.chipText}>info@agrispark.com</Text>
					</View>

					<View style={styles.chip}>
						<Ionicons name="help-circle-outline" size={14} color="#1E7A35" />
						<Text style={styles.chipText}>FAQ</Text>
					</View>
				</View>

				{/* Social */}
				<View style={styles.socialRow}>
					<Ionicons name="logo-facebook" size={18} color="#203422" />
					<Ionicons name="logo-linkedin" size={18} color="#203422" />
					<Ionicons name="logo-instagram" size={18} color="#203422" />
				</View>

				{/* Divider */}
				<View style={styles.divider} />

				{/* Note */}
				<Text style={styles.note}>
					Privacy and terms apply. Secure transactions & verified profiles.
				</Text>

			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		width: "100%",
		backgroundColor: "#ECF6E8",
		padding: 2,
	},

	wrapperCompact: {
		padding: 3,
	},

	card: {
		backgroundColor: "#fff",
		paddingVertical: 3,
		paddingHorizontal: 14,
		borderColor: "#DCEAD6",
		alignItems: "center", 
	},

	cardCompact: {
		paddingVertical: 2,
	},

	title: {
		color: "#17301D",
		fontSize: 18,
		fontWeight: "800",
		textAlign: "center",
	},

	titleCompact: {
		fontSize: 16,
	},

	subtitle: {
		color: "#4B6352",
		fontSize: 12,
		textAlign: "center",
		marginTop: 1,
		lineHeight: 10,
	},

	subtitleCompact: {
		fontSize: 12,
	},

	chipRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
		marginTop: 4,
		width: "100%",
	},

	chip: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F3F8F0",
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 7,
		justifyContent: "center",
		minWidth: 0,
	},

	chipText: {
		color: "#22422B",
		fontSize: 11,
		fontWeight: "700",
		marginLeft: 5,
	},

	socialRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 18,
		marginTop: 3,
	},

	divider: {
		height: 1,
		backgroundColor: "#DCE8D7",
		width: "60%",
		marginVertical: 3,
	},

	note: {
		fontSize: 11,
		color: "#5A6E60",
		textAlign: "center",
	},
});

export default Footer;
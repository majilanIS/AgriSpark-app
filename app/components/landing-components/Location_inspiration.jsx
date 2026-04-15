import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LocationInspiration = () => {
	const pins = [
		{ city: "Bahir Dar", top: "24%", left: "20%" },
		{ city: "Adama", top: "48%", left: "56%" },
		{ city: "Hawassa", top: "68%", left: "52%" },
		{ city: "Mekelle", top: "14%", left: "66%" },
	];

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Connect Locally</Text>

			<View style={styles.mapCard}>
				<View style={styles.roadOne} />
				<View style={styles.roadTwo} />

				<View style={styles.tag}>
					<Text style={styles.tagTitle}>Ethiopia</Text>
					<Text style={styles.tagSubtitle}>Farmers + Buyers</Text>
				</View>

				{pins.map((pin) => (
					<View
						key={pin.city}
						style={[styles.pinWrap, { top: pin.top, left: pin.left }]}
					>
						<Ionicons name="location" size={18} color="#1E7A35" />
					</View>
				))}

				<View style={styles.mainPinWrap}>
					<Ionicons name="location" size={24} color="#0E6B2E" />
				</View>

				<View style={styles.stickyTip}>
					<Text style={styles.stickyTipTitle}>Addis Ababa</Text>
					<Text style={styles.stickyTipSub}>128 active farmers</Text>
				</View>
				<View style={styles.tipPointer} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		marginHorizontal: 16,
		marginTop: 16,
	},
	heading: {
		color: "#182F1C",
		fontSize: 24,
		fontWeight: "800",
		marginBottom: 10,
	},
	mapCard: {
		backgroundColor: "#D6E7D0",
		borderRadius: 14,
		minHeight: 190,
		overflow: "hidden",
		padding: 10,
	},
	roadOne: {
		backgroundColor: "rgba(255, 255, 255, 0.5)",
		borderRadius: 999,
		height: 8,
		left: "8%",
		position: "absolute",
		top: "56%",
		transform: [{ rotate: "-18deg" }],
		width: "80%",
	},
	roadTwo: {
		backgroundColor: "rgba(255, 255, 255, 0.4)",
		borderRadius: 999,
		height: 7,
		left: "18%",
		position: "absolute",
		top: "34%",
		transform: [{ rotate: "14deg" }],
		width: "62%",
	},
	tag: {
		alignSelf: "flex-start",
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	tagTitle: {
		color: "#1E2A1D",
		fontSize: 13,
		fontWeight: "700",
	},
	tagSubtitle: {
		color: "#4D6654",
		fontSize: 12,
		fontWeight: "500",
		marginTop: 2,
	},
	pinWrap: {
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
	},
	mainPinWrap: {
		alignItems: "center",
		bottom: "30%",
		justifyContent: "center",
		left: "46%",
		position: "absolute",
	},
	stickyTip: {
		backgroundColor: "#FFFFFF",
		borderColor: "#DCE8D7",
		borderRadius: 10,
		borderWidth: 1,
		bottom: "38%",
		left: "34%",
		paddingHorizontal: 10,
		paddingVertical: 7,
		position: "absolute",
	},
	stickyTipTitle: {
		color: "#1E3021",
		fontSize: 12,
		fontWeight: "700",
	},
	stickyTipSub: {
		color: "#4C6653",
		fontSize: 11,
		fontWeight: "500",
		marginTop: 1,
	},
	tipPointer: {
		borderLeftColor: "transparent",
		borderLeftWidth: 8,
		borderRightColor: "transparent",
		borderRightWidth: 8,
		borderTopColor: "#FFFFFF",
		borderTopWidth: 10,
		bottom: "34%",
		left: "48%",
		height: 0,
		position: "absolute",
		width: 0,
	},
});

export default LocationInspiration;

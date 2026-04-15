import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const Feature = () => {
	const cards = [
		{ title: "For Farmers", text: "Sell Directly", icon: "leaf-outline" },
		{ title: "For Buyers", text: "Bulk Purchasing", icon: "cart-outline" },
		{ title: "Real-time", text: "Chat", icon: "chatbubble-ellipses-outline" },
		{ title: "Order", text: "Management", icon: "receipt-outline" },
	];

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Features</Text>
			<View style={styles.grid}>
				{cards.map((card) => (
					<View key={card.title + card.text} style={styles.card}>
						<View style={styles.iconWrap}>
							<Ionicons name={card.icon} size={18} color="#1F6E33" />
						</View>
						<Text style={styles.cardTitle}>{card.title}</Text>
						<Text style={styles.cardText}>{card.text}</Text>
					</View>
				))}
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
		color: "#152C18",
		fontSize: 26,
		fontWeight: "800",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginTop: 12,
	},
	card: {
		backgroundColor: "#F2E9D7",
		borderRadius: 14,
		minHeight: 85,
		paddingHorizontal: 12,
		paddingVertical: 10,
		width: "48.5%",
	},
	iconWrap: {
		alignItems: "center",
		backgroundColor: "#E5F1E1",
		borderRadius: 8,
		height: 30,
		justifyContent: "center",
		width: 30,
	},
	cardTitle: {
		color: "#203321",
		fontSize: 13,
		fontWeight: "800",
		marginTop: 8,
	},
	cardText: {
		color: "#203321",
		fontSize: 13,
		fontWeight: "700",
		lineHeight: 18,
	},
});

export default Feature;

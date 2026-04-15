import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Testimonies = () => {
	const reviews = [
		{
			type: "Farmer Testimonial",
			quote: "AgriSpark helped me sell directly and improve my income.",
			author: "Abebe T.",
			place: "Gondar",
		},
		{
			type: "Buyer Testimonial",
			quote: "We consistently get fresh produce in bulk with lower cost.",
			author: "Nana L.",
			place: "Addis Ababa",
		},
	];

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Trusted by Farmers and Buyers</Text>

			<View style={styles.row}>
				{reviews.map((item) => (
					<View key={item.type} style={styles.card}>
						<View style={styles.badge}>
							<Ionicons name="shield-checkmark-outline" size={12} color="#1F6E33" />
							<Text style={styles.badgeText}>{item.type}</Text>
						</View>

						<Text style={styles.quote}>"{item.quote}"</Text>
						<Text style={styles.author}>{item.author}</Text>
						<Text style={styles.place}>{item.place}</Text>
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
		color: "#182F1C",
		fontSize: 24,
		fontWeight: "800",
		marginBottom: 10,
	},
	row: {
		flexDirection: "row",
		gap: 10,
	},
	card: {
		backgroundColor: "#EDF5E8",
		borderRadius: 12,
		flex: 1,
		minHeight: 130,
		padding: 10,
	},
	badge: {
		alignItems: "center",
		flexDirection: "row",
	},
	badgeText: {
		color: "#1E7A35",
		fontSize: 11,
		fontWeight: "700",
		marginLeft: 4,
	},
	quote: {
		color: "#274230",
		fontSize: 13,
		fontWeight: "600",
		lineHeight: 19,
		marginTop: 8,
	},
	author: {
		color: "#1E3122",
		fontSize: 12,
		fontWeight: "800",
		marginTop: 10,
	},
	place: {
		color: "#58705D",
		fontSize: 11,
		fontWeight: "500",
		marginTop: 2,
	},
});

export default Testimonies;

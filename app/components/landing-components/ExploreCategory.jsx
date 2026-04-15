import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const ExploreCategory = () => {
	const categories = [
		{
			name: "Vegetables",
			image: require("../../../assets/images/bruna-branco.jpg"),
		},
		{
			name: "Fruits",
			image: require("../../../assets/images/rens-d-ozMroXStJ2w-unsplash.jpg"),
		},
		{
			name: "Grains",
			image: require("../../../assets/images/chris-barbalis-0EWai5-kuBo-unsplash.jpg"),
		},
	];

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Explore Categories</Text>

			<View style={styles.grid}>
				{categories.map((category) => (
					<View key={category.name} style={styles.card}>
						<Image source={category.image} style={styles.image} />
						<Text style={styles.name}>{category.name}</Text>
						<Text style={styles.cta}>Shop Now</Text>
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
	grid: {
		flexDirection: "row",
		gap: 10,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderColor: "#E1E7DD",
		borderRadius: 14,
		borderWidth: 1,
		flex: 1,
		overflow: "hidden",
		paddingBottom: 10,
	},
	image: {
		height: 88,
		width: "100%",
	},
	name: {
		color: "#1B2E1E",
		fontSize: 13,
		fontWeight: "700",
		marginTop: 8,
		paddingHorizontal: 10,
	},
	cta: {
		color: "#1E7A35",
		fontSize: 12,
		fontWeight: "700",
		marginTop: 4,
		paddingHorizontal: 10,
	},
});

export default ExploreCategory;

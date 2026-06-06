import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchFeaturedProducts } from "../../../src/buyer/buyerService";

const localProducts = [
  {
    name: "Organic Tomatoes",
    price: "50 ETB/kg",
    seller: "Green Valley Farms",
    image: require("../../../assets/images/bruna-branco.jpg"),
  },
  {
    name: "Premium Coffee Beans",
    price: "380 ETB/kg",
    seller: "Sidama Growers",
    image: require("../../../assets/images/chris-barbalis-0EWai5-kuBo-unsplash.jpg"),
  },
];

const getProductImage = (product) => {
	if (product?.image_url) {
		return { uri: product.image_url };
	}

	if (product?.image) {
		return product.image;
	}

	return require("../../../assets/images/cereals-image.avif");
};

const getPriceLabel = (product) => {
	if (product?.price_label) {
		return product.price_label;
	}

	if (product?.price) {
		return `${product.price} ETB`;
	}

	return "Available now";
};

const toDisplayProduct = (product, index) => ({
	id: String(product?.id || product?.name || index),
	name: product?.name || "Fresh Product",
	price: getPriceLabel(product),
	seller: product?.farmer_name || product?.seller || "Local farmer",
	image: getProductImage(product),
});

const TopProduct = () => {
	const [products, setProducts] = useState(localProducts);

	useEffect(() => {
		let isMounted = true;

		const loadFeaturedProducts = async () => {
			try {
				const featured = await fetchFeaturedProducts();
				const combined = [...(featured.newest || []), ...(featured.bulk || []), ...(featured.organic || [])];
				const unique = [];
				const seen = new Set();

				for (const item of combined) {
					const key = String(item?.id || item?.name || "").trim();
					if (!key || seen.has(key)) continue;
					seen.add(key);
					unique.push(toDisplayProduct(item, unique.length));
					if (unique.length >= 4) break;
				}

				if (isMounted && unique.length > 0) {
					setProducts(unique);
					return;
				}
			} catch {
				// Fall back to the bundled products below.
			}

			if (isMounted) {
				setProducts(localProducts);
			}
		};

		loadFeaturedProducts();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View style={styles.wrapper}>
			<Text style={styles.heading}>Top Products</Text>

			{products.map((product) => (
				<View key={product.id || product.name} style={styles.card}>
					<Image source={product.image} style={styles.image} />
					<Text style={styles.name}>{product.name}</Text>
					<Text style={styles.price}>{product.price}</Text>
					<Text style={styles.seller}>{product.seller}</Text>

					{/* <Pressable style={styles.button} accessibilityRole="button">
						<Text style={styles.buttonText}>View Details</Text>
					</Pressable> */}
				</View>
			))}
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
	card: {
		backgroundColor: "#FFFFFF",
		borderColor: "#E4E9E2",
		borderRadius: 16,
		borderWidth: 1,
		marginTop: 10,
		padding: 10,
	},
	image: {
		borderRadius: 12,
		height: 140,
		width: "100%",
	},
	name: {
		color: "#1C2B1F",
		fontSize: 21,
		fontWeight: "700",
		marginTop: 10,
	},
	price: {
		color: "#1E7A35",
		fontSize: 15,
		fontWeight: "800",
		marginTop: 3,
	},
	seller: {
		color: "#4D6654",
		fontSize: 13,
		fontWeight: "500",
		marginTop: 2,
	},
	button: {
		backgroundColor: "#1E7A35",
		borderRadius: 999,
		marginTop: 12,
		paddingVertical: 11,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
});

export default TopProduct;

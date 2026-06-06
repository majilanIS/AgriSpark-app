import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Carousel from "./Carousel";

const Hero = () => {
	const router = useRouter();

	return (
		<View style={styles.wrapper}>
			<Text style={styles.title}>Connecting Farmers and Buyers Directly</Text>
			<Text style={styles.subtitle}>
				Buy and sell quality agricultural products without middlemen.
			</Text>
			<View style={styles.carouselWrap}>
				<Carousel inHero />
			</View>
			<View style={styles.buttonRow}>
				<Pressable
                    style={styles.primaryButton}
                    onPress={() =>
                        router.push({
                        pathname: "/login-register",
                        params: { mode: "login" },
                        })
                    }
                    >
                    <Text style={styles.primaryText}>Login</Text>
                </Pressable>

                <Pressable
                    style={styles.secondaryButton}
                    onPress={() =>
                        router.push({
                        pathname: "/login-register",
                        params: { mode: "register" },
                        })
                    }
                    >
                    <Text style={styles.secondaryText}>Register</Text>
                </Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: "#EAF4E5",
		borderRadius: 20,
		marginHorizontal: 16,
		marginTop: 14,
		padding: 18,
		paddingBottom: 16,
	},
	title: {
		color: "#143A1E",
		fontSize: 30,
		fontWeight: "800",
		lineHeight: 36,
	},
	subtitle: {
		color: "#355643",
		fontSize: 16,
		lineHeight: 23,
		marginTop: 10,
	},
	carouselWrap: {
		marginTop: 16,
		borderRadius: 16,
		overflow: "hidden",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 16,
	},
	primaryButton: {
		backgroundColor: "#1E7A35",
		borderRadius: 999,
		flex: 1,
		paddingVertical: 12,
	},
	secondaryButton: {
		backgroundColor: "#F3F8F0",
		borderColor: "#1E7A35",
		borderRadius: 999,
		borderWidth: 1,
		flex: 1,
		paddingVertical: 12,
	},
	primaryText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
	secondaryText: {
		color: "#1E7A35",
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
});

export default Hero;

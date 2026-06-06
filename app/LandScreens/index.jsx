import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Header from "../components/landing-components/Header";
import Hero from "../components/landing-components/Hero";
import Carousel from "../components/landing-components/Carousel";
import ExploreCategory from "../components/landing-components/ExploreCategory";
import TopProduct from "../components/landing-components/TopProduct";
import Feature from "../components/landing-components/Feature";
import WorkGuidance from "../components/landing-components/WorkGuidance";
import Location_inspiration from "../components/landing-components/Location_inspiration";
import Testimonies from "../components/landing-components/Testimonies";
import Footer from "../components/landing-components/Footer";
import AgriSparkAIChatbot from "../../components/AgriSpark_chatbot";

export default function LandingPage() {
	const insets = useSafeAreaInsets();
	const [chatOpen, setChatOpen] = useState(false);

	return (
		<View style={styles.screen}>
			<Header />

			<View style={styles.bodyWrap}>
				<ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
					<Hero />
					<Carousel />
					<ExploreCategory />
					<TopProduct />
					<Feature />
					<WorkGuidance />
					<Location_inspiration />
					<Testimonies />
				</ScrollView>
			</View>

			<View style={[styles.footerWrap, { paddingBottom: insets.bottom || 12 }]}> 
				<Footer />
			</View>

			<Pressable style={[styles.chatFab, { bottom: (insets.bottom || 12) + 18 }]} onPress={() => setChatOpen(true)}>
				<Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
				<Text style={styles.chatFabText}>Ask AI</Text>
			</Pressable>

			<Modal visible={chatOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setChatOpen(false)}>
				<View style={styles.modalScreen}>
					<Pressable style={styles.modalClose} onPress={() => setChatOpen(false)}>
						<Ionicons name="close" size={24} color="#F4F2EC" />
						<Text style={styles.modalCloseText}>Close</Text>
					</Pressable>
					<AgriSparkAIChatbot />
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#fff" },
	content: { paddingBottom: 20 },
	contentScroll: { flexGrow: 1, paddingBottom: 20 },
	bodyWrap: { flex: 1 },
	footerWrap: { backgroundColor: '#fff' },
	chatFab: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0B7A42", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, elevation: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
	chatFabText: { color: "#fff", fontWeight: "900" },
	modalScreen: { flex: 1, backgroundColor: "#07110C" },
	modalClose: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
	modalCloseText: { color: "#F4F2EC", fontWeight: "800" },
	ctaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 8 },
	tagline: { fontSize: 16, fontWeight: "700", color: "#0B0D0C" },
	loginBtn: { backgroundColor: "#2B7BF6", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
	loginBtnText: { color: "#fff", fontWeight: "800" },
});

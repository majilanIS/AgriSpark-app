import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/landing-components/Header";
import Hero from "../components/landing-components/Hero";
import ExploreCategory from "../components/landing-components/ExploreCategory";
import LocationInspiration from "../components/landing-components/Location_inspiration";
import WorkGuidance from "../components/landing-components/WorkGuidance";
import TopProduct from "../components/landing-components/TopProduct";
import Testimonies from "../components/landing-components/Testimonies";
import Footer from "../components/landing-components/Footer";
import Feature from "../components/landing-components/Feature";

export default function Index() {
  return (
    <SafeAreaView style={styles.screen}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Hero />
        <Feature />
        <WorkGuidance />
        <ExploreCategory />
        <TopProduct />
        <LocationInspiration />
        <Testimonies />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F7FBF4",
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
});

import React, { useMemo, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import ReanimatedCarousel from "react-native-reanimated-carousel";

const { width: screenWidth } = Dimensions.get("window");
const sliderWidth = screenWidth - 32;

const carouselImageset = [
  {
    id: "1",
    image: require("../../../assets/images/agri_hero-1.jpg"),
    title: "Fresh Harvest, Straight From Farmers",
  },
  {
    id: "2",
    image: require("../../../assets/images/agri_hero-3.png"),
    title: "Trusted Produce From Local Communities",
  },
  {
    id: "3",
    image: require("../../../assets/images/agri_hero-4.png"),
    title: "Better Prices For Buyers And Growers",
  },
  {
    id: "4",
    image: require("../../../assets/images/agri_hero-5.jpg"),
    title: "Reliable Agri Marketplace, Every Day",
  },
];

const Carousel = ({ inHero = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = useMemo(() => carouselImageset, []);

  return (
    <View style={[styles.wrapper, inHero && styles.wrapperInHero]}>
      {!inHero && <Text style={styles.heading}>Featured Highlights</Text>}

      <ReanimatedCarousel
        autoPlay
        autoPlayInterval={3500}
        data={data}
        height={220}
        loop
        onSnapToItem={(index) => setActiveIndex(index)}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.caption}>{item.title}</Text>
            </View>
          </View>
        )}
        width={sliderWidth}
      />

      <View style={styles.pagination}>
        {data.map((item, index) => (
          <View
            key={item.id}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
          />
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
  wrapperInHero: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  heading: {
    color: "#182F1C",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  slide: {
    borderRadius: 16,
    height: 220,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  overlay: {
    backgroundColor: "rgba(12, 36, 20, 0.45)",
    bottom: 0,
    left: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    right: 0,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    backgroundColor: "#C8D8C3",
    borderRadius: 999,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  activeDot: {
    backgroundColor: "#1E7A35",
    width: 20,
  },
});

export default Carousel;

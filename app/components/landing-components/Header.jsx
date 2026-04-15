import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Header = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.brandWrap}>
          <View style={styles.logoShell}>
            <View style={styles.logoInnerRing}>
              <Image
                source={require("../../../assets/images/logo-1.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View>
            <Text style={styles.logoText}>AgriSpark</Text>
            <Text style={styles.brandSubText}>Secure . Verified</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open app drawer"
          onPress={openDrawer}
          style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="menu-outline" size={22} color="#1F6E33" />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    backgroundColor: "#F3F8F0",
    borderBottomColor: "#D7E5D2",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  brandWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  logoShell: {
    alignItems: "center",
    backgroundColor: "#0F6A31",
    borderColor: "#CFE7CC",
    borderRadius: 17,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    shadowColor: "#155F2D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: 52,
  },
  logoInnerRing: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  logoImage: {
    height: 36,
    width: 36,
  },
  logoText: {
    color: "#1B5E20",
    fontSize: 26,
    fontWeight: "800",
  },
  brandSubText: {
    color: "#5D7363",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
 menuButton: {
  backgroundColor: "transparent",
  borderWidth: 0,                
  paddingHorizontal: 12,
  paddingVertical: 8,
},
  menuButtonText: {
    color: "#1F6E33",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

export default Header;

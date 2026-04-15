import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const WorkGuidance = () => {
    const steps = [
        {
            icon: "person-add-outline",
            title: "1. Create account",
            text: "Sign up as a farmer or buyer with basic verification.",
        },
        {
            icon: "search-outline",
            title: "2. List or browse products",
            text: "Upload product details or filter listings by type and location.",
        },
        {
            icon: "chatbubble-ellipses-outline",
            title: "3. Place or receive orders",
            text: "Coordinate quantity, price, and delivery with built-in chat.",
        },
        {
            icon: "checkmark-done-outline",
            title: "4. Confirm transactions",
            text: "Mark deliveries complete and leave feedback for trusted trading.",
        },
    ];

    return (
        <View style={styles.wrapper}>
            <Text style={styles.heading}>How It Works</Text>

            {steps.map((step) => (
                <View key={step.title} style={styles.stepCard}>
                    <View style={styles.iconBox}>
                        <Ionicons name={step.icon} size={22} color="#1F6E33" />
                    </View>

                    <View style={styles.textBlock}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: "#E7F1E3",
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
    },
    heading: {
        color: "#162B1A",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 10,
    },
    stepCard: {
        alignItems: "flex-start",
        backgroundColor: "#F4FAF1",
        borderColor: "#D9E7D4",
        borderRadius: 14,
        borderWidth: 1,
        flexDirection: "row",
        marginTop: 10,
        padding: 12,
    },
    iconBox: {
        alignItems: "center",
        backgroundColor: "#DFF0D8",
        borderRadius: 12,
        height: 38,
        justifyContent: "center",
        width: 38,
    },
    textBlock: {
        flex: 1,
        marginLeft: 12,
    },
    stepTitle: {
        color: "#1E3424",
        fontSize: 15,
        fontWeight: "800",
    },
    stepText: {
        color: "#365343",
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4,
    },
});

export default WorkGuidance;

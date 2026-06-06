module.exports = () => ({
  name: "AgriSpark-app",
  slug: "agrispark-project",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo-5.png",
  scheme: "agrispark",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  updates: {
    url: "https://u.expo.dev/9d3490e1-c543-4607-8616-4a6bec73c3f7",
    checkAutomatically: "NEVER",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.agrispark.app",
    infoPlist: {
      NSPhotoLibraryUsageDescription: "AgriSpark needs access to your photo library so you can upload profile and product images.",
      NSCameraUsageDescription: "AgriSpark needs camera access if you choose to take a new photo.",
    },
  },
  android: {
    package: "com.agrispark.app",
    permissions: ["READ_MEDIA_IMAGES", "READ_EXTERNAL_STORAGE", "CAMERA"],
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/splash.png",
      backgroundImage: "./assets/images/backg.jpg",
      monochromeImage: "./assets/images/mone_backg.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/splash.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-image-picker",
      {
        photosPermission: "AgriSpark needs access to your photo library so you can upload profile and product images.",
        cameraPermission: "AgriSpark needs camera access if you choose to take a new photo.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? process.env.GROQ_API_KEY ?? "",
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
    EXPO_PUBLIC_GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? process.env.GROQ_API_KEY ?? "",
    EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    router: {},
    eas: {
        projectId: "6dc1519a-2caa-40f0-b582-96cc08a855d7",
    },
  },
});

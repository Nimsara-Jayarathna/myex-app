import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Blipzo",
    slug: "blipzo-app",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: process.env.MB_APP_URI_SCHEME || "blipzoapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        icon: "./assets/images/icon.png",
        bundleIdentifier: "com.nimsara.blipzoapp"
    },
    android: {
        adaptiveIcon: {
            backgroundColor: "#F0F7FF",
            foregroundImage: "./assets/images/android-icon-foreground.png"
        },
        package: "com.nimsara.blipzoapp",
        softwareKeyboardLayoutMode: "pan"
    },
    web: {
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash.png",
                imageWidth: 100,
                resizeMode: "contain",
                backgroundColor: "#F0F7FF"
            }
        ],
        "expo-sqlite",
        "expo-secure-store"
    ]
});

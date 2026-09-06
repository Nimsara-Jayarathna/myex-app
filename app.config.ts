import { ConfigContext, ExpoConfig } from 'expo/config';

const webCredentialDomain = process.env.MB_IOS_WEB_CREDENTIAL_DOMAIN?.trim();
const associatedDomains = webCredentialDomain
  ? [`webcredentials:${webCredentialDomain}`]
  : undefined;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Blipzo',
  slug: 'blipzo-app',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon-light.png',
  scheme: process.env.MB_APP_URI_SCHEME || 'blipzoapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    icon: {
      light: './assets/images/icon-light.png',
      dark: './assets/images/icon-dark.png',
      tinted: './assets/images/icon-tinted.png',
    },
    bundleIdentifier: 'com.nimsara.blipzoapp',
    associatedDomains,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F0F7FF',
      foregroundImage: './assets/images/android-icon-foreground.png',
    },
    package: 'com.nimsara.blipzoapp',
    softwareKeyboardLayoutMode: 'pan',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        imageWidth: 100,
        resizeMode: 'contain',
        backgroundColor: '#F0F7FF',
        dark: {
          image: './assets/images/splash-dark.png',
          backgroundColor: '#020617',
        },
      },
    ],
    [
      'expo-sqlite',
      {
        useSQLCipher: true,
      },
    ],
    'expo-secure-store',
  ],
});

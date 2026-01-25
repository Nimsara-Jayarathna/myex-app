# Blipzo

> Everything you earn and spend.

Blipzo is a modern, offline-first personal finance application built with Expo and React Native. It allows users to track their income and expenses seamlessly, even without an internet connection, syncing data when back online.

## Features

-   **Offline-First Architecture**: Continue working without internet; data syncs automatically when connection is restored.
-   **Secure Authentication**: Robust user session management with JWT.
-   **Smart Syncing**: Background synchronization engine to keep local and remote data consistent.
-   **Theming**: Support for light and dark modes with a custom design system.
-   **Performance**: Built with `react-native-reanimated` for smooth UI interactions and `expo-sqlite` for fast local data access.

## Tech Stack

-   **Framework**: [Expo](https://expo.dev) / React Native
-   **Language**: TypeScript
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [TanStack React Query](https://tanstack.com/query/latest)
-   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction)
-   **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
-   **Styling**: Custom theme system + Reanimated

## Getting Started

### Prerequisites

-   Node.js (LTS recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd blipzo-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    Create a `.env` file in the root directory (copy from example if available, otherwise creaete new) and add your API URL. 
    
    *Note: The app requires a valid backend URL to function fully.*
    ```bash
    EXPO_PUBLIC_API_BASE_URL=http://your-api-url.com
    ```

4.  Start the application:
    ```bash
    npx expo start
    ```

## Project Structure

-   `app/`: Application screens and routing (Expo Router).
-   `api/`: API client configuration and endpoints.
-   `components/`: Reusable UI components.
-   `context/`: React Context providers (Auth, Theme, Offline).
-   `hooks/`: Custom React hooks (useAuth, useHeartbeat, etc.).
-   `utils/`: Helper functions and services (Sync, Logger, Local DB).
-   `types/`: TypeScript type definitions.

## Release Notes
Detailed release notes for each version can be found in the [docs/releases](docs/releases/) directory.
- **Latest Release**: [v1.1.0](docs/releases/v1.1.0.md) - *Glassmorphic UI, Robust Offline Mode, Advanced Auth*
- Previous Release: [v1.0.0](docs/releases/v1.0.0.md)


## Scripts

-   `npm start`: Start the Expo development server.
-   `npm run android`: Run on Android emulator/device.
-   `npm run ios`: Run on iOS simulator/device.
-   `npm run reset-project`: Reset the project to a blank slate (Use with caution).

import { useAppTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    createAnimatedComponent,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

const AnimatedPath = createAnimatedComponent(Path);

export type BlockingState = 'idle' | 'loading' | 'success' | 'error';

interface BlockingModalProps {
    state: BlockingState;
    message?: string;
    onClose?: () => void;
}

export const BlockingModal = ({ state, message, onClose }: BlockingModalProps) => {
    const { colors, resolvedTheme } = useAppTheme();
    const isDark = resolvedTheme === 'dark';
    const isVisible = state !== 'idle';

    // Animations
    const iconScale = useSharedValue(0);
    const checkmarkProgress = useSharedValue(0);

    useEffect(() => {
        if (state === 'success') {
            // Reset and animate checkmark
            checkmarkProgress.value = 0;
            iconScale.value = withSequence(
                withTiming(0, { duration: 0 }),
                withSpring(1, { damping: 12, stiffness: 100 })
            );
            checkmarkProgress.value = withDelay(200, withTiming(1, { duration: 800 }));
        } else if (state === 'error') {
            // Pop in with bounce
            iconScale.value = withSequence(
                withTiming(0, { duration: 0 }),
                withSpring(1, { damping: 8, stiffness: 150 }) // High bounce
            );
        } else {
            iconScale.value = 0;
            checkmarkProgress.value = 0;
        }
    }, [state, checkmarkProgress, iconScale]);

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: iconScale.value }],
        };
    });

    const animatedCheckmarkProps = useAnimatedProps(() => ({
        strokeDashoffset: 40 * (1 - checkmarkProgress.value), // Path length approx 40
    }));

    if (!isVisible) return null;

    return (
        <View style={[styles.container, StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 25 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />

            {/* Backdrop pressable for error state only to allow closing if desired, 
                though usually we want explicit actions or auto-close */}
            {state === 'error' && onClose && (
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            )}

            <Animated.View
                entering={ZoomIn.springify()}
                // exiting={ZoomOut} // Removed to prevent "flash" on dismissal
                style={[
                    styles.content,
                    {
                        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }
                ]}
            >
                <View style={styles.iconContainer}>
                    {state === 'loading' && (
                        <ActivityIndicator size="large" color={colors.primaryAccent} />
                    )}

                    {state === 'success' && (
                        <Animated.View style={animatedIconStyle}>
                            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                                <AnimatedPath
                                    d="M3 13L9 19L21 6" // Larger checkmark path
                                    stroke="#22c55e"
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray={40}
                                    animatedProps={animatedCheckmarkProps}
                                />
                            </Svg>
                        </Animated.View>
                    )}

                    {state === 'error' && (
                        <Animated.View style={animatedIconStyle}>
                            <MaterialIcons name="error" size={48} color="#ef4444" />
                        </Animated.View>
                    )}
                </View>

                {message && (
                    <Text style={[styles.message, { color: colors.textMain }]}>
                        {message}
                    </Text>
                )}

                {state === 'error' && onClose && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.closeButton,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                            pressed && { opacity: 0.7 }
                        ]}
                        onPress={onClose}
                    >
                        <Text style={[styles.closeButtonText, { color: colors.textMain }]}>Close</Text>
                    </Pressable>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Darker overlay on Android to compensate for potential blur issues
        backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)',
    },
    content: {
        width: '80%',
        maxWidth: 320,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        height: 60,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    closeButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    closeButtonText: {
        fontWeight: '600',
        fontSize: 14,
    }
});

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const devFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: fade in + scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Developer name fades in after a short delay
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(devFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation on the logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Exit: fade out and transition to main app
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2400);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim, devFadeAnim, onFinish]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0f0f23',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: fadeAnim,
      }}
    >
      {/* Circular logo container with glow */}
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
        }}
      >
        <View
          style={{
            width: width * 0.88,
            height: width * 0.88,
            borderRadius: (width * 0.88) / 2,
            backgroundColor: 'rgba(124, 58, 237, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={{
              width: width * 0.82,
              height: width * 0.82,
            }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Developer credit */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 60,
          opacity: devFadeAnim,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: 'rgba(148, 163, 184, 0.9)',
            fontWeight: '500',
          }}
        >
          by
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#94a3b8',
            fontWeight: '700',
            marginTop: 4,
            letterSpacing: 1,
          }}
        >
          Asheesh Sahu
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function TransitionScreen() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>HIBO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
});

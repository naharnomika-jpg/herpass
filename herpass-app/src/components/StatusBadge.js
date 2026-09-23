import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../theme';

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_COLORS[status] || { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
  const fontSize = size === 'lg' ? 13 : 10;
  const px = size === 'lg' ? 10 : 7;
  const py = size === 'lg' ? 5 : 3;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          paddingHorizontal: px,
          paddingVertical: py,
        },
      ]}
    >
      <Text style={[styles.text, { color: cfg.text, fontSize }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function StudentCard({ student }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.name?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.meta}>Room {student.room_number}</Text>
          <Text style={styles.course}>{student.course} ({student.year})</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: student.status === 'OUTSIDE' ? colors.amber : colors.emerald }]} />
      </View>

      {/* Contact Info */}
      <View style={styles.infoBox}>
        <ContactRow icon="call-outline" label="Student" value={student.phone} color={colors.emerald} />
        <ContactRow icon="people-outline" label="Guardian" value={student.guardian_contact} color={colors.blue} />
      </View>
    </View>
  );
}

function ContactRow({ icon, label, value, color }) {
  return (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => value && Linking.openURL(`tel:${value}`)}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.contactLabel}>{label}:</Text>
      <Text style={styles.contactValue}>{value || '—'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9d174d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { color: colors.white, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.pink, fontSize: 11, fontWeight: '600' },
  course: { color: colors.muted, fontSize: 10, marginTop: 2 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderDim,
    gap: 6,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  contactValue: { color: colors.white, fontSize: 11, fontFamily: 'monospace' },
});

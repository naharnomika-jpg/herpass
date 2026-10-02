import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius } from '../theme';

const AVATAR_GRADIENTS = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#8B5CF6'],
  ['#3B82F6', '#6366F1'],
  ['#10B981', '#3B82F6'],
  ['#F59E0B', '#EF4444'],
];

function getGradient(name) {
  const code = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[code];
}

export default function StudentCard({ student }) {
  const grad = getGradient(student.name);
  const isOutside = student.status === 'OUTSIDE';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <LinearGradient colors={grad} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.avatarText}>{student.name?.charAt(0)?.toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.roomBadge}>
              <Ionicons name="home" size={9} color={colors.primary} />
              <Text style={styles.roomText}>Room {student.room_number}</Text>
            </View>
            <Text style={styles.courseMeta}>{student.course} · {student.year}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: isOutside ? colors.amberDim : colors.emeraldDim, borderColor: isOutside ? colors.amber + '44' : colors.emerald + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOutside ? colors.amber : colors.emerald }]} />
          <Text style={[styles.statusText, { color: isOutside ? colors.amber : colors.emerald }]}>
            {isOutside ? 'OUT' : 'IN'}
          </Text>
        </View>
      </View>

      {/* ID Row */}
      <View style={styles.idRow}>
        <Ionicons name="id-card-outline" size={12} color={colors.dim} />
        <Text style={styles.idText}>{student.student_id}</Text>
      </View>

      {/* Contact Cards */}
      <View style={styles.contacts}>
        <ContactCard
          icon="call"
          label="Student"
          value={student.phone}
          color={colors.emerald}
          gradColors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.04)']}
        />
        <ContactCard
          icon="people"
          label="Guardian"
          value={student.guardian_contact}
          color={colors.blue}
          gradColors={['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.04)']}
        />
      </View>
    </View>
  );
}

function ContactCard({ icon, label, value, color, gradColors }) {
  return (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => value && Linking.openURL(`tel:${value}`)}
      activeOpacity={0.75}
    >
      <LinearGradient colors={gradColors} style={styles.contactGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.contactIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={styles.contactValue}>{value || '—'}</Text>
        </View>
        {value && <Ionicons name="call-outline" size={13} color={color} style={{ opacity: 0.6 }} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  info: { flex: 1 },
  name: { color: colors.white, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roomBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primaryGlow, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  roomText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  courseMeta: { color: colors.muted, fontSize: 10 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },

  idRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgMuted, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.borderDim,
  },
  idText: { color: colors.muted, fontSize: 11, fontFamily: 'monospace' },

  contacts: { gap: 8 },
  contactCard: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderDim,
  },
  contactGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  contactIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { color: colors.dim, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { color: colors.white, fontSize: 12, fontWeight: '600', marginTop: 1 },
});

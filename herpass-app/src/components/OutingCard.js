import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import StatusBadge from './StatusBadge';

export default function OutingCard({ outing, onMarkOut, onMarkReturned, onResolve, onExtend }) {
  const isOverdue = outing.status === 'OVERDUE';
  const isOut = outing.status === 'OUT';
  const isUpcoming = outing.status === 'UPCOMING';

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{outing.student_name}</Text>
          <Text style={styles.studentMeta}>
            Room {outing.room_number} · {outing.student_code}
          </Text>
        </View>
        <StatusBadge status={outing.status} />
      </View>

      {/* Destination Row */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Destination</Text>
        <Text style={styles.infoValue}>{outing.destination}</Text>
        <Text style={styles.infoSub}>{outing.reason}</Text>
      </View>

      {/* Time Row */}
      <View style={styles.timeRow}>
        <View>
          <Text style={styles.timeLbl}>Departs</Text>
          <Text style={styles.timeVal}>{outing.departure_time}</Text>
        </View>
        <View>
          <Text style={styles.timeLbl}>Return By</Text>
          <Text style={[styles.timeVal, { color: isOverdue ? colors.rose : colors.white }]}>
            {outing.return_deadline}
          </Text>
        </View>
        <View>
          <Text style={styles.timeLbl}>Date</Text>
          <Text style={styles.timeVal}>{outing.outing_date}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isUpcoming && (
          <TouchableOpacity style={[styles.btn, styles.btnEmerald]} onPress={() => onMarkOut(outing.outing_id)}>
            <Ionicons name="log-out-outline" size={14} color="#fff" />
            <Text style={styles.btnText}>Mark OUT</Text>
          </TouchableOpacity>
        )}

        {(isOut || isOverdue) && (
          <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={() => onMarkReturned(outing.outing_id)}>
            <Ionicons name="log-in-outline" size={14} color="#fff" />
            <Text style={styles.btnText}>Returned</Text>
          </TouchableOpacity>
        )}

        {isOverdue && (
          <TouchableOpacity style={[styles.btn, styles.btnRose]} onPress={() => onResolve(outing)}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
            <Text style={styles.btnText}>Resolve</Text>
          </TouchableOpacity>
        )}

        {(isOut || isOverdue || isUpcoming) && (
          <TouchableOpacity style={[styles.btn, styles.btnSlate]} onPress={() => onExtend(outing)}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={[styles.btnText, { color: colors.muted }]}>Extend</Text>
          </TouchableOpacity>
        )}

        {(isOut || isOverdue) && outing.student_phone ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnSlate]}
            onPress={() => Linking.openURL(`tel:${outing.student_phone}`)}
          >
            <Ionicons name="call-outline" size={14} color={colors.emerald} />
            <Text style={[styles.btnText, { color: colors.emerald }]}>Call</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
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
  overdueCard: {
    borderColor: colors.rose,
    borderWidth: 2,
    backgroundColor: 'rgba(153,27,27,0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: { flex: 1, marginRight: 10 },
  studentName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  studentMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  infoBox: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  infoLabel: { color: colors.dim, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: colors.white, fontSize: 13, fontWeight: '600', marginTop: 2 },
  infoSub: { color: colors.muted, fontSize: 11 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeLbl: { color: colors.dim, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  timeVal: { color: colors.white, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnEmerald: { backgroundColor: '#059669' },
  btnBlue:   { backgroundColor: '#2563eb' },
  btnRose:   { backgroundColor: '#e11d48' },
  btnSlate:  { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
});

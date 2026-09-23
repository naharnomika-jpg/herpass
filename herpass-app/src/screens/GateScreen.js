import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getOutings, markOut, markReturned } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { POLL_INTERVAL } from '../config';
import StatusBadge from '../components/StatusBadge';

export default function GateScreen({ navigation }) {
  const { user } = useAuth();
  const [outings, setOutings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getOutings();
      setOutings(data);
    } catch {
      if (!silent) Alert.alert('Error', 'Could not load gate data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => load(true), POLL_INTERVAL);
      return () => clearInterval(timer);
    }, [load])
  );

  const q = search.toLowerCase();
  const upcoming = outings.filter(o =>
    o.status === 'UPCOMING' &&
    (!q || o.student_name?.toLowerCase().includes(q) || o.room_number?.includes(q))
  );
  const outside = outings.filter(o =>
    (o.status === 'OUT' || o.status === 'OVERDUE') &&
    (!q || o.student_name?.toLowerCase().includes(q) || o.room_number?.includes(q))
  );

  const doMarkOut = async (outingId) => {
    try {
      const res = await markOut(outingId, user.name);
      Alert.alert('✅ Marked OUT', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed');
    }
  };

  const doMarkReturned = async (outingId) => {
    try {
      const res = await markReturned(outingId, user.name);
      Alert.alert('✅ Returned', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
        <Text style={styles.loadingText}>Loading gate data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gate Header Banner */}
      <View style={styles.gateBanner}>
        <View style={styles.gateBannerIcon}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.gateTitle}>Gate Verification Desk</Text>
          <Text style={styles.gateSub}>Mark Departure & Return</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Quick Room / Student search..."
          placeholderTextColor={colors.dim}
        />
      </View>

      <FlatList
        data={[{ key: 'upcoming', data: upcoming }, { key: 'outside', data: outside }]}
        keyExtractor={item => item.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />
        }
        renderItem={({ item }) => {
          if (item.key === 'upcoming') {
            return (
              <View>
                {/* Section: Pending Departure */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="log-out-outline" size={18} color={colors.blue} />
                  <Text style={[styles.sectionTitle, { color: colors.blue }]}>
                    Pending Departure (Mark OUT)
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.3)' }]}>
                    <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>{upcoming.length}</Text>
                  </View>
                </View>
                {upcoming.length === 0
                  ? <View style={styles.emptyCard}><Text style={styles.emptyTxt}>No pending departures at gate.</Text></View>
                  : upcoming.map(o => (
                    <GateUpcomingCard key={o.outing_id} outing={o} onMarkOut={() => doMarkOut(o.outing_id)} onExtend={() => navigation.navigate('ExtendDeadline', { outing: o })} />
                  ))
                }
              </View>
            );
          }
          return (
            <View style={{ marginTop: 10 }}>
              {/* Section: Currently Outside */}
              <View style={styles.sectionHeader}>
                <Ionicons name="log-in-outline" size={18} color={colors.amber} />
                <Text style={[styles.sectionTitle, { color: colors.amber }]}>
                  Currently Outside (Mark RETURNED)
                </Text>
                <View style={[styles.countBadge, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                  <Text style={{ color: colors.amber, fontSize: 11, fontWeight: '700' }}>{outside.length}</Text>
                </View>
              </View>
              {outside.length === 0
                ? <View style={styles.emptyCard}><Text style={styles.emptyTxt}>No students currently outside.</Text></View>
                : outside.map(o => (
                  <GateOutsideCard
                    key={o.outing_id}
                    outing={o}
                    onMarkReturned={() => doMarkReturned(o.outing_id)}
                    onResolve={() => navigation.navigate('ResolveOverdue', { outing: o })}
                  />
                ))
              }
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function GateUpcomingCard({ outing, onMarkOut, onExtend }) {
  return (
    <View style={styles.gateCard}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardName}>{outing.student_name}</Text>
          <Text style={[styles.cardMeta, { color: colors.blue }]}>
            Room {outing.room_number} · {outing.student_code}
          </Text>
        </View>
        <View style={[styles.timePill, { borderColor: 'rgba(59,130,246,0.4)' }]}>
          <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>{outing.departure_time}</Text>
        </View>
      </View>
      <View style={styles.destinationBox}>
        <Text style={styles.destLabel}>Destination: </Text>
        <Text style={styles.destValue}>{outing.destination} ({outing.reason})</Text>
      </View>
      <View style={styles.gateActionRow}>
        <Text style={styles.deadlineText}>Return By: {outing.return_deadline}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.extendSmBtn} onPress={onExtend}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.markOutBtn} onPress={onMarkOut}>
            <Ionicons name="log-out-outline" size={15} color="#fff" />
            <Text style={styles.markBtnText}>MARK OUT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function GateOutsideCard({ outing, onMarkReturned, onResolve }) {
  const isOverdue = outing.status === 'OVERDUE';
  return (
    <View style={[styles.gateCard, isOverdue && styles.overdueCard]}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardName}>{outing.student_name}</Text>
          <Text style={[styles.cardMeta, { color: colors.amber }]}>
            Room {outing.room_number} · 📞 {outing.student_phone}
          </Text>
        </View>
        <StatusBadge status={outing.status} />
      </View>
      <View style={[styles.destinationBox, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={styles.destLabel}>Out: <Text style={styles.destValue}>{outing.actual_departure ? outing.actual_departure.split(' ')[1] : outing.departure_time}</Text></Text>
        <Text style={[styles.destLabel, { color: colors.rose }]}>Deadline: <Text style={[styles.destValue, { color: colors.rose }]}>{outing.return_deadline}</Text></Text>
      </View>
      <View style={styles.gateActionRow}>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${outing.student_phone}`)} style={styles.callBtn}>
          <Ionicons name="call-outline" size={14} color={colors.emerald} />
          <Text style={{ color: colors.emerald, fontSize: 12, fontWeight: '700' }}>Call</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isOverdue && (
            <TouchableOpacity style={styles.resolveBtn} onPress={onResolve}>
              <Text style={styles.markBtnText}>Resolve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.markReturnedBtn} onPress={onMarkReturned}>
            <Ionicons name="log-in-outline" size={15} color="#fff" />
            <Text style={styles.markBtnText}>RETURNED</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 14 },
  listContent: { padding: 14, paddingBottom: 100 },

  gateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(6,78,59,0.3)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.3)',
    padding: 14,
  },
  gateBannerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center',
  },
  gateTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  gateSub: { color: colors.emerald, fontSize: 12 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 13 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },

  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  emptyTxt: { color: colors.dim, fontSize: 13 },

  gateCard: {
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border, padding: 14, marginBottom: 10, gap: 10,
  },
  overdueCard: {
    borderColor: colors.rose, borderWidth: 2,
    backgroundColor: 'rgba(153,27,27,0.25)',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  timePill: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  destinationBox: {
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.borderDim,
  },
  destLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  destValue: { color: colors.white, fontWeight: '600', fontSize: 12 },
  gateActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadlineText: { color: colors.muted, fontSize: 11 },
  markOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.emerald, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  markReturnedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  resolveBtn: {
    backgroundColor: colors.rose, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.border,
  },
  extendSmBtn: {
    backgroundColor: colors.bgCard, borderRadius: 10,
    padding: 9, borderWidth: 1, borderColor: colors.border,
  },
  markBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

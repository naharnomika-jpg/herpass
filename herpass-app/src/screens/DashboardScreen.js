import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats, getOutings, markOut, markReturned } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { POLL_INTERVAL } from '../config';
import StatCard from '../components/StatCard';
import OutingCard from '../components/OutingCard';

const FILTERS = ['ALL', 'OUT', 'RETURNED', 'UPCOMING', 'OVERDUE'];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [outings, setOutings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [s, o] = await Promise.all([getDashboardStats(), getOutings()]);
      setStats(s);
      setOutings(o);
    } catch (e) {
      if (!silent) Alert.alert('Error', 'Could not fetch dashboard data. Is the server running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-poll for realtime updates
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => load(true), POLL_INTERVAL);
      return () => clearInterval(timer);
    }, [load])
  );

  // Filter logic
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      outings.filter(o => {
        const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const matchSearch = !q ||
          o.student_name?.toLowerCase().includes(q) ||
          o.room_number?.toLowerCase().includes(q) ||
          o.outing_id?.toLowerCase().includes(q) ||
          o.destination?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
    );
  }, [outings, search, statusFilter]);

  const handleMarkOut = async (outingId) => {
    try {
      const res = await markOut(outingId, user.name);
      Alert.alert('✅ Marked OUT', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to mark OUT');
    }
  };

  const handleMarkReturned = async (outingId) => {
    try {
      const res = await markReturned(outingId, user.name);
      Alert.alert('✅ Returned', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to mark RETURNED');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.pink} size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.outing_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.pink} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Page Title */}
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Outing Overview</Text>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTxt}>Live · auto-refreshes every 10s</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateOuting')}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.createBtnText}>New Outing</Text>
              </TouchableOpacity>
            </View>

            {/* KPI Stats */}
            {stats && (
              <View style={styles.statsRow}>
                <StatCard label="Today's Total" value={stats.todays_outings} icon="📅" />
                <StatCard label="Currently Out" value={stats.currently_outside} accent={colors.amber} icon="🟠" />
                <StatCard label="Returned" value={stats.returned_today} accent={colors.emerald} icon="🟢" />
              </View>
            )}
            {stats?.overdue_count > 0 && (
              <View style={styles.overdueBanner}>
                <Ionicons name="warning" size={18} color={colors.rose} />
                <Text style={styles.overdueText}>
                  ⚠ {stats.overdue_count} OVERDUE student{stats.overdue_count > 1 ? 's' : ''} — immediate action required!
                </Text>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search student, room, destination..."
                placeholderTextColor={colors.dim}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
                  onPress={() => setStatusFilter(f)}
                >
                  <Text style={[styles.filterBtnText, statusFilter === f && styles.filterBtnTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>
              Live Outing Register · {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <OutingCard
            outing={item}
            onMarkOut={handleMarkOut}
            onMarkReturned={handleMarkReturned}
            onResolve={(o) => navigation.navigate('ResolveOverdue', { outing: o })}
            onExtend={(o) => navigation.navigate('ExtendDeadline', { outing: o })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.dim} />
            <Text style={styles.emptyText}>No outings match your filter.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 14 },
  listContent: { padding: 14, paddingBottom: 100 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald },
  liveTxt: { color: colors.muted, fontSize: 11 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.pink, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginBottom: 12 },

  overdueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(153,27,27,0.3)',
    borderRadius: 12, borderWidth: 1, borderColor: colors.rose,
    padding: 12, marginBottom: 12,
  },
  overdueText: { color: colors.rose, fontSize: 13, fontWeight: '700', flex: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 44, marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 13 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.pink, borderColor: colors.pink },
  filterBtnText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterBtnTextActive: { color: '#fff' },

  sectionLabel: { color: colors.dim, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: colors.muted, fontSize: 13 },
});

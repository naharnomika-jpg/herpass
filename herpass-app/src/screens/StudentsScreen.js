import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStudents } from '../api';
import { colors, gradients, radius, spacing, typography, TAB_BAR_HEIGHT } from '../theme';
import StudentCard from '../components/StudentCard';

export default function StudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch {
      if (!silent) Alert.alert('Error', 'Could not load students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.room_number?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  const outsideCount = students.filter(s => s.status === 'OUTSIDE').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <LinearGradient colors={gradients.primary} style={styles.loadingIcon}>
          <Ionicons name="people" size={26} color="#fff" />
        </LinearGradient>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={s => String(s.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.pageTitleRow}>
                  <LinearGradient colors={gradients.primary} style={styles.titleIcon}>
                    <Ionicons name="people" size={16} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.title}>Students</Text>
                </View>
                <Text style={styles.subtitle}>Hostel residents & guardian contacts</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtnWrap}
                onPress={() => navigation.navigate('AddStudent')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={gradients.primary} style={styles.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Stats Strip */}
            <View style={styles.statsStrip}>
              <View style={styles.statChip}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <Text style={styles.statChipValue}>{students.length}</Text>
                <Text style={styles.statChipLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statChip}>
                <Ionicons name="navigate-circle" size={16} color={colors.amber} />
                <Text style={[styles.statChipValue, { color: colors.amber }]}>{outsideCount}</Text>
                <Text style={styles.statChipLabel}>Outside</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statChip}>
                <Ionicons name="home" size={16} color={colors.emerald} />
                <Text style={[styles.statChipValue, { color: colors.emerald }]}>{students.length - outsideCount}</Text>
                <Text style={styles.statChipLabel}>Present</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={17} color={colors.dim} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, room, roll number..."
                placeholderTextColor={colors.dim}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={17} color={colors.dim} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.countRow}>
              <Text style={styles.countLabel}>
                {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              </Text>
              {search.length > 0 && (
                <Text style={styles.filterHint}>matching "{search}"</Text>
              )}
            </View>
          </View>
        )}
        renderItem={({ item }) => <StudentCard student={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient colors={['rgba(99,102,241,0.12)', 'transparent']} style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={32} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptyText}>
              {search ? `No results for "${search}"` : 'Add students to get started.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: typography.sm },
  listContent: { padding: spacing.base, paddingBottom: TAB_BAR_HEIGHT + 16 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerLeft: { gap: 4 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  titleIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: typography.xxl, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 12, marginLeft: 39 },
  addBtnWrap: { borderRadius: radius.md, overflow: 'hidden' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 16, marginBottom: spacing.md,
  },
  statChip: { flex: 1, alignItems: 'center', gap: 5 },
  statChipValue: { color: colors.white, fontSize: 22, fontWeight: '900' },
  statChipLabel: { color: colors.dim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, height: 50, marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  countLabel: { color: colors.dim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  filterHint: { color: colors.primary, fontSize: 11, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 14 },
});

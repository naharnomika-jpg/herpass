import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStudents } from '../api';
import { colors } from '../theme';
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.pink} size="large" />
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.pink} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Student Profiles</Text>
                <Text style={styles.subtitle}>Hostel residents directory & guardian contacts</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddStudent')}
              >
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, room, roll number..."
                placeholderTextColor={colors.dim}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.countLabel}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
        renderItem={({ item }) => <StudentCard student={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.dim} />
            <Text style={styles.emptyText}>No students found.</Text>
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

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.pink, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 44, marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 13 },

  countLabel: { color: colors.dim, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: colors.muted, fontSize: 13 },
});

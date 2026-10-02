import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { resolveOverdue } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius } from '../theme';

export default function ResolveOverdueModal({ navigation, route }) {
  const { outing } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await resolveOverdue(outing.outing_id, 'Resolved and confirmed by Warden.', user?.name || 'Warden');
      Alert.alert('✅ Resolved', res.message);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to resolve.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={22} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Resolve Overdue Case</Text>
            <Text style={styles.subtitle}>{outing.student_name} · Room {outing.room_number}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Row label="Outing ID" value={outing.outing_id} />
          <Row label="Destination" value={outing.destination} />
          <Row label="Return Deadline" value={outing.return_deadline} valueColor={colors.rose} />
        </View>

        {/* Confirmation Message Box */}
        <View style={styles.confirmBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.emerald} />
          <Text style={styles.confirmText}>
            Confirm resolving this overdue case? The overdue alert will be cleared and marked as resolved.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtnWrap} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={gradients.success} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Confirm Resolution</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: valueColor || colors.white, fontSize: 12, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 16, marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.3)',
  },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },

  infoBox: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, padding: 14, marginBottom: 16,
  },

  label: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  confirmBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)',
    padding: 14, marginBottom: 20,
  },
  confirmText: { color: colors.white, fontSize: 13, flex: 1, lineHeight: 18 },

  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  submitBtnWrap: { flex: 2, borderRadius: radius.md, overflow: 'hidden' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

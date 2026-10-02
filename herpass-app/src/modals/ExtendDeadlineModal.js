import React, { useState } from 'react';
import { Platform } from 'react-native';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { extendDeadline } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius } from '../theme';

export default function ExtendDeadlineModal({ navigation, route }) {
  const { outing } = route.params;
  const { user } = useAuth();

  const parseTime = (timeStr) => {
    const d = new Date();
    const [h, m] = (timeStr || '18:00').split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d;
  };

  const [newTime, setNewTime] = useState(parseTime(outing.return_deadline));
  const [reason, setReason] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const fmtTime = (d) => d.toTimeString().slice(0, 5);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter a reason for the extension.');
      return;
    }
    setLoading(true);
    try {
      const res = await extendDeadline(
        outing.outing_id,
        fmtTime(newTime),
        reason.trim(),
        user?.name || 'Warden'
      );
      Alert.alert('✅ Extended', res.message);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to extend deadline.');
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
            <Ionicons name="time" size={22} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Extend Return Deadline</Text>
            <Text style={styles.subtitle}>{outing.student_name} · {outing.outing_id}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Row label="Current Deadline" value={outing.return_deadline} valueColor={colors.rose} />
          <Row label="Destination" value={outing.destination} />
          <Row label="Status" value={outing.status} />
        </View>

        {/* New Time Picker */}
        <Text style={styles.label}>New Return Deadline Time</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.pickerText}>{fmtTime(newTime)}</Text>
          <Ionicons name="time-outline" size={18} color={colors.blue} />
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            mode="time"
            value={newTime}
            is24Hour
            onChange={(_, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setNewTime(d);
            }}
          />
        )}

        {/* Reason */}
        <Text style={[styles.label, { marginTop: 16 }]}>Reason for Extension</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. University lab session extended..."
          placeholderTextColor={colors.dim}
        />

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtnWrap} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={gradients.blue} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="save-outline" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Save Extension</Text>
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
    backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.3)',
  },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },

  infoBox: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, padding: 14, marginBottom: 16,
  },

  label: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: radius.md,
    borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.4)',
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4,
  },
  pickerText: { color: colors.blue, fontSize: 22, fontWeight: '800' },

  input: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    color: colors.white, fontSize: 14, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 20,
  },

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

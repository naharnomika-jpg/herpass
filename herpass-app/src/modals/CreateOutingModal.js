import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOuting, getStudents } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function CreateOutingModal({ navigation }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [destination, setDestination] = useState('');
  const [remarks, setRemarks] = useState('');
  const [outingDate, setOutingDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0); return d;
  });
  const [returnDeadline, setReturnDeadline] = useState(() => {
    const d = new Date(); d.setHours(18, 0, 0, 0); return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {});
  }, []);

  const fmt = (d) => d.toISOString().split('T')[0];
  const fmtTime = (d) => d.toTimeString().slice(0, 5);

  const handleSubmit = async () => {
    if (!destination.trim()) {
      Alert.alert('Validation', 'Destination is required.');
      return;
    }
    if (students.length === 0) {
      Alert.alert('Error', 'No students available.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        student_id: students[selectedStudentIdx].id,
        destination: destination.trim(),
        reason: '',
        outing_date: fmt(outingDate),
        departure_time: fmtTime(departureTime),
        return_deadline: fmtTime(returnDeadline),
        remarks: remarks.trim(),
      };
      const res = await createOuting(payload, user?.name || 'Warden');
      Alert.alert('✅ Created', res.message || 'Outing created successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create outing.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students[selectedStudentIdx];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={22} color={colors.pink} />
          <Text style={styles.title}>Create New Outing Entry</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Student Picker */}
        <Field label="Select Student">
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setStudentPickerVisible(!studentPickerVisible)}
          >
            <Text style={styles.pickerBtnText}>
              {selectedStudent ? `${selectedStudent.name} (Room ${selectedStudent.room_number})` : 'Select...'}
            </Text>
            <Ionicons name={studentPickerVisible ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
          </TouchableOpacity>
          {studentPickerVisible && (
            <View style={styles.dropdownList}>
              {students.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.dropdownItem, i === selectedStudentIdx && styles.dropdownItemActive]}
                  onPress={() => { setSelectedStudentIdx(i); setStudentPickerVisible(false); }}
                >
                  <Text style={[styles.dropdownText, i === selectedStudentIdx && { color: colors.pink }]}>
                    {s.name} — Room {s.room_number} ({s.student_id})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        {/* Destination */}
        <Field label="Destination">
          <TextInput style={styles.input} value={destination} onChangeText={setDestination}
            placeholder="e.g. City Center Market" placeholderTextColor={colors.dim} />
        </Field>

        {/* Date */}
        <Field label="Outing Date">
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerBtnText}>{fmt(outingDate)}</Text>
            <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker mode="date" value={outingDate} minimumDate={new Date()}
              onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setOutingDate(d); }} />
          )}
        </Field>

        {/* Times */}
        <View style={styles.row2}>
          <Field label="Scheduled Departure" style={{ flex: 1 }}>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDeptPicker(true)}>
              <Text style={styles.pickerBtnText}>{fmtTime(departureTime)}</Text>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
            {showDeptPicker && (
              <DateTimePicker mode="time" value={departureTime} is24Hour
                onChange={(_, d) => { setShowDeptPicker(Platform.OS === 'ios'); if (d) setDepartureTime(d); }} />
            )}
          </Field>
          <Field label="Return Deadline" style={{ flex: 1 }}>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowReturnPicker(true)}>
              <Text style={[styles.pickerBtnText, { color: colors.rose }]}>{fmtTime(returnDeadline)}</Text>
              <Ionicons name="time-outline" size={16} color={colors.rose} />
            </TouchableOpacity>
            {showReturnPicker && (
              <DateTimePicker mode="time" value={returnDeadline} is24Hour
                onChange={(_, d) => { setShowReturnPicker(Platform.OS === 'ios'); if (d) setReturnDeadline(d); }} />
            )}
          </Field>
        </View>

        {/* Remarks */}
        <Field label="Remarks (Optional)">
          <TextInput style={[styles.input, styles.textarea]} value={remarks} onChangeText={setRemarks}
            placeholder="e.g. Parent permission verified..." placeholderTextColor={colors.dim}
            multiline numberOfLines={3} textAlignVertical="top" />
        </Field>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitBtnText}>Save & Issue Outing</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 16, marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { flex: 1, color: colors.white, fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: 4 },

  row2: { flexDirection: 'row', gap: 10 },

  input: {
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    color: colors.white, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  textarea: { minHeight: 70 },

  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  pickerBtnText: { color: colors.white, fontSize: 14 },

  dropdownList: {
    backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderDim },
  dropdownItemActive: { backgroundColor: 'rgba(236,72,153,0.1)' },
  dropdownText: { color: colors.white, fontSize: 13 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 13,
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  submitBtn: {
    flex: 2, alignItems: 'center', paddingVertical: 13,
    backgroundColor: colors.pink, borderRadius: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

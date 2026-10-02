import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOuting, getStudents } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius } from '../theme';

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
  const [focusedField, setFocusedField] = useState(null);

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

        {/* Hero Header */}
        <LinearGradient
          colors={['rgba(99,102,241,0.1)', 'transparent']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <LinearGradient colors={gradients.primary} style={styles.heroIcon}>
            <Ionicons name="calendar" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.heroTitle}>New Outing Entry</Text>
            <Text style={styles.heroSub}>Fill in the details to issue an outing pass</Text>
          </View>
        </LinearGradient>

        {/* Student Picker */}
        <Field label="Select Student" icon="person">
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setStudentPickerVisible(!studentPickerVisible)}
            activeOpacity={0.8}
          >
            <View style={styles.pickerBtnContent}>
              {selectedStudent ? (
                <>
                  <LinearGradient colors={gradients.primary} style={styles.pickerAvatar}>
                    <Text style={styles.pickerAvatarText}>{selectedStudent.name?.charAt(0)}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerBtnText}>{selectedStudent.name}</Text>
                    <Text style={styles.pickerBtnSub}>Room {selectedStudent.room_number} · {selectedStudent.student_id}</Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.pickerBtnText, { color: colors.dim }]}>Select a student...</Text>
              )}
            </View>
            <Ionicons name={studentPickerVisible ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
          </TouchableOpacity>
          {studentPickerVisible && (
            <View style={styles.dropdownList}>
              {students.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.dropdownItem, i === selectedStudentIdx && styles.dropdownItemActive]}
                  onPress={() => { setSelectedStudentIdx(i); setStudentPickerVisible(false); }}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={i === selectedStudentIdx ? ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)'] : ['transparent', 'transparent']}
                    style={styles.dropdownItemInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={[styles.dropdownDot, { backgroundColor: i === selectedStudentIdx ? colors.primary : colors.dim }]} />
                    <Text style={[styles.dropdownText, i === selectedStudentIdx && { color: colors.primary }]}>
                      {s.name} — Room {s.room_number}
                    </Text>
                    {i === selectedStudentIdx && (
                      <Ionicons name="checkmark" size={14} color={colors.primary} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        {/* Destination */}
        <Field label="Destination" icon="location">
          <View style={[styles.inputWrap, focusedField === 'dest' && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              onFocus={() => setFocusedField('dest')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. City Center Market"
              placeholderTextColor={colors.dim}
            />
          </View>
        </Field>

        {/* Date */}
        <Field label="Outing Date" icon="calendar">
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Text style={styles.pickerBtnText}>{fmt(outingDate)}</Text>
            <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              mode="date" value={outingDate} minimumDate={new Date()}
              onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setOutingDate(d); }}
            />
          )}
        </Field>

        {/* Times */}
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Departure" icon="log-out-outline">
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDeptPicker(true)} activeOpacity={0.8}>
                <Text style={styles.pickerBtnText}>{fmtTime(departureTime)}</Text>
                <Ionicons name="time-outline" size={15} color={colors.blue} />
              </TouchableOpacity>
              {showDeptPicker && (
                <DateTimePicker mode="time" value={departureTime} is24Hour
                  onChange={(_, d) => { setShowDeptPicker(Platform.OS === 'ios'); if (d) setDepartureTime(d); }} />
              )}
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Return By" icon="time">
              <TouchableOpacity style={[styles.pickerBtn, styles.deadlineBtn]} onPress={() => setShowReturnPicker(true)} activeOpacity={0.8}>
                <Text style={[styles.pickerBtnText, { color: colors.rose }]}>{fmtTime(returnDeadline)}</Text>
                <Ionicons name="time" size={15} color={colors.rose} />
              </TouchableOpacity>
              {showReturnPicker && (
                <DateTimePicker mode="time" value={returnDeadline} is24Hour
                  onChange={(_, d) => { setShowReturnPicker(Platform.OS === 'ios'); if (d) setReturnDeadline(d); }} />
              )}
            </Field>
          </View>
        </View>

        {/* Remarks */}
        <Field label="Remarks (Optional)" icon="document-text-outline">
          <View style={[styles.inputWrap, focusedField === 'remarks' && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={remarks}
              onChangeText={setRemarks}
              onFocus={() => setFocusedField('remarks')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Parent permission verified..."
              placeholderTextColor={colors.dim}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Field>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtnWrap} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={gradients.primary} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Save & Issue Outing</Text>
                  </View>
                )
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function Field({ label, icon, children }) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        {icon && <Ionicons name={icon} size={11} color={colors.primary} />}
        <Text style={fieldStyles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  // Hero
  heroSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: colors.primaryGlow,
  },
  heroIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  heroSub: { color: colors.muted, fontSize: 11, marginTop: 2 },

  // Inputs
  inputWrap: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputWrapFocused: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.04)' },
  input: { color: colors.white, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { minHeight: 80 },

  // Picker
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  deadlineBtn: { borderColor: colors.rose + '40', backgroundColor: 'rgba(244,63,94,0.05)' },
  pickerBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pickerAvatar: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  pickerBtnText: { color: colors.white, fontSize: 14, fontWeight: '500' },
  pickerBtnSub: { color: colors.muted, fontSize: 11, marginTop: 1 },

  // Dropdown
  dropdownList: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, marginTop: 6, overflow: 'hidden',
  },
  dropdownItem: { borderBottomWidth: 1, borderBottomColor: colors.borderDim, overflow: 'hidden' },
  dropdownItemActive: {},
  dropdownItemInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  dropdownDot: { width: 6, height: 6, borderRadius: 3 },
  dropdownText: { color: colors.white, fontSize: 13, flex: 1 },

  // Row
  row2: { flexDirection: 'row', gap: 12 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  submitBtnWrap: { flex: 2, borderRadius: radius.md, overflow: 'hidden' },
  submitBtn: { alignItems: 'center', paddingVertical: 14 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

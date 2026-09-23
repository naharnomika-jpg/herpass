import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStudent } from '../api';
import { colors } from '../theme';

export default function AddStudentModal({ navigation }) {
  const [form, setForm] = useState({
    name: '', room_number: '', phone: '',
    course: '', year: '', guardian_contact: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    const required = ['name', 'room_number', 'phone', 'course', 'year', 'guardian_contact'];
    for (const k of required) {
      if (!form[k].trim()) {
        Alert.alert('Validation', `${k.replace('_', ' ')} is required.`);
        return;
      }
    }
    setLoading(true);
    try {
      const generatedId = `STU-${Math.floor(100 + Math.random() * 900)}`;
      const res = await createStudent({ ...form, student_id: generatedId });
      Alert.alert('✅ Added', res.message || 'Student added successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder, keyboardType }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={v => update(field, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-add" size={22} color={colors.pink} />
          <Text style={styles.title}>Add New Student</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <Field label="Room Number" field="room_number" placeholder="A-204" />
        <Field label="Full Name" field="name" placeholder="Priya Sharma" />
        <Field label="Phone" field="phone" placeholder="+91 9876543210" keyboardType="phone-pad" />
        <View style={styles.row2}>
          <Field label="Course" field="course" placeholder="B.Sc Computer Science" style={{ flex: 1 }} />
          <Field label="Year" field="year" placeholder="2nd Year" style={{ flex: 1 }} />
        </View>
        <Field label="Guardian Name & Contact" field="guardian_contact" placeholder="Mr. Sharma — +91 9988776655" />

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitBtnText}>Add Student</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  title: { flex: 1, color: colors.white, fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  field: { marginBottom: 14, flex: 1 },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    color: colors.white, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
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

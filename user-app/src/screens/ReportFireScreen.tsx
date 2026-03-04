import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

function generateReportId() {
  const num = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `#${num.slice(-5)}`;
}

const INCIDENT_TYPES = ['Electrical', 'Vehicle', 'Grass/Forest', 'Residential', 'Industrial', 'Other'];

export default function ReportFireScreen() {
  const navigation = useNavigation();
  const [reportId] = useState(generateReportId);
  const [reporterName, setReporterName] = useState('');
  const [reporterNumber, setReporterNumber] = useState('');
  const [location, setLocation] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [notes, setNotes] = useState('');
  const [locating, setLocating] = useState(false);

  async function useDeviceLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location permission denied', 'Please allow location permission to use this feature.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const text = `Lat ${pos.coords.latitude.toFixed(6)}, Lng ${pos.coords.longitude.toFixed(6)}`;
      setLocation(text);
    } catch {
      Alert.alert('Location unavailable', 'Unable to get your device location right now.');
    } finally {
      setLocating(false);
    }
  }

  function submitReport() {
    if (!location.trim() || !incidentType) {
      Alert.alert('Incomplete report', 'Please provide location and incident type.');
      return;
    }

    Alert.alert('Fire report submitted', `Report ID ${reportId}`);
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <MaterialCommunityIcons name="fire-circle" size={24} color="#fff" />
          <Text style={st.headerTitle}>Fire Report</Text>
        </View>
        <View style={st.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={st.content}>
        <Text style={st.reportId}>Report ID: {reportId}</Text>

        <View style={st.card}>
          <Text style={st.sectionTitle}>Reporter Information</Text>
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={18} color="#64748b" />
            <TextInput
              style={st.input}
              value={reporterName}
              onChangeText={setReporterName}
              placeholder="Name"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#64748b" />
            <TextInput
              style={st.input}
              value={reporterNumber}
              onChangeText={setReporterNumber}
              placeholder="Number"
              keyboardType="phone-pad"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#64748b" />
            <TextInput
              style={st.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Address / Location"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={st.secondaryBtn} onPress={useDeviceLocation} disabled={locating}>
            {locating ? <ActivityIndicator color="#0f2948" /> : <Text style={st.secondaryBtnText}>Use Device Location</Text>}
          </TouchableOpacity>
        </View>

        <View style={st.card}>
          <Text style={st.sectionTitle}>Incident Details</Text>
          <View style={st.chipWrap}>
            {INCIDENT_TYPES.map((item) => {
              const active = incidentType === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[st.chip, active && st.chipActive]}
                  onPress={() => setIncidentType(item)}
                >
                  <Text style={[st.chipText, active && st.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[st.sectionTitle, { marginTop: 14 }]}>Additional Notes</Text>
          <TextInput
            style={st.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter additional details"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={st.submitBtn} onPress={submitReport}>
          <Text style={st.submitBtnText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e8e8ec' },
  header: {
    backgroundColor: '#c63434',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerRightSpacer: { width: 34, height: 34 },
  content: { padding: 14, paddingBottom: 30 },
  reportId: { color: '#334155', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  card: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: '#0f172a', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  inputRow: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: { flex: 1, marginLeft: 8, color: '#0f2948', fontSize: 18 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#f1f5f9',
  },
  secondaryBtnText: { color: '#0f2948', fontSize: 14, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
  chipText: { color: '#334155', fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: '#991b1b' },
  notesInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    minHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f2948',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#cf2e2e',
    borderRadius: 26,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' },
});

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  contactNumber: string;
};

type Props = {
  onLogout?: () => void | Promise<void>;
};

export default function MeScreen({ onLogout }: Props) {
  const [profile, setProfile] = useState<Profile>({
    firstName: 'Mel Laurence',
    lastName: 'Balasico',
    email: 'lorenzbalasico@gmail.com',
    address: '',
    contactNumber: '',
  });

  function onChange<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Me</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
        {/* Profile Card */}
        <View style={st.card}>
          <View style={st.profileRow}>
            <View style={st.avatar}>
              <MaterialCommunityIcons name="account" size={30} color="#94a3b8" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={st.profileName}>{profile.firstName} {profile.lastName}</Text>
              <Text style={st.profileHandle}>@Laurence</Text>
            </View>
          </View>
          <TouchableOpacity style={st.changeImgBtn}>
            <MaterialCommunityIcons name="image-edit-outline" size={15} color="#64748b" />
            <Text style={st.changeImgText}>Add / Change Profile Image</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={st.card}>
          {/* First Name */}
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={18} color="#64748b" />
            <TextInput style={st.input} value={profile.firstName} onChangeText={(t) => onChange('firstName', t)} placeholder="First Name" placeholderTextColor="#94a3b8" />
          </View>
          {/* Last Name */}
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={18} color="#64748b" />
            <TextInput style={st.input} value={profile.lastName} onChangeText={(t) => onChange('lastName', t)} placeholder="Last Name" placeholderTextColor="#94a3b8" />
          </View>
          {/* Email */}
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={18} color="#64748b" />
            <TextInput style={st.input} value={profile.email} onChangeText={(t) => onChange('email', t)} placeholder="Email" keyboardType="email-address" placeholderTextColor="#94a3b8" />
          </View>
          {/* Address */}
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#64748b" />
            <TextInput style={st.input} value={profile.address} onChangeText={(t) => onChange('address', t)} placeholder="Address" placeholderTextColor="#94a3b8" />
          </View>
          {/* Contact */}
          <View style={st.inputRow}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#64748b" />
            <TextInput style={st.input} value={profile.contactNumber} onChangeText={(t) => onChange('contactNumber', t)} placeholder="Contact Number" keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
          </View>

          <TouchableOpacity style={st.saveBtn}>
            <Text style={st.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <View style={st.card}>
          <TouchableOpacity style={st.logoutBtn} onPress={onLogout}>
            <MaterialCommunityIcons name="logout" size={17} color="#fff" />
            <Text style={st.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#d4d4d8' },

  header: {
    backgroundColor: '#0d3558', paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },

  card: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 10 },

  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { color: '#0f2948', fontSize: 16, fontWeight: '800' },
  profileHandle: { color: '#64748b', fontSize: 13, marginTop: 1 },

  changeImgBtn: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
  },
  changeImgText: { color: '#475569', fontSize: 13, marginLeft: 6 },

  inputRow: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  input: { flex: 1, marginLeft: 8, color: '#0f2948', fontSize: 14 },

  saveBtn: {
    backgroundColor: '#1f678f', borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  logoutBtn: {
    backgroundColor: '#e72424', borderRadius: 24, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '800', marginLeft: 6 },
});

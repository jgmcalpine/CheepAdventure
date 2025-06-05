import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/types/navigation';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const [autoPlay, setAutoPlay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [audioQuality, setAudioQuality] = useState('high');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleAudioQualityChange = () => {
    setAudioQuality(audioQuality === 'high' ? 'low' : 'high');
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.userInfo}>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playback Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Auto-play on game open</Text>
          <Switch
            value={autoPlay}
            onValueChange={setAutoPlay}
            trackColor={{ false: '#767577', true: '#f4511e' }}
            thumbColor={autoPlay ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Audio Quality</Text>
          <TouchableOpacity
            style={styles.qualityButton}
            onPress={handleAudioQualityChange}
          >
            <Text style={styles.qualityText}>
              {audioQuality === 'high' ? 'High' : 'Low'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Game updates</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#f4511e' }}
            thumbColor={notifications ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  signOutButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  qualityButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qualityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  link: {
    marginBottom: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#f4511e',
  },
}); 
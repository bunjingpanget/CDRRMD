import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import RescueMapScreen from './src/screens/RescueMapScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import MeScreen from './src/screens/MeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { clearSession, loadSession, saveSession, SessionData } from './src/services/session';

const Tab = createBottomTabNavigator();

export default function App() {
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const existing = await loadSession();

      if (!mounted) {
        return;
      }

      if (existing?.user?.role === 'user') {
        setSession(existing);
      } else {
        await clearSession();
      }

      setBooting(false);
    }

    restoreSession().catch(() => {
      setBooting(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAuthenticated(nextSession: SessionData) {
    if (nextSession.user.role !== 'user') {
      await clearSession();
      return;
    }

    await saveSession(nextSession);
    setSession(nextSession);
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
    setAuthMode('login');
  }

  if (booting) {
    return (
      <View style={styles.booting}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    if (authMode === 'register') {
      return (
        <RegisterScreen
          onRegisterSuccess={handleAuthenticated}
          onShowLogin={() => setAuthMode('login')}
        />
      );
    }

    return (
      <LoginScreen
        onLoginSuccess={handleAuthenticated}
        onShowRegister={() => setAuthMode('register')}
      />
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0d3558',
            borderTopWidth: 0,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
              Home: 'home-variant',
              Weather: 'weather-partly-cloudy',
              'Safe Zone': 'shield-check',
              Family: 'account-group',
              Me: 'account-circle',
            };
            return <MaterialCommunityIcons name={icons[route.name] ?? 'circle'} size={22} color={color} />;
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
        <Tab.Screen name="Safe Zone" component={RescueMapScreen} />
        <Tab.Screen name="Family" component={FamilyScreen} />
        <Tab.Screen name="Me">
          {() => <MeScreen onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  booting: {
    flex: 1,
    backgroundColor: '#0d3558',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from './store/authStore';

// Screens
import LoginScreen from './screens/LoginScreen';
import CitizenScreen from './screens/CitizenScreen';
import PatrolScreen from './screens/PatrolScreen';

const Stack = createNativeStackNavigator();

function PlaceholderScreen({ route }) {
  const logout = useAuthStore(state => state.logout);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{route.name} Portal</Text>
      <Text style={styles.subtitle}>Mobile version in development.</Text>
      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const { user, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!isHydrated) return null; // Or splash screen

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
        {user == null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {user.role === 'CITIZEN' && <Stack.Screen name="Citizen" component={CitizenScreen} />}
            {user.role === 'PATROL_OFFICER' && <Stack.Screen name="Patrol" component={PatrolScreen} />}

            {/* Fallbacks for roles without dedicated mobile views yet */}
            {user.role === 'DETECTIVE' && <Stack.Screen name="Detective" component={PlaceholderScreen} />}
            {user.role === 'SUPERVISOR' && <Stack.Screen name="Supervisor" component={PlaceholderScreen} />}
            {user.role === 'PROSECUTOR' && <Stack.Screen name="Prosecutor" component={PlaceholderScreen} />}
            {user.role === 'JUDICIAL_ADMIN' && <Stack.Screen name="Judicial" component={PlaceholderScreen} />}
            {user.role === 'FORENSIC_OFFICER' && <Stack.Screen name="Forensic" component={PlaceholderScreen} />}
            {user.role === 'SYSTEM_ADMIN' && <Stack.Screen name="Admin" component={PlaceholderScreen} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  subtitle: { color: '#6b7280', marginVertical: 20 },
  btn: { backgroundColor: '#262626', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: 'white' }
});

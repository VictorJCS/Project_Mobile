// App.js
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { inicializarBanco } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/AppContext';

export default function App() {
  useEffect(() => {
    inicializarBanco();
  }, []);

  return (
    // AppProvider envolve tudo — assim qualquer tela acessa o tema e a fonte
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}
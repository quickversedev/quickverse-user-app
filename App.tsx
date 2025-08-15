import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/login/AuthProvider';
import { TabProvider } from './src/contexts/TabContext';

import { Route } from './src/routes/Route';
import { ThemeProvider } from './src/theme/ThemeContext';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TabProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <NavigationContainer>
              <AuthProvider>
                <Route />
              </AuthProvider>
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
      </TabProvider>
    </GestureHandlerRootView>
  );
}

export default App;

// src/navigation/AppNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../AppContext';

import Home            from '../screens/Home';
import ProdutosScreen  from '../screens/Estoque';
import EstoqueScreen   from '../screens/EstoqueScreen';
import VendasScreen    from '../screens/Vendas.js';
import HistoricoScreen from '../screens/Historico';
import ConfigScreen    from '../screens/configuracoes';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  // Pega as cores do contexto global
  const { cores } = useAppContext();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icones = {
            Início:        focused ? 'home'     : 'home-outline',
            Produtos:      focused ? 'cube'     : 'cube-outline',
            Estoque:       focused ? 'layers'   : 'layers-outline',
            Vendas:        focused ? 'cart'     : 'cart-outline',
            Histórico:     focused ? 'time'     : 'time-outline',
            Configurações: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={icones[route.name]} size={size} color={color} />;
        },
        // Usa as cores do contexto — muda automaticamente com o tema
        tabBarActiveTintColor:   cores.primaria,
        tabBarInactiveTintColor: cores.textoSub,
        tabBarStyle: {
          backgroundColor: cores.navBar,
          borderTopColor:  cores.navBorda,
          borderTopWidth:  0.5,
          height:          62 + insets.bottom,
          paddingBottom:   insets.bottom + 6,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: {
          backgroundColor: cores.header,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: cores.headerTexto,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
      })}
    >
      <Tab.Screen name="Início"        component={Home}            />
      <Tab.Screen name="Produtos"      component={ProdutosScreen}  />
      <Tab.Screen name="Estoque"       component={EstoqueScreen}   />
      <Tab.Screen name="Vendas"        component={VendasScreen}    />
      <Tab.Screen name="Histórico"     component={HistoricoScreen} />
      <Tab.Screen name="Configurações" component={ConfigScreen}    />
    </Tab.Navigator>
  );
}
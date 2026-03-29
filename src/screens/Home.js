// src/screens/Home.js
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';

const ATALHOS = [
  { label: 'Produtos',      icone: 'cube-outline',     tela: 'Produtos'      },
  { label: 'Estoque',       icone: 'layers-outline',   tela: 'Estoque'       },
  { label: 'Vendas',        icone: 'cart-outline',     tela: 'Vendas'        },
  { label: 'Histórico',     icone: 'time-outline',     tela: 'Histórico'     },
  { label: 'Configurações', icone: 'settings-outline', tela: 'Configurações' },
];

export default function Home({ navigation }) {
  const { cores, fontes, temaEscuro, escalaFonte, alternarTema, mudarEscalaFonte } = useAppContext();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>

      <View style={[styles.header, { backgroundColor: cores.header }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSub, {
            fontSize: fontes.pequena,
            color: temaEscuro ? '#81C784' : '#B7E4C7',
          }]}>
            Bem-vindo ao
          </Text>
          <Text style={[styles.headerTitulo, {
            fontSize: fontes.titulo,
            color: cores.headerTexto,
          }]}>
            Meu Estoque
          </Text>
        </View>

        <View style={styles.headerBotoes}>

          {/* Botão tamanho de fonte — cicla entre 1, 2 e 3 */}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => mudarEscalaFonte(escalaFonte === 3 ? 1 : escalaFonte + 1)}
          >
            {/* Mostra o nível atual da fonte */}
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {escalaFonte === 1 ? 'Aa' : escalaFonte === 2 ? 'Aa' : 'Aa'}
            </Text>
            {/* Ponto indicador do nível */}
            <View style={[styles.fonteIndicador, {
              backgroundColor: escalaFonte === 1 ? '#ffffff60' : '#fff',
              width: escalaFonte === 1 ? 4 : escalaFonte === 2 ? 6 : 8,
              height: escalaFonte === 1 ? 4 : escalaFonte === 2 ? 6 : 8,
            }]} />
          </TouchableOpacity>

          {/* Botão tema:
              - Mostra LUA quando está no tema CLARO (clica para escurecer)
              - Mostra SOL quando está no tema ESCURO (clica para clarear) */}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={alternarTema}
          >
            <Ionicons
              name={temaEscuro ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

        </View>
      </View>

      <View style={styles.grid}>
        {ATALHOS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.card, {
              backgroundColor: cores.fundoCard,
              borderLeftColor: cores.primaria,
            }]}
            onPress={() => navigation.navigate(item.tela)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: cores.primaria + '20' }]}>
              <Ionicons name={item.icone} size={28} color={cores.primaria} />
            </View>
            <Text style={[styles.cardLabel, {
              fontSize: fontes.media,
              color: cores.texto,
            }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={cores.textoSub} />
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28,
    flexDirection: 'row', alignItems: 'center',
  },
  headerSub:    { marginBottom: 2 },
  headerTitulo: { fontWeight: 'bold' },
  headerBotoes: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  fonteIndicador: { borderRadius: 10 },
  grid: { flex: 1, padding: 16, gap: 12 },
  card: {
    borderRadius: 14, borderLeftWidth: 5,
    paddingVertical: 18, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 2,
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  cardLabel: { flex: 1, fontWeight: '600' },
});
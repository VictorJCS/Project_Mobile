// src/screens/configuracoes.js
// Tela de CONFIGURAÇÕES — tema escuro e tamanho de fonte.
// Todas as alterações são aplicadas em tempo real em todo o app.

import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';

export default function ConfiguracoesScreen() {

  // Pega tudo do contexto global — sem useState local aqui
  // porque as preferências já vivem no AppContext
  const {
    temaEscuro,
    escalaFonte,
    alternarTema,
    mudarEscalaFonte,
    cores,
    fontes,
  } = useAppContext();

  // Opções de escala de fonte — igual ao Android/iOS
  const opcoesEscala = [
    { valor: 1, label: 'A',  descricao: 'Normal'  },
    { valor: 2, label: 'A',  descricao: 'Médio'   },
    { valor: 3, label: 'A',  descricao: 'Grande'  },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Seção: Aparência ── */}
        <View style={[styles.secao, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
          <Text style={[styles.secaoTitulo, { color: cores.textoSub }]}>
            Aparência
          </Text>

          {/* Toggle tema escuro */}
          <View style={[styles.itemSwitch, { borderBottomColor: cores.borda }]}>
            <View style={styles.itemSwitchEsq}>
              {/* Ícone muda conforme o tema atual */}
              <View style={[styles.itemIcone, {
                backgroundColor: temaEscuro ? '#1A2E24' : '#E8F5E9'
              }]}>
                <Ionicons
                  name={temaEscuro ? 'moon' : 'sunny-outline'}
                  size={20}
                  color={cores.primaria}
                />
              </View>
              <View>
                <Text style={[styles.itemLabel, { color: cores.texto, fontSize: fontes.normal }]}>
                  Tema escuro
                </Text>
                <Text style={[styles.itemSub, { color: cores.textoSub, fontSize: fontes.pequena }]}>
                  {temaEscuro ? 'Ativado — fundo escuro' : 'Desativado — fundo claro'}
                </Text>
              </View>
            </View>
            <Switch
              value={temaEscuro}
              onValueChange={alternarTema}
              trackColor={{ false: '#E0E0E0', true: cores.switchTrack + '80' }}
              thumbColor={temaEscuro ? cores.primaria : '#f4f4f4'}
            />
          </View>

        </View>

        {/* ── Seção: Tamanho do texto ── */}
        <View style={[styles.secao, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
          <Text style={[styles.secaoTitulo, { color: cores.textoSub }]}>
            Tamanho do texto
          </Text>

          <Text style={[styles.secaoDesc, { color: cores.textoSub, fontSize: fontes.pequena }]}>
            Ajusta o tamanho de todo o texto do app — funciona igual ao ajuste de fonte do Android e iOS
          </Text>

          {/* Preview do texto no tamanho atual */}
          <View style={[styles.preview, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
            <Text style={[styles.previewTexto, { color: cores.texto, fontSize: fontes.media }]}>
              Exemplo de texto
            </Text>
            <Text style={[styles.previewSub, { color: cores.textoSub, fontSize: fontes.normal }]}>
              Descrição do produto
            </Text>
            <Text style={[styles.previewValor, { color: cores.primaria, fontSize: fontes.grande }]}>
              R$ 99,90
            </Text>
          </View>

          {/* Seletor de escala — 3 botões como no Android/iOS */}
          <View style={styles.escalaContainer}>
            {opcoesEscala.map((opcao) => {
              const ativo = escalaFonte === opcao.valor;
              // Tamanho do "A" cresce para visualizar a diferença
              const tamanhoA = opcao.valor === 1 ? 16 : opcao.valor === 2 ? 22 : 28;

              return (
                <TouchableOpacity
                  key={opcao.valor}
                  style={[
                    styles.escalaBtn,
                    {
                      backgroundColor: ativo ? cores.primaria : cores.fundo,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    }
                  ]}
                  onPress={() => mudarEscalaFonte(opcao.valor)}
                >
                  {/* Letra A em tamanho crescente para visualizar */}
                  <Text style={[
                    styles.escalaBtnLetra,
                    {
                      fontSize: tamanhoA,
                      color: ativo ? '#fff' : cores.texto,
                      fontWeight: ativo ? '700' : '400',
                    }
                  ]}>
                    A
                  </Text>
                  <Text style={[
                    styles.escalaBtnLabel,
                    {
                      fontSize: 11,
                      color: ativo ? '#fff' : cores.textoSub,
                    }
                  ]}>
                    {opcao.descricao}
                  </Text>
                  {/* Check se ativo */}
                  {ativo && (
                    <View style={styles.escalaCheck}>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Barra de progresso visual — igual ao iOS */}
          <View style={[styles.barraContainer, { backgroundColor: cores.borda }]}>
            <View style={[
              styles.barraProgresso,
              {
                backgroundColor: cores.primaria,
                // Largura proporcional à escala selecionada
                width: `${((escalaFonte - 1) / 2) * 100}%`,
              }
            ]} />
            {/* Marcadores nas posições 1, 2 e 3 */}
            {[0, 50, 100].map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.barraMarcador,
                  {
                    left: `${pos}%`,
                    backgroundColor: escalaFonte > i ? cores.primaria : cores.borda,
                  }
                ]}
              />
            ))}
          </View>

          {/* Legenda pequena-grande */}
          <View style={styles.barraLegenda}>
            <Text style={[{ color: cores.textoSub, fontSize: 11 }]}>Menor</Text>
            <Text style={[{ color: cores.textoSub, fontSize: 11 }]}>Maior</Text>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  // Seção com borda
  secao: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  secaoTitulo: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  secaoDesc: {
    marginHorizontal: 16, marginBottom: 16, lineHeight: 18,
  },

  // Item com Switch
  itemSwitch: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemSwitchEsq: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcone: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  itemLabel: { fontWeight: '600', marginBottom: 2 },
  itemSub: { lineHeight: 16 },

  // Preview do texto
  preview: {
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 12, borderWidth: 0.5,
    padding: 16, gap: 6,
  },
  previewTexto: { fontWeight: '600' },
  previewSub: {},
  previewValor: { fontWeight: '700' },

  // Seletor de escala (3 botões)
  escalaContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  escalaBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, gap: 4,
    minHeight: 80,
  },
  escalaBtnLetra: { lineHeight: 34 },
  escalaBtnLabel: { fontWeight: '500' },
  escalaCheck: { position: 'absolute', top: 6, right: 6 },

  // Barra de progresso
  barraContainer: {
    height: 4, borderRadius: 2,
    marginHorizontal: 16, marginBottom: 6,
    position: 'relative',
  },
  barraProgresso: {
    height: 4, borderRadius: 2,
    position: 'absolute', left: 0, top: 0,
  },
  barraMarcador: {
    width: 10, height: 10, borderRadius: 5,
    position: 'absolute', top: -3,
    marginLeft: -5,
  },
  barraLegenda: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 16,
  },
});
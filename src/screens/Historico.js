// src/screens/Historico.js
// Tela de HISTÓRICO — entradas e saídas com responsável.
// Correção: data e quantidade em coluna (não em linha) para não estourar na fonte grande.

import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { listarHistorico, listarEntradas, listarSaidas, excluirRegistroHistorico } from '../database/historicoDAO';

export default function HistoricoScreen() {
  const { cores, fontes } = useAppContext();
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro]       = useState('todos');

  useFocusEffect(useCallback(() => { carregarHistorico('todos'); setFiltro('todos'); }, []));

  function carregarHistorico(tipo) {
    setRegistros(
      tipo === 'entrada' ? listarEntradas() :
      tipo === 'saida'   ? listarSaidas()   :
      listarHistorico()
    );
  }

  function mudarFiltro(tipo) { setFiltro(tipo); carregarHistorico(tipo); }

  function confirmarCancelar(item) {
    Alert.alert('Remover registro', `Deseja remover este registro?`, [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', style: 'destructive',
        onPress: () => { excluirRegistroHistorico(item.id); carregarHistorico(filtro); } },
    ]);
  }

  // Soma entradas e saídas para o resumo no topo
  const totalEntradas = registros.filter(r => r.tipo === 'entrada').reduce((s, r) => s + (r.valor_total || 0), 0);
  const totalSaidas   = registros.filter(r => r.tipo === 'saida').reduce((s, r) => s + (r.valor_total || 0), 0);

  function formatarValor(v) {
    return `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function renderItem({ item }) {
    const isEntrada = item.tipo === 'entrada';
    const cor   = isEntrada ? cores.sucesso  : cores.perigo;
    const corBg = isEntrada ? cores.badgeVerdeBg : cores.badgeVermBg;
    const icone = isEntrada ? 'arrow-down-circle' : 'arrow-up-circle';

    return (
      <View style={[styles.card, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>

        {/* Linha do topo: badge tipo + nome + botão remover */}
        <View style={styles.cardTopo}>
          <View style={[styles.tipoBadge, { backgroundColor: corBg }]}>
            <Ionicons name={icone} size={14} color={cor} />
            <Text style={[{ fontSize: fontes.pequena, fontWeight: '700', color: cor }]}>
              {isEntrada ? 'Entrada' : 'Saída'}
            </Text>
          </View>
          <Text style={[styles.cardNome, { color: cores.texto, fontSize: fontes.normal }]} numberOfLines={1}>
            {item.produto_nome}
          </Text>
          <TouchableOpacity onPress={() => confirmarCancelar(item)}>
            <Ionicons name="close-circle-outline" size={20} color={cores.textoSub} />
          </TouchableOpacity>
        </View>

        {/* Informações em coluna — evita estouro na fonte grande */}
        <View style={[styles.cardInfos, { borderTopColor: cores.borda }]}>

          {/* Quantidade */}
          {item.quantidade ? (
            <View style={styles.infoLinha}>
              <Ionicons name="layers-outline" size={13} color={cores.textoSub} />
              <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub }]}>
                {item.quantidade} unidade(s)
              </Text>
            </View>
          ) : null}

          {/* Data e hora — linha separada para não estourar */}
          <View style={styles.infoLinha}>
            <Ionicons name="time-outline" size={13} color={cores.textoSub} />
            <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub, flex: 1 }]}
              numberOfLines={1}
            >
              {item.data_hora}
            </Text>
          </View>

          {/* Responsável — quem lançou ou para quem foi vendido */}
          {item.responsavel ? (
            <View style={styles.infoLinha}>
              <Ionicons name="person-outline" size={13} color={cores.textoSub} />
              <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub }]}>
                {isEntrada ? 'Lançado por' : 'Vendido para'}: {item.responsavel}
              </Text>
            </View>
          ) : null}

        </View>

        {/* Valor total da movimentação */}
        <View style={[styles.cardRodape, { borderTopColor: cores.borda }]}>
          <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub }]}>
            {isEntrada ? 'Valor investido' : 'Valor recebido'}
          </Text>
          <Text style={[{ fontSize: fontes.media, fontWeight: '700', color: cor }]}>
            {formatarValor(item.valor_total)}
          </Text>
        </View>

      </View>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: cores.fundo }]}>

      {/* Card resumo entradas/saídas */}
      <View style={[styles.resumoContainer, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <View style={[styles.resumoBloco, { borderLeftColor: cores.sucesso }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="arrow-down-circle" size={16} color={cores.sucesso} />
            <Text style={[{ fontSize: fontes.pequena, fontWeight: '600', color: cores.sucesso }]}>Entradas</Text>
          </View>
          <Text style={[{ fontSize: fontes.media, fontWeight: '700', color: cores.sucesso }]}>{formatarValor(totalEntradas)}</Text>
        </View>
        <View style={[styles.divisor, { backgroundColor: cores.borda }]} />
        <View style={[styles.resumoBloco, { borderLeftColor: cores.perigo }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="arrow-up-circle" size={16} color={cores.perigo} />
            <Text style={[{ fontSize: fontes.pequena, fontWeight: '600', color: cores.perigo }]}>Saídas</Text>
          </View>
          <Text style={[{ fontSize: fontes.media, fontWeight: '700', color: cores.perigo }]}>{formatarValor(totalSaidas)}</Text>
        </View>
      </View>

      {/* Filtros Todos / Entradas / Saídas */}
      <View style={[styles.filtros, { backgroundColor: cores.filtroFundo }]}>
        {[
          { key: 'todos',   label: 'Todos'    },
          { key: 'entrada', label: 'Entradas' },
          { key: 'saida',   label: 'Saídas'   },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroBotao, filtro === f.key && [styles.filtroBotaoAtivo, { backgroundColor: cores.filtroAtivo }]]}
            onPress={() => mudarFiltro(f.key)}
          >
            <Text style={[{ fontWeight: '600', fontSize: fontes.normal, color: filtro === f.key ? cores.primaria : cores.textoSub }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contador */}
      <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub, marginHorizontal: 16, marginBottom: 8 }]}>
        {registros.length === 0 ? 'Nenhum registro' : `${registros.length} registro(s)`}
      </Text>

      {/* Lista */}
      <FlatList
        data={registros}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 50, gap: 10 }}>
            <Ionicons name="time-outline" size={48} color={cores.textoSub} />
            <Text style={[{ fontSize: fontes.media, color: cores.textoSub }]}>Nenhum registro ainda</Text>
          </View>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  resumoContainer: { flexDirection: 'row', margin: 16, borderRadius: 14, padding: 16, elevation: 2, borderWidth: 0.5 },
  resumoBloco: { flex: 1, borderLeftWidth: 3, paddingLeft: 12 },
  divisor: { width: 1, marginHorizontal: 16 },
  filtros: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 4, gap: 4 },
  filtroBotao: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filtroBotaoAtivo: { elevation: 2 },
  card: { borderRadius: 14, padding: 14, elevation: 2, borderWidth: 0.5 },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  cardNome: { flex: 1, fontWeight: '700' },

  // Infos em coluna — resolve o estouro da data na fonte grande
  cardInfos: { borderTopWidth: 0.5, paddingTop: 8, marginBottom: 10, gap: 6 },
  infoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, paddingTop: 10 },
});
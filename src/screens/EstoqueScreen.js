// src/screens/EstoqueScreen.js
// Tela de ESTOQUE — usa cores e fontes do contexto global

import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { listarProdutos, atualizarQuantidade } from '../database/produtosDAO';

export default function EstoqueScreen() {
  const { cores, fontes } = useAppContext();
  const [produtos, setProdutos]         = useState([]);
  const [editandoQtdId, setEditandoQtdId] = useState(null);
  const [novaQtd, setNovaQtd]           = useState('');
  const [busca, setBusca]               = useState('');

  useFocusEffect(useCallback(() => { carregarProdutos(); }, []));
  function carregarProdutos() { setProdutos(listarProdutos()); }

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalEstoque = produtos.reduce((soma, p) => soma + p.valor * p.quantidade, 0);

  function abrirEdicaoQtd(produto) { setEditandoQtdId(produto.id); setNovaQtd(String(produto.quantidade)); }

  function salvarQtd(produtoId) {
    const qtd = parseInt(novaQtd);
    if (isNaN(qtd) || qtd < 0) { Alert.alert('Atenção', 'Digite uma quantidade válida.'); return; }
    atualizarQuantidade(produtoId, qtd);
    setEditandoQtdId(null); setNovaQtd(''); carregarProdutos();
  }

  function formatarValor(v) {
    return `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function corBadgeQtd(qtd) {
    if (qtd === 0) return { bg: cores.badgeVermBg, texto: cores.badgeVermText };
    if (qtd <= 5)  return { bg: cores.badgeAmarBg, texto: cores.badgeAmarText };
    return               { bg: cores.badgeVerdeBg, texto: cores.badgeVerdeText };
  }

  function renderItem({ item }) {
    const badge = corBadgeQtd(item.quantidade);
    const estaEditando = editandoQtdId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <View style={styles.cardTopo}>
          <View style={styles.cardTopoEsq}>
            <Text style={[styles.cardNome, { color: cores.texto, fontSize: fontes.media }]}>{item.nome}</Text>
            {item.codigo ? <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>#{item.codigo}</Text> : null}
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeTexto, { color: badge.texto, fontSize: fontes.normal }]}>{item.quantidade} un.</Text>
          </View>
        </View>
        <View style={[styles.cardValores, { backgroundColor: cores.fundo }]}>
          <View>
            <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>Valor unitário</Text>
            <Text style={[{ color: cores.texto, fontWeight: '600', fontSize: fontes.normal }]}>{formatarValor(item.valor)}</Text>
          </View>
          <View>
            <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>Total em estoque</Text>
            <Text style={[{ color: cores.primaria, fontWeight: '600', fontSize: fontes.normal }]}>{formatarValor(item.valor * item.quantidade)}</Text>
          </View>
        </View>
        {estaEditando ? (
          <View style={styles.edicaoQtd}>
            <TextInput style={[styles.inputQtd, { borderColor: cores.primaria, backgroundColor: cores.fundoInput, color: cores.texto, fontSize: fontes.normal }]} value={novaQtd} onChangeText={setNovaQtd} keyboardType="number-pad" autoFocus selectTextOnFocus />
            <TouchableOpacity style={[styles.btnConfirmar, { backgroundColor: cores.primaria }]} onPress={() => salvarQtd(item.id)}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnCancelarQtd, { backgroundColor: cores.fundoSecundario }]} onPress={() => { setEditandoQtdId(null); setNovaQtd(''); }}>
              <Ionicons name="close" size={20} color={cores.textoSub} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.btnAjustarQtd, { borderColor: cores.primaria }]} onPress={() => abrirEdicaoQtd(item)}>
            <Ionicons name="create-outline" size={15} color={cores.primaria} />
            <Text style={[styles.btnAjustarQtdTexto, { color: cores.primaria, fontSize: fontes.normal }]}>Ajustar quantidade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <View style={[styles.resumo, { backgroundColor: cores.resumoBg }]}>
        <View>
          <Text style={[{ color: cores.resumoTexto, fontSize: fontes.pequena, opacity: 0.8 }]}>Total em estoque</Text>
          <Text style={[{ color: cores.resumoTexto, fontWeight: '700', fontSize: fontes.grande }]}>{formatarValor(totalEstoque)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[{ color: cores.resumoTexto, fontSize: fontes.pequena, opacity: 0.8 }]}>Produtos</Text>
          <Text style={[{ color: cores.resumoTexto, fontWeight: '700', fontSize: fontes.grande }]}>{produtos.length}</Text>
        </View>
      </View>
      <View style={[styles.buscaContainer, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <Ionicons name="search-outline" size={18} color={cores.textoSub} style={{ marginRight: 8 }} />
        <TextInput style={[styles.buscaInput, { color: cores.texto, fontSize: fontes.normal }]} placeholder="Buscar produto..." placeholderTextColor={cores.textoSub} value={busca} onChangeText={setBusca} />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={18} color={cores.textoSub} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginHorizontal: 16, marginBottom: 8 }]}>
        {produtosFiltrados.length === 0 ? 'Nenhum produto encontrado' : `${produtosFiltrados.length} produto(s) no estoque`}
      </Text>
      <FlatList data={produtosFiltrados} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="layers-outline" size={48} color={cores.textoSub} />
            <Text style={[{ color: cores.textoSub, fontSize: fontes.media, fontWeight: '500' }]}>
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resumo: { margin: 16, borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buscaContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  buscaInput: { flex: 1 },
  lista: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { borderRadius: 14, padding: 14, elevation: 2, borderWidth: 0.5 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTopoEsq: { flex: 1, marginRight: 10 },
  cardNome: { fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTexto: { fontWeight: '700' },
  cardValores: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, padding: 10, marginBottom: 10 },
  btnAjustarQtd: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  btnAjustarQtdTexto: { fontWeight: '600' },
  edicaoQtd: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputQtd: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 },
  btnConfirmar: { padding: 8, borderRadius: 8 },
  btnCancelarQtd: { padding: 8, borderRadius: 8 },
  vazio: { alignItems: 'center', paddingTop: 60, gap: 12 },
});
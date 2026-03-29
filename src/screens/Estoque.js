// src/screens/Estoque.js
// Tela de PRODUTOS — cadastrar, editar e excluir produtos.
// Inclui campo "Lançado por" para identificar quem cadastrou.

import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import {
  listarProdutos, adicionarProduto,
  editarProduto, excluirProduto,
} from '../database/produtosDAO';

export default function ProdutosScreen() {
  const { cores, fontes } = useAppContext();

  // Estados dos campos do formulário
  const [produtos, setProdutos]       = useState([]);
  const [nome, setNome]               = useState('');
  const [descricao, setDescricao]     = useState('');
  const [valor, setValor]             = useState('');
  const [quantidade, setQuantidade]   = useState('');
  const [codigo, setCodigo]           = useState('');
  const [lancadoPor, setLancadoPor]   = useState(''); // NOVO: quem cadastrou
  const [editandoId, setEditandoId]   = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  // Recarrega lista sempre que a tela recebe foco
  useFocusEffect(useCallback(() => { carregarProdutos(); }, []));

  function carregarProdutos() { setProdutos(listarProdutos()); }

  // Reseta todos os campos e fecha o formulário
  function limparForm() {
    setNome(''); setDescricao(''); setValor('');
    setQuantidade(''); setCodigo(''); setLancadoPor('');
    setEditandoId(null); setMostrarForm(false);
  }

  // Valida e salva o produto (cria ou edita)
  function salvar() {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return; }
    if (!valor.trim() || isNaN(parseFloat(valor))) { Alert.alert('Atenção', 'Digite um valor válido.'); return; }
    if (!quantidade.trim() || isNaN(parseInt(quantidade))) { Alert.alert('Atenção', 'Digite uma quantidade válida.'); return; }

    const v = parseFloat(valor.replace(',', '.'));
    const q = parseInt(quantidade);

    if (editandoId) {
      // Atualiza produto existente incluindo o campo lancado_por
      editarProduto(editandoId, nome.trim(), descricao.trim(), v, q, codigo.trim(), lancadoPor.trim());
      Alert.alert('Sucesso', 'Produto atualizado!');
    } else {
      // Cria novo produto com o campo lancado_por
      adicionarProduto(nome.trim(), descricao.trim(), v, q, codigo.trim(), lancadoPor.trim());
      Alert.alert('Sucesso', 'Produto cadastrado!');
    }
    limparForm(); carregarProdutos();
  }

  // Preenche o formulário para edição
  function abrirEdicao(produto) {
    setNome(produto.nome);
    setDescricao(produto.descricao || '');
    setValor(String(produto.valor));
    setQuantidade(String(produto.quantidade));
    setCodigo(produto.codigo || '');
    setLancadoPor(produto.lancado_por || ''); // carrega quem lançou
    setEditandoId(produto.id);
    setMostrarForm(true);
  }

  // Confirma exclusão com alerta
  function confirmarExclusao(produto) {
    Alert.alert('Excluir produto', `Deseja excluir "${produto.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive',
        onPress: () => { excluirProduto(produto.id); carregarProdutos(); } },
    ]);
  }

  // Formata número para moeda brasileira
  function formatarValor(v) {
    return `R$ ${parseFloat(v).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
  }

  function renderProduto({ item }) {
    return (
      <View style={[styles.card, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>

        {/* Nome e código */}
        <View style={styles.cardTop}>
          <Text style={[styles.cardNome, { color: cores.texto, fontSize: fontes.media }]}>
            {item.nome}
          </Text>
          {item.codigo
            ? <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>#{item.codigo}</Text>
            : null}
        </View>

        {/* Descrição */}
        {item.descricao
          ? <Text style={[{ color: cores.textoSub, fontSize: fontes.normal, marginBottom: 8 }]}>
              {item.descricao}
            </Text>
          : null}

        {/* Lançado por — só exibe se preenchido */}
        {item.lancado_por
          ? <View style={[styles.responsavelTag, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
              <Ionicons name="person-outline" size={12} color={cores.textoSub} />
              <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>
                Lançado por: {item.lancado_por}
              </Text>
            </View>
          : null}

        {/* Valores: unitário, quantidade e total
            adjustsFontSizeToFit evita estouro na fonte grande */}
        <View style={[styles.cardBottom, { backgroundColor: cores.fundo }]}>
          <View style={styles.cardInfo}>
            <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginBottom: 2 }]}>
              Valor unit.
            </Text>
            <Text
              style={[{ color: cores.texto, fontWeight: '600', fontSize: fontes.normal }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatarValor(item.valor)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginBottom: 2 }]}>
              Quantidade
            </Text>
            <Text
              style={[{ color: cores.texto, fontWeight: '600', fontSize: fontes.normal }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {item.quantidade}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginBottom: 2 }]}>
              Total
            </Text>
            <Text
              style={[{ color: cores.primaria, fontWeight: '600', fontSize: fontes.normal }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatarValor(item.valor * item.quantidade)}
            </Text>
          </View>
        </View>

        {/* Botões editar/excluir */}
        <View style={[styles.cardAcoes, { borderTopColor: cores.borda }]}>
          <TouchableOpacity style={[styles.btnEditar, { borderColor: cores.primaria }]} onPress={() => abrirEdicao(item)}>
            <Ionicons name="pencil-outline" size={16} color={cores.primaria} />
            <Text style={[{ color: cores.primaria, fontWeight: '600', fontSize: fontes.normal }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnExcluir, { borderColor: cores.perigo }]} onPress={() => confirmarExclusao(item)}>
            <Ionicons name="trash-outline" size={16} color={cores.perigo} />
            <Text style={[{ color: cores.perigo, fontWeight: '600', fontSize: fontes.normal }]}>Excluir</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>

      {/* Botão abrir formulário */}
      {!mostrarForm && (
        <TouchableOpacity
          style={[styles.btnAdicionar, { backgroundColor: cores.primaria }]}
          onPress={() => setMostrarForm(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={[{ color: '#fff', fontWeight: '600', fontSize: fontes.media }]}>
            Novo Produto
          </Text>
        </TouchableOpacity>
      )}

      {/* Formulário */}
      {mostrarForm && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ padding: 16 }}>
            <Text style={[{ fontWeight: '700', marginBottom: 20, color: cores.texto, fontSize: fontes.grande }]}>
              {editandoId ? 'Editar Produto' : 'Novo Produto'}
            </Text>

            {/* Campo nome */}
            <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Nome do produto *</Text>
            <TextInput style={[styles.input, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="Ex: Camiseta azul" placeholderTextColor={cores.textoSub} value={nome} onChangeText={setNome} />

            {/* Campo descrição */}
            <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Descrição</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="Detalhes do produto (opcional)" placeholderTextColor={cores.textoSub} value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} />

            {/* Valor e Quantidade lado a lado */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Valor (R$) *</Text>
                <TextInput style={[styles.input, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="0,00" placeholderTextColor={cores.textoSub} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Quantidade *</Text>
                <TextInput style={[styles.input, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="0" placeholderTextColor={cores.textoSub} value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" />
              </View>
            </View>

            {/* Código */}
            <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Código (opcional)</Text>
            <TextInput style={[styles.input, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="Ex: 0001" placeholderTextColor={cores.textoSub} value={codigo} onChangeText={setCodigo} />

            {/* NOVO: Campo lançado por */}
            <Text style={[styles.label, { color: cores.textoSub, fontSize: fontes.normal }]}>Lançado por (opcional)</Text>
            <TextInput style={[styles.input, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]} placeholder="Ex: João" placeholderTextColor={cores.textoSub} value={lancadoPor} onChangeText={setLancadoPor} />

            {/* Botões salvar/cancelar */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 }}>
              <TouchableOpacity style={[styles.btnSalvar, { backgroundColor: cores.primaria }]} onPress={salvar}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontes.media }]}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnCancelar, { backgroundColor: cores.fundoSecundario }]} onPress={limparForm}>
                <Ionicons name="close" size={20} color={cores.textoSub} />
                <Text style={[{ color: cores.textoSub, fontWeight: '600', fontSize: fontes.media }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Lista de produtos */}
      {!mostrarForm && (
        <>
          <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginHorizontal: 16, marginBottom: 8, marginTop: 4 }]}>
            {produtos.length === 0 ? 'Nenhum produto cadastrado' : `${produtos.length} produto(s) cadastrado(s)`}
          </Text>
          <FlatList data={produtos} keyExtractor={(item) => String(item.id)} renderItem={renderProduto} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  btnAdicionar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 14, borderRadius: 12, justifyContent: 'center' },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13 },

  // Tag "lançado por" abaixo da descrição
  responsavelTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 0.5, marginBottom: 8,
  },

  // Linha de valores com 3 colunas iguais
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, marginBottom: 10, borderRadius: 8, padding: 10,
  },
  cardInfo: {
    flex: 1,           // cada coluna ocupa exatamente 1/3
    alignItems: 'center',
    overflow: 'hidden', // impede estouro para fora da coluna
  },

  card: { borderRadius: 14, padding: 16, elevation: 2, borderWidth: 0.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardNome: { fontWeight: '700', flex: 1 },
  cardAcoes: { flexDirection: 'row', gap: 10, borderTopWidth: 0.5, paddingTop: 10 },
  btnEditar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  btnExcluir: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  btnSalvar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  btnCancelar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
});
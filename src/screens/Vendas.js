// src/screens/Vendas.js
// Tela de VENDAS — carrinho de compras com campo "vendido para".

import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { buscarProdutoPorNome } from '../database/produtosDAO';
import { finalizarVenda } from '../database/vendasDAO';

export default function VendasScreen() {
  const { cores, fontes } = useAppContext();

  // Estados do carrinho e dos campos
  const [carrinho, setCarrinho]                   = useState([]);
  const [nomeBusca, setNomeBusca]                 = useState('');
  const [qtdAdicionar, setQtdAdicionar]           = useState('1');
  const [produtoEncontrado, setProdutoEncontrado] = useState(null);
  const [erroBusca, setErroBusca]                 = useState('');
  const [vendidoPara, setVendidoPara]             = useState(''); // NOVO: nome do cliente

  // Limpa tudo ao entrar na tela para evitar venda anterior aberta
  useFocusEffect(useCallback(() => { limparTudo(); }, []));

  // Busca produto no banco pelo nome digitado
  function buscarProduto() {
    if (!nomeBusca.trim()) { setErroBusca('Digite o nome do produto.'); return; }
    const produto = buscarProdutoPorNome(nomeBusca.trim());
    if (!produto) { setProdutoEncontrado(null); setErroBusca('Produto não encontrado.'); return; }
    if (produto.quantidade === 0) { setProdutoEncontrado(null); setErroBusca(`"${produto.nome}" está sem estoque.`); return; }
    setProdutoEncontrado(produto); setErroBusca('');
  }

  // Adiciona o produto encontrado ao carrinho
  function adicionarAoCarrinho() {
    if (!produtoEncontrado) return;
    const qtd = parseInt(qtdAdicionar);
    if (isNaN(qtd) || qtd <= 0) { Alert.alert('Atenção', 'Digite uma quantidade válida.'); return; }
    if (qtd > produtoEncontrado.quantidade) { Alert.alert('Estoque insuficiente', `Disponível: ${produtoEncontrado.quantidade}.`); return; }

    // Se o produto já está no carrinho, soma a quantidade
    const jaNoCarrinho = carrinho.find(i => i.produto_id === produtoEncontrado.id);
    if (jaNoCarrinho) {
      const novaQtd = jaNoCarrinho.quantidade + qtd;
      if (novaQtd > produtoEncontrado.quantidade) { Alert.alert('Estoque insuficiente', `Disponível: ${produtoEncontrado.quantidade}.`); return; }
      setCarrinho(carrinho.map(i => i.produto_id === produtoEncontrado.id ? { ...i, quantidade: novaQtd } : i));
    } else {
      // Produto novo no carrinho
      setCarrinho([...carrinho, {
        produto_id:     produtoEncontrado.id,
        nome_produto:   produtoEncontrado.nome,
        quantidade:     qtd,
        valor_unitario: produtoEncontrado.valor,
      }]);
    }
    // Limpa os campos de busca após adicionar
    setNomeBusca(''); setQtdAdicionar('1'); setProdutoEncontrado(null); setErroBusca('');
  }

  // Remove um item do carrinho pelo ID do produto
  function removerDoCarrinho(produto_id) {
    setCarrinho(carrinho.filter(i => i.produto_id !== produto_id));
  }

  // Limpa tudo: carrinho, campos e estados
  function limparTudo() {
    setCarrinho([]); setNomeBusca(''); setQtdAdicionar('1');
    setProdutoEncontrado(null); setErroBusca(''); setVendidoPara('');
  }

  // Soma o valor total de todos os itens do carrinho
  const totalCarrinho = carrinho.reduce(
    (soma, item) => soma + item.valor_unitario * item.quantidade, 0
  );

  function formatarValor(v) {
    return `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Pede confirmação antes de finalizar
  function confirmarFinalizarVenda() {
    if (carrinho.length === 0) { Alert.alert('Carrinho vazio', 'Adicione pelo menos um produto.'); return; }
    const cliente = vendidoPara.trim() ? `\nCliente: ${vendidoPara.trim()}` : '';
    Alert.alert(
      'Finalizar venda',
      `Total: ${formatarValor(totalCarrinho)}${cliente}\n\nConfirmar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {
            // Passa o nome do cliente para o DAO
            finalizarVenda(carrinho, vendidoPara.trim());
            Alert.alert('Venda realizada!', `Total: ${formatarValor(totalCarrinho)}`, [{ text: 'OK', onPress: limparTudo }]);
          }
        },
      ]
    );
  }

  // Pede confirmação antes de cancelar
  function confirmarCancelar() {
    if (carrinho.length === 0) return;
    Alert.alert('Cancelar venda', 'Remover todos os itens do carrinho?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: limparTudo },
    ]);
  }

  // Renderiza cada item do carrinho
  function renderItemCarrinho({ item }) {
    return (
      <View style={[styles.itemCarrinho, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontWeight: '700', color: cores.texto, fontSize: fontes.normal }]}>{item.nome_produto}</Text>
          <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginTop: 2 }]}>{item.quantidade} × {formatarValor(item.valor_unitario)}</Text>
        </View>
        <Text style={[{ fontWeight: '700', color: cores.primaria, marginRight: 10, fontSize: fontes.normal }]}>{formatarValor(item.valor_unitario * item.quantidade)}</Text>
        <TouchableOpacity onPress={() => removerDoCarrinho(item.produto_id)}>
          <Ionicons name="trash-outline" size={18} color={cores.perigo} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Área de busca */}
        <View style={[styles.buscaArea, { backgroundColor: cores.fundoCard, borderBottomColor: cores.borda }]}>
          <Text style={[{ fontWeight: '700', marginBottom: 10, color: cores.texto, fontSize: fontes.media }]}>
            Adicionar produto
          </Text>

          {/* Campo de busca + botão lupa */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]}
              placeholder="Nome do produto"
              placeholderTextColor={cores.textoSub}
              value={nomeBusca}
              onChangeText={(t) => { setNomeBusca(t); setProdutoEncontrado(null); setErroBusca(''); }}
              onSubmitEditing={buscarProduto}
              returnKeyType="search"
            />
            <TouchableOpacity style={[styles.btnBuscar, { backgroundColor: cores.primaria }]} onPress={buscarProduto}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Mensagem de erro */}
          {erroBusca ? <Text style={[{ color: cores.perigo, fontSize: fontes.pequena, marginBottom: 6 }]}>{erroBusca}</Text> : null}

          {/* Card verde do produto encontrado */}
          {produtoEncontrado && (
            <View style={[styles.produtoEncontrado, { backgroundColor: cores.fundoSecundario, borderColor: cores.primaria }]}>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontWeight: '700', color: cores.texto, fontSize: fontes.normal }]}>{produtoEncontrado.nome}</Text>
                <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, marginTop: 2 }]}>{formatarValor(produtoEncontrado.valor)} · {produtoEncontrado.quantidade} disponíveis</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={cores.primaria} />
            </View>
          )}

          {/* Quantidade + botão adicionar */}
          {produtoEncontrado && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[{ color: cores.textoSub, fontWeight: '600', fontSize: fontes.normal }]}>Qtd:</Text>
              <TextInput style={[styles.inputQtd, { borderColor: cores.borda, backgroundColor: cores.fundoInput, color: cores.texto, fontSize: fontes.normal }]} value={qtdAdicionar} onChangeText={setQtdAdicionar} keyboardType="number-pad" selectTextOnFocus />
              <TouchableOpacity style={[styles.btnAdicionar, { backgroundColor: cores.primaria, flex: 1 }]} onPress={adicionarAoCarrinho}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontes.normal }]}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Carrinho */}
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[{ fontWeight: '700', color: cores.texto, fontSize: fontes.media }]}>
              Carrinho {carrinho.length > 0 ? `(${carrinho.length})` : ''}
            </Text>
            {carrinho.length > 0 && (
              <TouchableOpacity onPress={confirmarCancelar}>
                <Text style={[{ color: cores.perigo, fontWeight: '600', fontSize: fontes.normal }]}>Cancelar venda</Text>
              </TouchableOpacity>
            )}
          </View>

          {carrinho.length === 0 ? (
            // Estado vazio
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
              <Ionicons name="cart-outline" size={44} color={cores.textoSub} />
              <Text style={[{ fontSize: fontes.media, color: cores.textoSub, fontWeight: '600' }]}>Carrinho vazio</Text>
              <Text style={[{ fontSize: fontes.normal, color: cores.textoSub, textAlign: 'center' }]}>Busque um produto pelo nome</Text>
            </View>
          ) : (
            <FlatList
              data={carrinho}
              keyExtractor={(item) => String(item.produto_id)}
              renderItem={renderItemCarrinho}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Rodapé com campo "vendido para" + total + botão finalizar */}
        {carrinho.length > 0 && (
          <View style={[styles.rodape, { backgroundColor: cores.fundoCard, borderTopColor: cores.borda }]}>

            {/* NOVO: Campo nome do cliente */}
            <TextInput
              style={[styles.inputCliente, {
                backgroundColor: cores.fundoInput,
                borderColor: cores.borda,
                color: cores.texto,
                fontSize: fontes.normal,
              }]}
              placeholder="Vendido para (opcional)"
              placeholderTextColor={cores.textoSub}
              value={vendidoPara}
              onChangeText={setVendidoPara}
            />

            {/* Total e botão finalizar */}
            <View style={styles.rodapeBottom}>
              <View>
                <Text style={[{ fontSize: fontes.pequena, color: cores.textoSub, marginBottom: 3 }]}>Total da venda</Text>
                <Text style={[{ fontSize: fontes.grande, fontWeight: '700', color: cores.texto }]}>{formatarValor(totalCarrinho)}</Text>
              </View>
              <TouchableOpacity style={[styles.btnFinalizar, { backgroundColor: cores.primaria }]} onPress={confirmarFinalizarVenda}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontes.media }]}>Finalizar</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buscaArea: { padding: 16, borderBottomWidth: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12 },
  btnBuscar: { borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  produtoEncontrado: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1 },
  inputQtd: { borderWidth: 1, borderRadius: 10, padding: 10, width: 70, textAlign: 'center' },
  btnAdicionar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
  itemCarrinho: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, elevation: 1, borderWidth: 0.5 },

  // Rodapé com campo cliente + total
  rodape: { borderTopWidth: 0.5, padding: 16, elevation: 8 },
  inputCliente: {
    borderWidth: 1, borderRadius: 10, padding: 10,
    marginBottom: 12, // espaço entre o campo e o total
  },
  rodapeBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnFinalizar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
});
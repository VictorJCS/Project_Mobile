// src/screens/Vendas.js
// Tela de VENDAS — carrinho de compras com busca por nome OU código

import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { 
  buscarProdutoPorNome, 
  buscarProdutoPorCodigo, 
  buscarCodigosSimilares,
  buscarProdutoUniversal
} from '../database/produtosDAO';
import { finalizarVenda } from '../database/vendasDAO';
import { Alert } from '../utils/alert';

export default function VendasScreen() {
  const { cores, fontes } = useAppContext();

  // ESTADOS PRINCIPAIS
  const [carrinho, setCarrinho] = useState([]);
  const [nomeBusca, setNomeBusca] = useState('');
  const [qtdAdicionar, setQtdAdicionar] = useState('1');
  const [produtoEncontrado, setProdutoEncontrado] = useState(null);
  const [erroBusca, setErroBusca] = useState('');
  const [vendidoPara, setVendidoPara] = useState('');
  const [tipoBusca, setTipoBusca] = useState('universal'); // 'nome', 'codigo', 'universal'
  const [sugestoesCodigos, setSugestoesCodigos] = useState([]);

  // FUNÇÃO PARA LIMPAR TODOS OS DADOS
  const limparTudo = useCallback(() => {
    setCarrinho([]); 
    setNomeBusca(''); 
    setQtdAdicionar('1');
    setProdutoEncontrado(null); 
    setErroBusca(''); 
    setVendidoPara('');
    setSugestoesCodigos([]);
  }, []);

  // LIMPA TUDO QUANDO A TELA RECEBE FOCO
  useFocusEffect(
    useCallback(() => { 
      limparTudo(); 
    }, [limparTudo])
  );

  // FUNÇÃO PRINCIPAL DE BUSCA DE PRODUTOS
  function buscarProduto() {
    if (!nomeBusca.trim()) { 
      setErroBusca('Digite o termo de busca.'); 
      return; 
    }
    
    let produto;
    const termo = nomeBusca.trim();
    
    // DETERMINA TIPO DE BUSCA
    if (tipoBusca === 'codigo') {
      produto = buscarProdutoPorCodigo(termo);
    } else if (tipoBusca === 'nome') {
      produto = buscarProdutoPorNome(termo);
    } else {
      // Busca universal - tenta código primeiro, depois nome
      produto = buscarProdutoUniversal(termo);
    }
    
    // PRODUTO NÃO ENCONTRADO
    if (!produto) { 
      setProdutoEncontrado(null);
      
      // Se buscou por código e não encontrou, oferece sugestões
      if (tipoBusca === 'codigo') {
        const sugestoes = buscarCodigosSimilares(termo);
        setSugestoesCodigos(sugestoes);
        setErroBusca(sugestoes.length > 0 ? 'Código não encontrado. Veja as sugestões:' : 'Código não encontrado.');
      } else {
        setErroBusca('Produto não encontrado.'); 
        setSugestoesCodigos([]);
      }
      return; 
    }
    
    // PRODUTO SEM ESTOQUE - ERRO CORRIGIDO: template string com crases
    if (produto.quantidade === 0) { 
      setProdutoEncontrado(null); 
      setErroBusca(`"${produto.nome}" está sem estoque.`); // ✅ CORRIGIDO
      setSugestoesCodigos([]);
      return; 
    }
    
    // PRODUTO ENCONTRADO COM SUCESSO
    setProdutoEncontrado(produto); 
    setErroBusca('');
    setSugestoesCodigos([]);
  }

  // USA SUGESTÃO DE CÓDIGO E BUSCA AUTOMATICAMENTE
  function usarSugestaoCodigo(codigo) {
    setNomeBusca(codigo);
    setSugestoesCodigos([]);
    setErroBusca('');
    // Busca automaticamente após um pequeno delay
    setTimeout(() => {
      setTipoBusca('codigo');
      buscarProduto();
    }, 100);
  }

  // ADICIONA PRODUTO AO CARRINHO
  function adicionarAoCarrinho() {
    if (!produtoEncontrado) return;
    
    const qtd = parseInt(qtdAdicionar, 10);
    
    // VALIDAÇÕES
    if (isNaN(qtd) || qtd <= 0) { 
      Alert.alert('Atenção', 'Digite uma quantidade válida.'); 
      return; 
    }
    if (qtd > produtoEncontrado.quantidade) { 
      Alert.alert('Estoque insuficiente', `Disponível: ${produtoEncontrado.quantidade}.`); // ✅ CORRIGIDO
      return; 
    }

    // VERIFICA SE JÁ EXISTE NO CARRINHO
    const jaNoCarrinho = carrinho.find(i => i.produto_id === produtoEncontrado.id);
    if (jaNoCarrinho) {
      const novaQtd = jaNoCarrinho.quantidade + qtd;
      if (novaQtd > produtoEncontrado.quantidade) { 
        Alert.alert('Estoque insuficiente', `Disponível: ${produtoEncontrado.quantidade}.`); // ✅ CORRIGIDO
        return; 
      }
      setCarrinho(carrinho.map(i => 
        i.produto_id === produtoEncontrado.id ? { ...i, quantidade: novaQtd } : i
      ));
    } else {
      // ADICIONA NOVO ITEM AO CARRINHO
      setCarrinho([...carrinho, {
        produto_id: produtoEncontrado.id,
        nome_produto: produtoEncontrado.nome,
        quantidade: qtd,
        valor_unitario: produtoEncontrado.valor,
      }]);
    }
    
    // LIMPA CAMPOS APÓS ADICIONAR
    setNomeBusca(''); 
    setQtdAdicionar('1'); 
    setProdutoEncontrado(null); 
    setErroBusca('');
    setSugestoesCodigos([]);
  }

  // REMOVE ITEM DO CARRINHO
  function removerDoCarrinho(produto_id) {
    setCarrinho(carrinho.filter(i => i.produto_id !== produto_id));
  }

  // CALCULA TOTAL DO CARRINHO
  const totalCarrinho = carrinho.reduce(
    (soma, item) => soma + Number((item.valor_unitario * item.quantidade).toFixed(2)), 0
  );

  // FORMATA VALORES PARA MOEDA BRASILEIRA - ERRO CORRIGIDO: template string com crases
  function formatarValor(v) {
    return `R$ ${Number(v).toLocaleString('pt-BR', { // ✅ CORRIGIDO
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  // CONFIRMA E FINALIZA A VENDA
  function confirmarFinalizarVenda() {
    if (carrinho.length === 0) { 
      Alert.alert('Carrinho vazio', 'Adicione pelo menos um produto.'); 
      return; 
    }
    const cliente = vendidoPara.trim() ? `\nCliente: ${vendidoPara.trim()}` : ''; // ✅ CORRIGIDO
    Alert.alert(
      'Finalizar venda',
      `Total: ${formatarValor(totalCarrinho)}${cliente}\n\nConfirmar?`, // ✅ CORRIGIDO
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            finalizarVenda(carrinho, vendidoPara.trim());
            Alert.alert(
              'Venda realizada!', 
              `Total: ${formatarValor(totalCarrinho)}`, // ✅ CORRIGIDO
              [{ text: 'OK', onPress: limparTudo }]
            );
          }
        },
      ]
    );
  }

  // CONFIRMA CANCELAMENTO DA VENDA
  function confirmarCancelar() {
    if (carrinho.length === 0) return;
    Alert.alert(
      'Cancelar venda', 
      'Remover todos os itens do carrinho?', 
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', style: 'destructive', onPress: limparTudo },
      ]
    );
  }

  // RENDERIZA CADA ITEM DO CARRINHO
  function renderItemCarrinho({ item }) {
    return (
      <View style={[styles.itemCarrinho, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <View style={{ flex: 1 }}>
          <Text style={[{ color: cores.texto, fontWeight: '600', fontSize: fontes.normal }]}>
            {item.nome_produto}
          </Text>
          <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>
            {item.quantidade} × {formatarValor(item.valor_unitario)}
          </Text>
        </View>
        <Text style={[{ color: cores.primaria, fontWeight: '700', fontSize: fontes.media, marginRight: 12 }]}>
          {formatarValor(item.valor_unitario * item.quantidade)}
        </Text>
        <TouchableOpacity 
          onPress={() => removerDoCarrinho(item.produto_id)}
          style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
        >
          <Ionicons name="close-circle" size={24} color={cores.perigo} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        
        {/* ÁREA DE BUSCA E ADIÇÃO DE PRODUTOS */}
        <View style={[styles.buscaArea, { borderBottomColor: cores.borda, backgroundColor: cores.fundoCard }]}>
          <Text style={[{ fontWeight: '700', marginBottom: 16, color: cores.texto, fontSize: fontes.grande }]}>
            Adicionar produto
          </Text>

          {/* SELETOR DE TIPO DE BUSCA - JSX CORRIGIDO */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { key: 'universal', label: 'Código/Nome', icon: 'search' },
              { key: 'codigo', label: 'Código', icon: 'barcode-outline' },
              { key: 'nome', label: 'Nome', icon: 'text-outline' },
            ].map(opcao => (
              <TouchableOpacity 
                key={opcao.key}
                style={[styles.btnTipoBusca, { 
                  backgroundColor: tipoBusca === opcao.key ? cores.primaria : cores.fundo,
                  borderColor: tipoBusca === opcao.key ? cores.primaria : cores.borda,
                }]}
                onPress={() => { 
                  setTipoBusca(opcao.key); 
                  setNomeBusca(''); 
                  setProdutoEncontrado(null); 
                  setErroBusca(''); 
                  setSugestoesCodigos([]); 
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={opcao.icon} 
                  size={16} 
                  color={tipoBusca === opcao.key ? '#fff' : cores.textoSub} 
                />
                <Text style={[{ 
                  color: tipoBusca === opcao.key ? '#fff' : cores.textoSub,
                  fontSize: fontes.pequena,
                  fontWeight: '600'
                }]}>
                  {opcao.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CAMPO DE BUSCA */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TextInput 
              style={[styles.input, { 
                flex: 1, 
                backgroundColor: cores.fundoInput, 
                borderColor: cores.borda, 
                color: cores.texto, 
                fontSize: fontes.normal 
              }]}
              placeholder={tipoBusca === 'codigo' ? 'Digite o código' : tipoBusca === 'nome' ? 'Digite o nome' : 'Digite código ou nome'}
              placeholderTextColor={cores.textoSub}
              value={nomeBusca}
              onChangeText={(t) => { 
                setNomeBusca(t); 
                setProdutoEncontrado(null); 
                setErroBusca(''); 
                setSugestoesCodigos([]);
              }}
              onSubmitEditing={buscarProduto}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={[styles.btnBuscar, { backgroundColor: cores.primaria }]} 
              onPress={buscarProduto}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* SUGESTÕES DE CÓDIGOS - JSX CORRIGIDO */}
          {sugestoesCodigos.length > 0 && (
            <View style={[styles.sugestoes, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
              <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena, fontWeight: '600', marginBottom: 8 }]}>
                Códigos similares:
              </Text>
              {sugestoesCodigos.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.itemSugestao}
                  onPress={() => usarSugestaoCodigo(item.codigo)}
                  activeOpacity={0.7}
                >
                  <Text style={[{ color: cores.primaria, fontWeight: '600', fontSize: fontes.normal }]}>
                    {item.codigo}
                  </Text>
                  <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* MENSAGEM DE ERRO */}
          {erroBusca ? (
            <Text style={[{ color: cores.perigo, fontSize: fontes.pequena, marginBottom: 8 }]}>
              {erroBusca}
            </Text>
          ) : null}

          {/* PRODUTO ENCONTRADO */}
          {produtoEncontrado && (
            <View style={[styles.produtoEncontrado, { backgroundColor: cores.fundoSecundario, borderColor: cores.primaria }]}>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: cores.texto, fontWeight: '700', fontSize: fontes.media }]}>
                  {produtoEncontrado.nome}
                </Text>
                <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>
                  {formatarValor(produtoEncontrado.valor)} · {produtoEncontrado.quantidade} disponíveis
                  {produtoEncontrado.codigo && ` · #${produtoEncontrado.codigo}`} {/* ✅ CORRIGIDO */}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={cores.sucesso} />
            </View>
          )}

          {/* CAMPO QUANTIDADE E BOTÃO ADICIONAR */}
          {produtoEncontrado && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Text style={[{ color: cores.textoSub, fontSize: fontes.normal, fontWeight: '600' }]}>
                Qtd:
              </Text>
              <TextInput 
                style={[styles.inputQtd, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]}
                value={qtdAdicionar}
                onChangeText={setQtdAdicionar}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <TouchableOpacity 
                style={[styles.btnAdicionar, { backgroundColor: cores.sucesso, flex: 1 }]}
                onPress={adicionarAoCarrinho}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontes.media }]}>
                  Adicionar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ÁREA DO CARRINHO */}
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[{ fontWeight: '700', color: cores.texto, fontSize: fontes.grande }]}>
              Carrinho {carrinho.length > 0 ? `(${carrinho.length})` : ''} {/* ✅ CORRIGIDO */}
            </Text>
            {carrinho.length > 0 && (
              <TouchableOpacity onPress={confirmarCancelar} activeOpacity={0.7}>
                <Text style={[{ color: cores.perigo, fontSize: fontes.normal, fontWeight: '600' }]}>
                  Cancelar venda
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CARRINHO VAZIO OU LISTA DE ITENS */}
          {carrinho.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={64} color={cores.textoSub} />
              <Text style={[{ color: cores.textoSub, fontSize: fontes.media, fontWeight: '600', marginTop: 16 }]}>
                Carrinho vazio
              </Text>
              <Text style={[{ color: cores.textoSub, fontSize: fontes.normal, textAlign: 'center', marginTop: 4 }]}>
                Busque um produto pelo nome ou código
              </Text>
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

        {/* RODAPÉ COM TOTAL E FINALIZAÇÃO */}
        {carrinho.length > 0 && (
          <View style={[styles.rodape, { backgroundColor: cores.fundoCard, borderTopColor: cores.borda }]}>
            <TextInput 
              style={[styles.inputCliente, { backgroundColor: cores.fundoInput, borderColor: cores.borda, color: cores.texto, fontSize: fontes.normal }]}
              placeholder="Cliente (opcional)"
              placeholderTextColor={cores.textoSub}
              value={vendidoPara}
              onChangeText={setVendidoPara}
            />

            <View style={styles.rodapeBottom}>
              <View>
                <Text style={[{ color: cores.textoSub, fontSize: fontes.pequena }]}>
                  Total da venda
                </Text>
                <Text style={[{ color: cores.primaria, fontWeight: '700', fontSize: fontes.extraGrande }]}>
                  {formatarValor(totalCarrinho)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.btnFinalizar, { backgroundColor: cores.primaria }]}
                onPress={confirmarFinalizarVenda}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontes.media }]}>
                  Finalizar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buscaArea: { 
    padding: 16, 
    borderBottomWidth: 0.5 
  },
  btnTipoBusca: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center'
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 12 
  },
  btnBuscar: { 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sugestoes: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 10 
  },
  itemSugestao: { 
    paddingVertical: 8
  },
  produtoEncontrado: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 10, 
    borderWidth: 1 
  },
  inputQtd: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 10, 
    width: 70, 
    textAlign: 'center' 
  },
  btnAdicionar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    padding: 12, 
    borderRadius: 10 
  },
  itemCarrinho: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    padding: 12, 
    elevation: 1, 
    borderWidth: 0.5 
  },
  rodape: { 
    borderTopWidth: 0.5, 
    padding: 16, 
    elevation: 8 
  },
  inputCliente: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 12 
  },
  rodapeBottom: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  btnFinalizar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 12 
  },
});

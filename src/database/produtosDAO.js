// src/database/produtosDAO.js
import { Platform } from 'react-native';
import db from './db';
import { webDB } from './db.web';

const isWeb = Platform.OS === 'web';

export function listarProdutos() {
  if (isWeb) {
    return [...webDB.getAll('produtos')].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );
  }
  return db.getAllSync('SELECT * FROM produtos ORDER BY nome ASC');
}

export function buscarProdutoPorId(id) {
  if (isWeb) return webDB.getFirst('produtos', r => r.id === id);
  return db.getFirstSync('SELECT * FROM produtos WHERE id = ?', [id]);
}

export function buscarProdutoPorNome(nome) {
  if (isWeb) {
    const lower = nome.toLowerCase();
    return webDB.getFirst('produtos', r => r.nome.toLowerCase().includes(lower));
  }
  return db.getFirstSync(
    'SELECT * FROM produtos WHERE nome LIKE ?', [`%${nome}%`]
  );
}

export function adicionarProduto(nome, descricao, valor, quantidade, codigo = '', lancadoPor = '') {
  const dataHora = new Date().toLocaleString('pt-BR');

  if (isWeb) {
    webDB.insert('produtos', { nome, descricao, valor, quantidade, codigo, lancado_por: lancadoPor });
    webDB.insert('historico', {
      tipo: 'entrada',
      descricao: 'Produto adicionado ao estoque',
      data_hora: dataHora,
      valor_total: valor * quantidade,
      quantidade,
      produto_nome: nome,
      responsavel: lancadoPor,
    });
    return;
  }

  db.runSync(
    'INSERT INTO produtos (nome, descricao, valor, quantidade, codigo, lancado_por) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao, valor, quantidade, codigo, lancadoPor]
  );
  db.runSync(
    `INSERT INTO historico (tipo, descricao, data_hora, valor_total, quantidade, produto_nome, responsavel)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['entrada', 'Produto adicionado ao estoque', dataHora,
     valor * quantidade, quantidade, nome, lancadoPor]
  );
}

export function editarProduto(id, nome, descricao, valor, quantidade, codigo = '', lancadoPor = '') {
  if (isWeb) {
    webDB.update('produtos', id, { nome, descricao, valor, quantidade, codigo, lancado_por: lancadoPor });
    return;
  }
  db.runSync(
    'UPDATE produtos SET nome=?, descricao=?, valor=?, quantidade=?, codigo=?, lancado_por=? WHERE id=?',
    [nome, descricao, valor, quantidade, codigo, lancadoPor, id]
  );
}

export function atualizarQuantidade(id, novaQuantidade) {
  if (isWeb) {
    webDB.update('produtos', id, { quantidade: novaQuantidade });
    return;
  }
  db.runSync('UPDATE produtos SET quantidade=? WHERE id=?', [novaQuantidade, id]);
}

export function excluirProduto(id) {
  if (isWeb) {
    webDB.delete('produtos', id);
    return;
  }
  db.runSync('DELETE FROM produtos WHERE id=?', [id]);
}
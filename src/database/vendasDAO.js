// src/database/vendasDAO.js
import { Platform } from 'react-native';
import db from './db';
import { webDB } from './db.web';

const isWeb = Platform.OS === 'web';

export function finalizarVenda(itens, vendidoPara = '') {
  const dataHora = new Date().toLocaleString('pt-BR');
  const valorTotal = itens.reduce(
    (soma, item) => soma + item.valor_unitario * item.quantidade, 0
  );

  if (isWeb) {
    const venda = webDB.insert('vendas', { data_hora: dataHora, valor_total: valorTotal, vendido_para: vendidoPara });

    for (const item of itens) {
      webDB.insert('itens_venda', {
        venda_id: venda.id,
        produto_id: item.produto_id,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      });

      // Dá baixa no estoque
      const produto = webDB.getFirst('produtos', r => r.id === item.produto_id);
      if (produto) {
        webDB.update('produtos', item.produto_id, {
          quantidade: produto.quantidade - item.quantidade,
        });
      }

      webDB.insert('historico', {
        tipo: 'saida',
        descricao: 'Venda realizada',
        data_hora: dataHora,
        valor_total: item.valor_unitario * item.quantidade,
        quantidade: item.quantidade,
        produto_nome: item.nome_produto,
        responsavel: vendidoPara,
      });
    }
    return;
  }

  db.runSync(
    'INSERT INTO vendas (data_hora, valor_total, vendido_para) VALUES (?, ?, ?)',
    [dataHora, valorTotal, vendidoPara]
  );
  const venda = db.getFirstSync('SELECT id FROM vendas ORDER BY id DESC LIMIT 1');

  for (const item of itens) {
    db.runSync(
      `INSERT INTO itens_venda (venda_id, produto_id, nome_produto, quantidade, valor_unitario)
       VALUES (?, ?, ?, ?, ?)`,
      [venda.id, item.produto_id, item.nome_produto, item.quantidade, item.valor_unitario]
    );
    db.runSync(
      'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
      [item.quantidade, item.produto_id]
    );
    db.runSync(
      `INSERT INTO historico (tipo, descricao, data_hora, valor_total, quantidade, produto_nome, responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['saida', 'Venda realizada', dataHora,
       item.valor_unitario * item.quantidade,
       item.quantidade, item.nome_produto, vendidoPara]
    );
  }
}

export function cancelarVenda(vendaId) {
  if (isWeb) {
    const itens = webDB.getAll('itens_venda').filter(r => r.venda_id === vendaId);
    for (const item of itens) {
      const produto = webDB.getFirst('produtos', r => r.id === item.produto_id);
      if (produto) {
        webDB.update('produtos', item.produto_id, {
          quantidade: produto.quantidade + item.quantidade,
        });
      }
    }
    webDB.deleteWhere('itens_venda', r => r.venda_id === vendaId);
    webDB.delete('vendas', vendaId);
    return;
  }

  const itens = db.getAllSync('SELECT * FROM itens_venda WHERE venda_id = ?', [vendaId]);
  for (const item of itens) {
    db.runSync(
      'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?',
      [item.quantidade, item.produto_id]
    );
  }
  db.runSync('DELETE FROM itens_venda WHERE venda_id = ?', [vendaId]);
  db.runSync('DELETE FROM vendas WHERE id = ?', [vendaId]);
}
import { Platform } from 'react-native';
import db from './db';
import { webDB } from './db.web';

const isWeb = Platform.OS === 'web';

/**
 * Normaliza nome para comparação/armazenamento:
 * - trim
 * - colapsa espaços múltiplos em 1
 */
function normalizarNome(nome = '') {
  return String(nome).trim().replace(/\s+/g, ' ');
}

/**
 * Normaliza código para comparação/armazenamento:
 * - trim
 * - remove QUALQUER espaço (torna "AB 12" == "AB12")
 */
function normalizarCodigo(codigo = '') {
  return String(codigo).trim().replace(/\s+/g, '');
}

/** Lista base de produtos (para validações robustas e iguais em web/mobile). */
function getAllProdutos() {
  if (isWeb) return [...webDB.getAll('produtos')];
  return db.getAllSync('SELECT * FROM produtos');
}

/** Erro padronizado para duplicidade (UI pode exibir e.message). */
function criarErroDuplicado(tipo, existente, valorInformado) {
  const e = new Error(
    tipo === 'codigo'
      ? `Código duplicado: "${valorInformado}". Já usado por "${existente?.nome ?? 'outro produto'}".`
      : `Nome duplicado: "${valorInformado}". Já existe um produto com esse nome.`
  );
  e.name = 'ProdutoDuplicadoError';
  e.tipo = tipo; // 'nome' | 'codigo'
  e.existente = existente || null;
  return e;
}

/**
 * Busca EXATA por nome, usando normalização.
 * ignorarId: usado na edição para não comparar contra o próprio registro.
 */
export function buscarProdutoPorNomeExato(nome, ignorarId = null) {
  const alvo = normalizarNome(nome);
  if (!alvo) return null;

  const alvoLower = alvo.toLowerCase();

  const produtos = getAllProdutos();
  return (
    produtos.find(p => {
      if (ignorarId != null && p.id === ignorarId) return false;
      return normalizarNome(p.nome).toLowerCase() === alvoLower;
    }) || null
  );
}

/**
 * Busca EXATA por código, usando normalização.
 * Regras:
 * - se código vazio -> null
 * - comparação case-insensitive
 * - remove espaços do código antes de comparar
 */
export function buscarProdutoPorCodigoExato(codigo, ignorarId = null) {
  const alvo = normalizarCodigo(codigo);
  if (!alvo) return null;

  const alvoLower = alvo.toLowerCase();

  const produtos = getAllProdutos();
  return (
    produtos.find(p => {
      if (ignorarId != null && p.id === ignorarId) return false;
      if (!p.codigo) return false;
      return normalizarCodigo(p.codigo).toLowerCase() === alvoLower;
    }) || null
  );
}

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

/**
 * Busca "para pesquisa" (PARCIAL).
 * Não use para validar duplicidade.
 */
export function buscarProdutoPorNome(nome) {
  if (isWeb) {
    const lower = String(nome || '').toLowerCase();
    return webDB.getFirst('produtos', r => r.nome.toLowerCase().includes(lower));
  }
  return db.getFirstSync(
    'SELECT * FROM produtos WHERE nome LIKE ?',
    [`%${nome}%`]
  );
}

/**
 * Mantida por compatibilidade.
 * Agora é exata (normalizada) e delega para buscarProdutoPorCodigoExato.
 */
export function buscarProdutoPorCodigo(codigo) {
  return buscarProdutoPorCodigoExato(codigo);
}

export function buscarCodigosSimilares(codigo) {
  if (!codigo?.trim()) return [];

  const codigoLimpo = codigo.trim();

  if (isWeb) {
    const lower = codigoLimpo.toLowerCase();
    return [...webDB.getAll('produtos')]
      .filter(r => r.codigo && r.codigo.toLowerCase().includes(lower))
      .sort((a, b) => {
        if (a.codigo.toLowerCase() === lower) return -1;
        if (b.codigo.toLowerCase() === lower) return 1;
        if (a.codigo.toLowerCase().startsWith(lower)) return -1;
        if (b.codigo.toLowerCase().startsWith(lower)) return 1;
        return 0;
      })
      .slice(0, 5)
      .map(r => ({ codigo: r.codigo, nome: r.nome }));
  }

  try {
    return db.getAllSync(
      `
      SELECT codigo, nome FROM produtos
      WHERE LOWER(codigo) LIKE LOWER(?)
        AND codigo IS NOT NULL
        AND codigo != ''
      ORDER BY
        CASE
          WHEN LOWER(codigo) = LOWER(?) THEN 1
          WHEN LOWER(codigo) LIKE LOWER(?) THEN 2
          ELSE 3
        END
      LIMIT 5
      `,
      [`%${codigoLimpo}%`, codigoLimpo, `${codigoLimpo}%`]
    );
  } catch (error) {
    console.error('Erro ao buscar códigos similares:', error);
    return [];
  }
}

export function buscarProdutoUniversal(termo) {
  if (!termo?.trim()) return null;

  const termoLimpo = termo.trim();

  // 1) tenta por código exato
  let produto = buscarProdutoPorCodigoExato(termoLimpo);

  // 2) se não achar, tenta por nome (parcial)
  if (!produto) produto = buscarProdutoPorNome(termoLimpo);

  return produto;
}

/**
 * Adiciona produto com proteção anti-duplicidade:
 * - bloqueia se nome já existir (normalizado)
 * - bloqueia se código já existir (normalizado), quando informado
 */
export function adicionarProduto(
  nome,
  descricao,
  valor,
  quantidade,
  codigo = '',
  lancadoPor = ''
) {
  const dataHora = new Date().toLocaleString('pt-BR');

  const nomeNorm = normalizarNome(nome);
  const codigoNorm = normalizarCodigo(codigo);

  // Segurança: impede nome duplicado
  const dupNome = buscarProdutoPorNomeExato(nomeNorm);
  if (dupNome) throw criarErroDuplicado('nome', dupNome, nomeNorm);

  // Segurança: impede código duplicado (se existir)
  if (codigoNorm) {
    const dupCodigo = buscarProdutoPorCodigoExato(codigoNorm);
    if (dupCodigo) throw criarErroDuplicado('codigo', dupCodigo, codigoNorm);
  }

  if (isWeb) {
    webDB.insert('produtos', {
      nome: nomeNorm,
      descricao,
      valor,
      quantidade,
      codigo: codigoNorm,
      lancado_por: lancadoPor,
    });

    webDB.insert('historico', {
      tipo: 'entrada',
      descricao: 'Produto adicionado ao estoque',
      data_hora: dataHora,
      valor_total: valor * quantidade,
      quantidade,
      produto_nome: nomeNorm,
      responsavel: lancadoPor,
    });
    return;
  }

  db.runSync(
    'INSERT INTO produtos (nome, descricao, valor, quantidade, codigo, lancado_por) VALUES (?, ?, ?, ?, ?, ?)',
    [nomeNorm, descricao, valor, quantidade, codigoNorm, lancadoPor]
  );

  db.runSync(
    `INSERT INTO historico (tipo, descricao, data_hora, valor_total, quantidade, produto_nome, responsavel)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'entrada',
      'Produto adicionado ao estoque',
      dataHora,
      valor * quantidade,
      quantidade,
      nomeNorm,
      lancadoPor,
    ]
  );
}

/**
 * Edita produto com proteção anti-duplicidade (ignorando o próprio id).
 */
export function editarProduto(
  id,
  nome,
  descricao,
  valor,
  quantidade,
  codigo = '',
  lancadoPor = ''
) {
  const nomeNorm = normalizarNome(nome);
  const codigoNorm = normalizarCodigo(codigo);

  const dupNome = buscarProdutoPorNomeExato(nomeNorm, id);
  if (dupNome) throw criarErroDuplicado('nome', dupNome, nomeNorm);

  if (codigoNorm) {
    const dupCodigo = buscarProdutoPorCodigoExato(codigoNorm, id);
    if (dupCodigo) throw criarErroDuplicado('codigo', dupCodigo, codigoNorm);
  }

  if (isWeb) {
    webDB.update('produtos', id, {
      nome: nomeNorm,
      descricao,
      valor,
      quantidade,
      codigo: codigoNorm,
      lancado_por: lancadoPor,
    });
    return;
  }

  db.runSync(
    'UPDATE produtos SET nome=?, descricao=?, valor=?, quantidade=?, codigo=?, lancado_por=? WHERE id=?',
    [nomeNorm, descricao, valor, quantidade, codigoNorm, lancadoPor, id]
  );
}

export function atualizarQuantidade(id, novaQuantidade) {
  if (isWeb) {
    webDB.update('produtos', id, { quantidade: novaQuantidade });
    return;
  }
  db.runSync('UPDATE produtos SET quantidade=? WHERE id=?', [
    novaQuantidade,
    id,
  ]);
}

export function excluirProduto(id) {
  if (isWeb) {
    webDB.delete('produtos', id);
    return;
  }
  db.runSync('DELETE FROM produtos WHERE id=?', [id]);
}

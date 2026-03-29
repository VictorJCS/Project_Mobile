// src/database/db.js
// Responsável por abrir o banco de dados e criar/atualizar todas as tabelas.
// É o primeiro arquivo executado pelo app — chamado no App.js ao iniciar.

import * as SQLite from 'expo-sqlite';

// Abre o arquivo estoque.db no armazenamento interno do celular.
// Se o arquivo não existir, o SQLite cria automaticamente.
const db = SQLite.openDatabaseSync('estoque.db');

export function inicializarBanco() {

  // CREATE TABLE IF NOT EXISTS — cria a tabela apenas se ela ainda não existir.
  // Seguro para rodar toda vez que o app abre sem apagar dados existentes.
  db.execSync(`

    -- Tabela principal de produtos cadastrados no estoque
    CREATE TABLE IF NOT EXISTS produtos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      descricao   TEXT,
      valor       REAL    NOT NULL DEFAULT 0,
      quantidade  INTEGER NOT NULL DEFAULT 0,
      codigo      TEXT
    );

    -- Cabeçalho de cada venda realizada
    CREATE TABLE IF NOT EXISTS vendas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      data_hora   TEXT    NOT NULL,
      valor_total REAL    NOT NULL DEFAULT 0
    );

    -- Produtos que fazem parte de cada venda
    CREATE TABLE IF NOT EXISTS itens_venda (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id       INTEGER NOT NULL,
      produto_id     INTEGER NOT NULL,
      nome_produto   TEXT    NOT NULL,
      quantidade     INTEGER NOT NULL,
      valor_unitario REAL    NOT NULL,
      FOREIGN KEY (venda_id) REFERENCES vendas(id)
    );

    -- Registro de todas as entradas e saídas do estoque
    CREATE TABLE IF NOT EXISTS historico (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo         TEXT    NOT NULL,
      descricao    TEXT    NOT NULL,
      data_hora    TEXT    NOT NULL,
      valor_total  REAL,
      quantidade   INTEGER,
      produto_nome TEXT
    );
  `);

  // ── Migração segura ──────────────────────────────────────────────────────
  // Adiciona colunas novas em tabelas que já existem no celular do usuário.
  // Não é possível usar IF NOT EXISTS no ALTER TABLE do SQLite,
  // por isso usamos try/catch — se a coluna já existir o erro é ignorado
  // e os dados existentes ficam completamente intactos.

  const migracoes = [
    // Coluna que registra quem cadastrou o produto
    'ALTER TABLE produtos  ADD COLUMN lancado_por  TEXT DEFAULT ""',
    // Coluna que registra para quem a venda foi realizada
    'ALTER TABLE vendas    ADD COLUMN vendido_para TEXT DEFAULT ""',
    // Coluna que registra o responsável no histórico (lançador ou cliente)
    'ALTER TABLE historico ADD COLUMN responsavel  TEXT DEFAULT ""',
  ];

  // Executa cada migração individualmente
  for (const sql of migracoes) {
    try {
      // Tenta adicionar a coluna no banco
      db.execSync(sql);
    } catch (erro) {
      // Se a coluna já existe o SQLite lança um erro — ignoramos com segurança.
      // O console.log ajuda a debugar durante o desenvolvimento.
      console.log('Migração ignorada (coluna já existe):', erro.message);
    }
  }
}

// Exporta o banco para ser usado nos arquivos DAO (produtosDAO, vendasDAO, etc.)
export default db;
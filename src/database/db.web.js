// src/database/db.web.js
// Substitui expo-sqlite no browser usando localStorage.
// O Metro Bundler automaticamente usa este arquivo na web e db.js no mobile.

function loadTable(name) {
  try { return JSON.parse(localStorage.getItem(`tbl_${name}`) || '[]'); }
  catch { return []; }
}

function saveTable(name, rows) {
  localStorage.setItem(`tbl_${name}`, JSON.stringify(rows));
}

function nextId(table) {
  const id = parseInt(localStorage.getItem(`seq_${table}`) || '1');
  localStorage.setItem(`seq_${table}`, String(id + 1));
  return id;
}

export function inicializarBanco() {
  ['produtos', 'vendas', 'itens_venda', 'historico'].forEach(t => {
    if (!localStorage.getItem(`tbl_${t}`)) saveTable(t, []);
    if (!localStorage.getItem(`seq_${t}`)) localStorage.setItem(`seq_${t}`, '1');
  });
}

export const webDB = {
  getAll: (table) => loadTable(table),

  getFirst: (table, filterFn) => loadTable(table).find(filterFn) || null,

  insert: (table, row) => {
    const rows = loadTable(table);
    const newRow = { id: nextId(table), ...row };
    rows.push(newRow);
    saveTable(table, rows);
    return newRow;
  },

  update: (table, id, changes) => {
    saveTable(table, loadTable(table).map(r => r.id === id ? { ...r, ...changes } : r));
  },

  updateWhere: (table, filterFn, changes) => {
    saveTable(table, loadTable(table).map(r => filterFn(r) ? { ...r, ...changes } : r));
  },

  delete: (table, id) => {
    saveTable(table, loadTable(table).filter(r => r.id !== id));
  },

  deleteWhere: (table, filterFn) => {
    saveTable(table, loadTable(table).filter(r => !filterFn(r)));
  },

  getLastInserted: (table) => {
    const rows = loadTable(table);
    return rows[rows.length - 1] || null;
  },
};

export default { execSync: () => {} };
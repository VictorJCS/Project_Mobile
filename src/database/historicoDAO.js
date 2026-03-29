// src/database/historicoDAO.js
import { Platform } from 'react-native';
import db from './db';
import { webDB } from './db.web';

const isWeb = Platform.OS === 'web';

export function listarHistorico() {
  if (isWeb) {
    return [...webDB.getAll('historico')].sort((a, b) => b.id - a.id);
  }
  return db.getAllSync('SELECT * FROM historico ORDER BY id DESC');
}

export function listarEntradas() {
  if (isWeb) {
    return [...webDB.getAll('historico')]
      .filter(r => r.tipo === 'entrada')
      .sort((a, b) => b.id - a.id);
  }
  return db.getAllSync(
    "SELECT * FROM historico WHERE tipo = 'entrada' ORDER BY id DESC"
  );
}

export function listarSaidas() {
  if (isWeb) {
    return [...webDB.getAll('historico')]
      .filter(r => r.tipo === 'saida')
      .sort((a, b) => b.id - a.id);
  }
  return db.getAllSync(
    "SELECT * FROM historico WHERE tipo = 'saida' ORDER BY id DESC"
  );
}

export function excluirRegistroHistorico(id) {
  if (isWeb) {
    webDB.delete('historico', id);
    return;
  }
  db.runSync('DELETE FROM historico WHERE id = ?', [id]);
}
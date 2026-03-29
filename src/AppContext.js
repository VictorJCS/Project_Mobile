// src/AppContext.js
// Contexto global — controla tema escuro e tamanho de fonte em TODO o app.
// Qualquer tela acessa com: const { cores, fontes, ... } = useAppContext()

import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext({});

// Hook que qualquer tela usa para acessar o contexto
export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {

  // true = tema escuro ativo
  const [temaEscuro, setTemaEscuro] = useState(false);

  // Escala da fonte: 1 = normal, 2 = médio, 3 = grande
  // Funciona igual ao slider de acessibilidade do Android/iOS
  const [escalaFonte, setEscalaFonte] = useState(1);

  // Carrega preferências salvas ao abrir o app
  useEffect(() => {
    async function carregar() {
      try {
        const tema  = await AsyncStorage.getItem('@tema_escuro');
        const fonte = await AsyncStorage.getItem('@escala_fonte');
        if (tema  !== null) setTemaEscuro(tema === 'true');
        if (fonte !== null) setEscalaFonte(parseInt(fonte));
      } catch (e) {
        console.log('Erro ao carregar preferências:', e);
      }
    }
    carregar();
  }, []);

  // Alterna tema claro/escuro e salva
  async function alternarTema() {
    const novo = !temaEscuro;
    setTemaEscuro(novo);
    await AsyncStorage.setItem('@tema_escuro', String(novo));
  }

  // Muda a escala da fonte (1, 2 ou 3) e salva
  async function mudarEscalaFonte(escala) {
    setEscalaFonte(escala);
    await AsyncStorage.setItem('@escala_fonte', String(escala));
  }

  // ── Paleta de cores completa por tema ────────────────────────────────────
  // Todas as telas usam essas variáveis — nunca cores fixas
  const cores = temaEscuro ? {
    // Tema escuro
    fundo:           '#121212',  // fundo geral das telas
    fundoCard:       '#1E1E1E',  // fundo dos cards
    fundoInput:      '#2A2A2A',  // fundo dos campos de texto
    fundoSecundario: '#1A2E24',  // fundo de áreas de destaque
    texto:           '#F0F0F0',  // texto principal
    textoSub:        '#9E9E9E',  // texto secundário/muted
    textoBotao:      '#FFFFFF',  // texto em botões coloridos
    borda:           '#2C2C2C',  // bordas de cards e inputs
    primaria:        '#4CAF82',  // cor de destaque (verde claro)
    perigo:          '#EF9A9A',  // vermelho claro para tema escuro
    sucesso:         '#81C784',  // verde claro para tema escuro
    alerta:          '#FFD54F',  // amarelo para tema escuro
    header:          '#1A1A1A',  // fundo do cabeçalho
    headerTexto:     '#F0F0F0',  // texto do cabeçalho
    navBar:          '#1E1E1E',  // fundo da navbar
    navBorda:        '#2C2C2C',  // borda da navbar
    resumoBg:        '#1A2E24',  // fundo do card de resumo
    resumoTexto:     '#4CAF82',  // texto do card de resumo
    badgeVerdeBg:    '#1B3A2E',
    badgeVerdeText:  '#81C784',
    badgeAmarBg:     '#3A2E00',
    badgeAmarText:   '#FFD54F',
    badgeVermBg:     '#3A1212',
    badgeVermText:   '#EF9A9A',
    switchTrack:     '#4CAF82',
    filtroFundo:     '#2A2A2A',
    filtroAtivo:     '#1E1E1E',
  } : {
    // Tema claro
    fundo:           '#F4F6F5',
    fundoCard:       '#FFFFFF',
    fundoInput:      '#FAFAFA',
    fundoSecundario: '#E8F5E9',
    texto:           '#1A1A1A',
    textoSub:        '#9E9E9E',
    textoBotao:      '#FFFFFF',
    borda:           '#E0E0E0',
    primaria:        '#2D6A4F',
    perigo:          '#E53935',
    sucesso:         '#2E7D32',
    alerta:          '#F57F17',
    header:          '#2D6A4F',
    headerTexto:     '#FFFFFF',
    navBar:          '#FFFFFF',
    navBorda:        '#E0E0E0',
    resumoBg:        '#2D6A4F',
    resumoTexto:     '#FFFFFF',
    badgeVerdeBg:    '#E8F5E9',
    badgeVerdeText:  '#2E7D32',
    badgeAmarBg:     '#FFF8E1',
    badgeAmarText:   '#F57F17',
    badgeVermBg:     '#FFEBEE',
    badgeVermText:   '#C62828',
    switchTrack:     '#2D6A4F',
    filtroFundo:     '#E8EDED',
    filtroAtivo:     '#FFFFFF',
  };

  // ── Tamanhos de fonte por escala ──────────────────────────────────────────
  // Escala 1 = normal, 2 = médio (+20%), 3 = grande (+40%)
  // Igual ao sistema de acessibilidade do Android/iOS
  const fontes = {
    1: { pequena: 11, normal: 14, media: 16, grande: 20, titulo: 24, label: 13 },
    2: { pequena: 13, normal: 17, media: 19, grande: 23, titulo: 27, label: 15 },
    3: { pequena: 15, normal: 20, media: 22, grande: 26, titulo: 30, label: 17 },
  }[escalaFonte];

  return (
    <AppContext.Provider value={{
      temaEscuro,
      escalaFonte,
      alternarTema,
      mudarEscalaFonte,
      cores,
      fontes,
    }}>
      {children}
    </AppContext.Provider>
  );
}
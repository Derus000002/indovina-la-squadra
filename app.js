(() => {
  'use strict';

  const DATA = window.GAME_DATA;
  const BASE_TITLE = document.title;
  const STORAGE_KEY = 'indovina-la-squadra:v1';
  const DEFAULT_TIME_SEC = 20;
  const WRITTEN_TIME_BONUS_SEC = 8;
  const WRITTEN_POINTS = 50;
  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 8;
  const INFINITE_LIVES = 3;
  const INFINITE_DECK_LIMIT = 400;
  const NAME_LIMIT = 18;
  const numberFormat = new Intl.NumberFormat('it-IT', { useGrouping: 'always' });

  if (!DATA || !Array.isArray(DATA.players) || !Array.isArray(DATA.clubs)) {
    const main = document.querySelector('.main');
    if (main) {
      main.innerHTML = '<div style="max-width:680px;margin:15vh auto;padding:30px;border:2px solid #172117;border-radius:20px;background:#fcf7ec;box-shadow:8px 8px 0 #172117;font-family:Trebuchet MS,sans-serif"><h1 style="margin:0 0 8px;font-size:32px">Manca il tabellone.</h1><p style="margin:0">Non riesco a caricare i dati dei giocatori. Controlla che <strong>game-data.js</strong> sia nella stessa cartella di questa pagina.</p></div>';
    }
    return;
  }

  const byId = (id) => document.getElementById(id);
  const el = {
    setupScreen: byId('setupScreen'),
    handoffScreen: byId('handoffScreen'),
    gameScreen: byId('gameScreen'),
    summaryScreen: byId('summaryScreen'),
    finalScreen: byId('finalScreen'),

    setupForm: byId('setupForm'),
    countMinus: byId('countMinus'),
    countPlus: byId('countPlus'),
    playerCountOutput: byId('playerCountOutput'),
    nameGrid: byId('nameGrid'),
    namesLabel: byId('namesLabel'),
    namesNote: byId('namesNote'),
    leagueSelect: byId('leagueSelect'),
    leagueNote: byId('leagueNote'),
    soloSection: byId('soloSection'),
    infiniteToggle: byId('infiniteToggle'),
    questionsSection: byId('questionsSection'),
    questionsSegment: byId('questionsSegment'),
    questionsNote: byId('questionsNote'),
    answerModeSegment: byId('answerModeSegment'),
    answerModeNote: byId('answerModeNote'),
    difficultyGrid: byId('difficultyGrid'),
    difficultyNote: byId('difficultyNote'),
    setupSummary: byId('setupSummary'),
    startButton: byId('startButton'),
    startButtonKicker: byId('startButtonKicker'),
    startButtonLabel: byId('startButtonLabel'),
    heroStickerStack: byId('heroStickerStack'),

    handoffVisual: byId('handoffVisual'),
    handoffEyebrow: byId('handoffEyebrow'),
    handoffLead: byId('handoffLead'),
    handoffName: byId('handoffName'),
    handoffDesc: byId('handoffDesc'),
    handoffQuestions: byId('handoffQuestions'),
    handoffTime: byId('handoffTime'),
    handoffMode: byId('handoffMode'),
    startTurnBtn: byId('startTurnBtn'),
    startTurnLabel: byId('startTurnLabel'),

    turnChip: byId('turnChip'),
    turnChipLabel: byId('turnChipLabel'),
    gameAvatar: byId('gameAvatar'),
    gamePlayerName: byId('gamePlayerName'),
    gameScore: byId('gameScore'),
    progressDots: byId('progressDots'),
    progressLives: byId('progressLives'),
    progressText: byId('progressText'),
    timerDial: byId('timerDial'),
    timerValue: byId('timerValue'),
    endRunBtn: byId('endRunBtn'),
    gameSticker: byId('gameSticker'),
    questionTitle: byId('questionTitle'),
    streakChip: byId('streakChip'),
    answers: byId('answers'),
    writtenForm: byId('writtenForm'),
    writtenInput: byId('writtenInput'),
    keyHint: byId('keyHint'),

    feedback: byId('feedback'),
    confetti: byId('confetti'),
    toast: byId('toast'),

    summaryEyebrow: byId('summaryEyebrow'),
    summaryTitle: byId('summaryTitle'),
    summaryDesc: byId('summaryDesc'),
    summaryPoints: byId('summaryPoints'),
    summaryTotal: byId('summaryTotal'),
    summaryStats: byId('summaryStats'),
    summaryNextBtn: byId('summaryNextBtn'),
    summaryNextLabel: byId('summaryNextLabel'),
    summaryNextNote: byId('summaryNextNote'),
    leaderboardTurn: byId('leaderboardTurn'),
    leaderboardList: byId('leaderboardList'),

    finalTitle: byId('finalTitle'),
    finalDesc: byId('finalDesc'),
    winnerCard: byId('winnerCard'),
    rematchBtn: byId('rematchBtn'),
    shareBtn: byId('shareBtn'),
    newGameBtn: byId('newGameBtn'),
    podium: byId('podium'),
    rankingList: byId('rankingList'),

    brandBtn: byId('brandBtn'),
    rulesBtn: byId('rulesBtn'),
    rulesDialog: byId('rulesDialog'),
    closeRulesBtn: byId('closeRulesBtn'),
    rulesOkBtn: byId('rulesOkBtn'),
    abortGameBtn: byId('abortGameBtn'),
    rulesTime: byId('rulesTime'),
    soundBtn: byId('soundBtn'),
    dataUpdated: byId('dataUpdated')
  };

  const screens = Array.from(document.querySelectorAll('.screen'));
  const heroTitle = document.querySelector('.hero-title');
  const handoffTitle = el.handoffScreen.querySelector('.handoff-title');
  if (heroTitle) heroTitle.setAttribute('tabindex', '-1');
  el.handoffVisual.setAttribute('aria-hidden', 'true');
  el.feedback.setAttribute('aria-atomic', 'true');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PLAYER_COLORS = ['#b9dcff', '#d8c6ff', '#ffd36e', '#b8efc5', '#ffb4a6', '#c9e6d4', '#f4c3df', '#c7d2fe'];
  const STICKER_COLORS = ['#b9dcff', '#d8c6ff', '#ffd36e', '#b8efc5', '#ffc1b4', '#cce7d8', '#f7cfe3', '#d3dbff'];
  const LEAGUES = {
    'Italia': 'Serie A',
    'Inghilterra': 'Premier League',
    'Spagna': 'LaLiga',
    'Germania': 'Bundesliga',
    'Francia': 'Ligue 1',
    'Portogallo': 'Primeira Liga',
    'Paesi Bassi': 'Eredivisie',
    'Belgio': 'Pro League',
    'Turchia': 'Süper Lig',
    'Arabia Saudita': 'Saudi Pro League',
    'Qatar': 'Stars League',
    'Emirati Arabi Uniti': 'UAE Pro League',
    'Stati Uniti': 'MLS',
    'Brasile': 'Série A',
    'Argentina': 'Liga Profesional',
    'Serbia': 'SuperLiga'
  };
  const DIFFICULTIES = {
    facile: {
      shares: { 1: 0.62, 2: 0.34, 3: 0.04 },
      fallback: [2, 1, 3],
      timeSec: 20,
      note: 'Solo i nomi che conoscono tutti'
    },
    medio: {
      shares: { 1: 0.25, 2: 0.5, 3: 0.25 },
      fallback: [2, 1, 3],
      timeSec: 20,
      note: 'Il giusto mix di campioni'
    },
    esperto: {
      shares: { 1: 0.05, 2: 0.3, 3: 0.65 },
      fallback: [3, 2, 1],
      timeSec: 15,
      note: 'Per chi legge i tabellini'
    },
    estremo: {
      shares: { 1: 0, 2: 0, 3: 1 },
      fallback: [3, 2, 1],
      timeSec: 12,
      note: 'Solo figurine essenziali, 12 secondi'
    }
  };
  const QUESTIONS_NOTES = {
    3: 'Tre domande, zero respiro',
    5: 'La distanza classica',
    7: 'Per veri maratoneti'
  };
  const TIER_STARS = { 1: 3, 2: 2, 3: 1 };
  const ARROW_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const BALL_ICON = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#fcf7ec" stroke="#172117" stroke-width="3"/><path d="m32 17 12 9-4.6 14H24.6L20 26l12-9Z" fill="#172117"/><path d="M32 17v-8M44 26l8-3M39.4 40l5 8M24.6 40l-5 8M20 26l-8-3" stroke="#172117" stroke-width="2.5" stroke-linecap="round"/></svg>';

  const clubByName = new Map(DATA.clubs.map((club) => [club.name, club]));
  const clubsByCountry = new Map();
  DATA.clubs.forEach((club) => {
    if (!clubsByCountry.has(club.country)) clubsByCountry.set(club.country, []);
    clubsByCountry.get(club.country).push(club);
  });
  const playersByLeague = new Map();
  Object.keys(LEAGUES).forEach((country) => playersByLeague.set(country, []));
  DATA.players.forEach((player) => {
    const club = clubByName.get(player.club);
    if (club && playersByLeague.has(club.country)) playersByLeague.get(club.country).push(player);
  });

  const LEAGUE_NEIGHBORS = {
    Italia: ['Spagna', 'Francia', 'Germania', 'Inghilterra'],
    Inghilterra: ['Spagna', 'Italia', 'Francia', 'Germania'],
    Spagna: ['Italia', 'Francia', 'Inghilterra', 'Portogallo'],
    Germania: ['Italia', 'Francia', 'Inghilterra', 'Paesi Bassi'],
    Francia: ['Italia', 'Spagna', 'Inghilterra', 'Germania'],
    Portogallo: ['Spagna', 'Francia', 'Inghilterra', 'Brasile'],
    'Paesi Bassi': ['Belgio', 'Germania', 'Inghilterra', 'Francia'],
    Belgio: ['Paesi Bassi', 'Francia', 'Inghilterra', 'Germania'],
    Turchia: ['Italia', 'Francia', 'Germania', 'Inghilterra'],
    'Arabia Saudita': ['Qatar', 'Emirati Arabi Uniti', 'Turchia', 'Italia'],
    Qatar: ['Arabia Saudita', 'Emirati Arabi Uniti', 'Turchia', 'Francia'],
    'Emirati Arabi Uniti': ['Arabia Saudita', 'Qatar', 'Turchia', 'Italia'],
    'Stati Uniti': ['Inghilterra', 'Spagna', 'Brasile', 'Argentina'],
    Brasile: ['Argentina', 'Portogallo', 'Spagna', 'Italia'],
    Argentina: ['Brasile', 'Spagna', 'Italia', 'Portogallo'],
    Serbia: ['Italia', 'Germania', 'Francia', 'Turchia']
  };

  // Names accepted by the written-answer mode. Every catalogue name is added
  // automatically; this dictionary covers the common Italian and English forms.
  const WRITTEN_ALIASES = {
    Milan: ['Milan', 'AC Milan', 'A.C. Milan', 'Milan FC'],
    Inter: ['Inter', 'Inter Milan', 'Internazionale', 'FC Internazionale', 'Inter FC'],
    Juventus: ['Juventus', 'Juve', 'Juventus FC', 'Juventus Turin'],
    Napoli: ['Napoli', 'Naples', 'SSC Napoli'],
    Roma: ['Roma', 'Rome', 'AS Roma', 'Roma FC'],
    Lazio: ['Lazio', 'SS Lazio', 'Lazio FC'],
    Atalanta: ['Atalanta', 'Atalanta BC', 'Atalanta Bergamasca'],
    Bologna: ['Bologna', 'Bologna FC', 'Bologna FC 1909'],
    Fiorentina: ['Fiorentina', 'Viola', 'ACF Fiorentina'],
    Como: ['Como', 'Como 1907', 'Como Calcio'],
    Parma: ['Parma', 'Parma Calcio', 'Parma Calcio 1913'],
    Udinese: ['Udinese', 'Udinese Calcio'],
    Arsenal: ['Arsenal', 'Arsenal FC'],
    Chelsea: ['Chelsea', 'Chelsea FC'],
    Liverpool: ['Liverpool', 'Liverpool FC'],
    'Manchester City': ['Manchester City', 'Man City', 'Manchester City FC'],
    'Manchester United': ['Manchester United', 'Man United', 'Man Utd', 'Manchester United FC'],
    'Aston Villa': ['Aston Villa', 'Villa'],
    Tottenham: ['Tottenham', 'Spurs', 'Tottenham Hotspur'],
    Brighton: ['Brighton', 'Brighton & Hove Albion', 'Brighton and Hove Albion'],
    Bournemouth: ['Bournemouth', 'AFC Bournemouth'],
    Burnley: ['Burnley', 'Burnley FC'],
    'Crystal Palace': ['Crystal Palace', 'Palace'],
    Everton: ['Everton', 'Everton FC'],
    Leeds: ['Leeds', 'Leeds United'],
    'Nottingham Forest': ['Nottingham Forest', 'Forest', 'Nottingham'],
    Sunderland: ['Sunderland', 'Sunderland AFC'],
    Watford: ['Watford', 'Watford FC'],
    'West Ham': ['West Ham', 'West Ham United'],
    Wolverhampton: ['Wolverhampton', 'Wolves', 'Wolverhampton Wanderers'],
    Barcelona: ['Barcelona', 'Barcellona', 'Barca', 'Barça', 'FC Barcelona'],
    'Real Madrid': ['Real Madrid', 'Real Madrid CF'],
    'Atlético Madrid': ['Atlético Madrid', 'Atletico Madrid', 'Atletico', 'Atleti'],
    'Athletic Bilbao': ['Athletic Bilbao', 'Athletic', 'Bilbao'],
    'Real Sociedad': ['Real Sociedad', 'Sociedad'],
    Villarreal: ['Villarreal', 'Villarreal CF'],
    Elche: ['Elche', 'Elche CF'],
    'Deportivo La Coruña': ['Deportivo La Coruña', 'Deportivo La Coruna', 'Deportivo', 'La Coruña', 'La Coruna', 'Deportivo de La Coruña', 'Deportivo de A Coruña'],
    'Bayern Monaco': ['Bayern Monaco', 'Bayern', 'Bayern Munich', 'Bayern München', 'FC Bayern Munich'],
    Leverkusen: ['Leverkusen', 'Bayer Leverkusen', 'Bayer 04 Leverkusen', 'Bayer'],
    'Borussia Dortmund': ['Borussia Dortmund', 'Dortmund', 'BVB'],
    'Eintracht Francoforte': ['Eintracht Francoforte', 'Eintracht', 'Francoforte', 'Eintracht Frankfurt', 'Frankfurt'],
    Lipsia: ['Lipsia', 'Leipzig', 'RB Leipzig'],
    Stuttgart: ['Stuttgart', 'Stoccarda', 'VfB Stuttgart'],
    Wolfsburg: ['Wolfsburg', 'VfL Wolfsburg'],
    Friburgo: ['Friburgo', 'Freiburg', 'SC Freiburg'],
    'Mainz 05': ['Mainz 05', 'Mainz', 'Magonza', '1. FSV Mainz 05'],
    'Schalke 04': ['Schalke 04', 'Schalke', 'FC Schalke 04'],
    PSG: ['PSG', 'Paris Saint-Germain', 'Paris SG', 'Paris', 'Paris Saint Germain'],
    Marseille: ['Marseille', 'Marsiglia', 'OM', 'Olympique Marseille'],
    Monaco: ['Monaco', 'AS Monaco', 'Monaco FC'],
    Lyon: ['Lyon', 'Lione', 'OL', 'Olympique Lyonnais'],
    Lens: ['Lens', 'RC Lens'],
    Benfica: ['Benfica', 'SL Benfica', 'Sport Lisboa e Benfica'],
    Porto: ['Porto', 'FC Porto'],
    'Sporting CP': ['Sporting CP', 'Sporting', 'Sporting Lisbona', 'Sporting Lisbon', 'Sporting Clube de Portugal'],
    Braga: ['Braga', 'SC Braga', 'Sporting Braga'],
    Ajax: ['Ajax', 'AFC Ajax', 'Ajax Amsterdam'],
    PSV: ['PSV', 'PSV Eindhoven', 'Eindhoven'],
    Feyenoord: ['Feyenoord', 'Feyenoord Rotterdam'],
    'NEC Nijmegen': ['NEC Nijmegen', 'NEC', 'Nijmegen'],
    'Club Bruges': ['Club Bruges', 'Bruges', 'Brugge', 'Club Brugge'],
    Anderlecht: ['Anderlecht', 'RSC Anderlecht'],
    Genk: ['Genk', 'KRC Genk', 'RC Genk'],
    Gent: ['Gent', 'KAA Gent', 'AA Gent', 'Gand'],
    Galatasaray: ['Galatasaray', 'Gala', 'Galatasaray SK'],
    Fenerbahçe: ['Fenerbahçe', 'Fenerbahce', 'Fener', 'Fenerbahçe SK'],
    Beşiktaş: ['Beşiktaş', 'Besiktas', 'Beşiktaş JK'],
    Trabzonspor: ['Trabzonspor'],
    'Al Hilal': ['Al Hilal', 'Al-Hilal', 'Al Hilal SFC'],
    'Al Nassr': ['Al Nassr', 'Al-Nassr', 'Al Nassr FC'],
    'Al Ahli': ['Al Ahli', 'Al-Ahli', 'Al Ahli Saudi FC', 'Al-Ahli Saudi FC'],
    'Al Qadsiah': ['Al Qadsiah', 'Al-Qadsiah'],
    'Al Shabab': ['Al Shabab', 'Al-Shabab', 'Al Shabab Club'],
    'Al Diriyah': ['Al Diriyah', 'Al-Diriyah', 'Diriyah', 'Diriyah Club'],
    'Al Kharaitiyat': ['Al Kharaitiyat', 'Al-Kharaitiyat'],
    'Al Sadd': ['Al Sadd', 'Al-Sadd', 'Al Sadd SC'],
    'Al Shamal': ['Al Shamal', 'Al-Shamal'],
    'Al Duhail': ['Al Duhail', 'Al-Duhail'],
    'Al Wasl': ['Al Wasl', 'Al-Wasl'],
    'Al Ain': ['Al Ain', 'Al-Ain'],
    'Shabab Al Ahli': ['Shabab Al Ahli', 'Shabab Al-Ahli', 'Shabab Al Ahli Club'],
    'Al Jazira': ['Al Jazira', 'Al-Jazira'],
    'Inter Miami': ['Inter Miami', 'Inter Miami CF', 'Miami'],
    'Chicago Fire': ['Chicago Fire', 'Chicago Fire FC', 'Chicago'],
    LAFC: ['LAFC', 'Los Angeles FC', 'Los Angeles'],
    'Orlando City': ['Orlando City', 'Orlando City SC', 'Orlando'],
    Flamengo: ['Flamengo', 'CR Flamengo', 'Clube de Regatas do Flamengo'],
    Palmeiras: ['Palmeiras', 'SE Palmeiras', 'Sociedade Esportiva Palmeiras'],
    Corinthians: ['Corinthians', 'SC Corinthians', 'Corinthians Paulista'],
    Santos: ['Santos', 'Santos FC'],
    'River Plate': ['River Plate', 'River', 'Club Atlético River Plate'],
    'Boca Juniors': ['Boca Juniors', 'Boca', 'Club Atlético Boca Juniors'],
    'Racing Club': ['Racing Club', 'Racing', 'Racing Club de Avellaneda'],
    'Rosario Central': ['Rosario Central', 'Rosario', 'Club Atlético Rosario Central'],
    'Stella Rossa': ['Stella Rossa', 'Red Star', 'Red Star Belgrade', 'Crvena Zvezda'],
    Partizan: ['Partizan', 'FK Partizan', 'Partizan Belgrade'],
    Vojvodina: ['Vojvodina', 'FK Vojvodina', 'Vojvodina Novi Sad'],
    'Čukarički': ['Čukarički', 'Cukaricki', 'FK Čukarički']
  };

  function normalizeAnswer(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();
  }

  const writtenClubByAlias = new Map();
  DATA.clubs.forEach((club) => {
    const aliases = [club.name, ...(WRITTEN_ALIASES[club.name] || [])];
    aliases.forEach((alias) => {
      const key = normalizeAnswer(alias);
      if (key && !writtenClubByAlias.has(key)) writtenClubByAlias.set(key, club.name);
    });
  });

  function levenshtein(first, second) {
    const a = Array.from(first);
    const b = Array.from(second);
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let row = 1; row <= a.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= b.length; column += 1) {
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[b.length];
  }

  function matchWrittenClub(value) {
    const normalized = normalizeAnswer(value);
    if (!normalized) return '';
    const exact = writtenClubByAlias.get(normalized);
    if (exact) return exact;
    if (normalized.length < 5) return '';

    const candidates = new Map();
    writtenClubByAlias.forEach((club, alias) => {
      if (alias.length < 5 || Math.abs(alias.length - normalized.length) > 2) return;
      const maxDistance = alias.length >= 9 ? 2 : 1;
      const distance = levenshtein(normalized, alias);
      if (distance > maxDistance) return;
      const previous = candidates.get(club);
      if (previous == null || distance < previous) candidates.set(club, distance);
    });
    return candidates.size === 1 ? Array.from(candidates.keys())[0] : '';
  }

  function baseTimeSeconds(difficultyKey, answerMode) {
    const config = DIFFICULTIES[difficultyKey] || DIFFICULTIES.medio;
    return (config.timeSec || DEFAULT_TIME_SEC) + (answerMode === 'written' ? WRITTEN_TIME_BONUS_SEC : 0);
  }

  function updateRulesUI() {
    if (!el.rulesTime) return;
    const difficulty = state.game ? state.game.difficulty : state.settings.difficulty;
    const answerMode = state.game ? state.game.answerMode : state.settings.answerMode;
    el.rulesTime.textContent = `${baseTimeSeconds(difficulty, answerMode)} secondi`;
  }

  const defaultName = (index) => `Giocatore ${index + 1}`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const temporary = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temporary;
    }
    return copy;
  }

  function weightedIndex(items, weights) {
    let total = 0;
    for (let index = 0; index < items.length; index += 1) total += Math.max(0.0001, weights[index]);
    if (total <= 0) return 0;
    let marker = Math.random() * total;
    for (let index = 0; index < items.length; index += 1) {
      marker -= Math.max(0.0001, weights[index]);
      if (marker <= 0) return index;
    }
    return items.length - 1;
  }

  function sanitizeName(value, index) {
    const clean = String(value == null ? '' : value).trim().replace(/\s+/g, ' ').slice(0, NAME_LIMIT);
    return clean || defaultName(index);
  }

  function loadSettings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  const saved = loadSettings();
  const savedNames = saved && Array.isArray(saved.names) ? saved.names : [];
  const settings = {
    count: clamp(Number(saved && saved.count) || 3, MIN_PLAYERS, MAX_PLAYERS),
    names: Array.from({ length: MAX_PLAYERS }, (_, index) => sanitizeName(savedNames[index], index)),
    perPlayer: [3, 5, 7].includes(Number(saved && saved.perPlayer)) ? Number(saved.perPlayer) : 5,
    difficulty: ['facile', 'medio', 'esperto', 'estremo'].includes(saved && saved.difficulty) ? saved.difficulty : 'medio',
    league: saved && LEAGUES[saved.league] ? saved.league : 'all',
    answerMode: saved && saved.answerMode === 'written' ? 'written' : 'choices',
    infinite: Boolean(saved && saved.infinite),
    sound: !saved || saved.sound !== false
  };

  const state = {
    settings,
    screen: 'setup',
    phase: 'idle',
    game: null,
    turnIndex: 0,
    roundIndex: 0,
    writtenSubmitAt: 0,
    currentQuestion: null
  };

  let screenFocusTimer = 0;
  let feedbackFocusTimer = 0;
  let scoreBumpTimer = 0;
  let toastTimer = 0;
  let celebrationTimer = 0;
  let feedbackAuto = null;
  const timerPauseReasons = new Set();

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch (error) {
      /* localStorage can be unavailable for local files in some browsers. */
    }
  }

  /* ---------------------------------------------------------
     AUDIO
     --------------------------------------------------------- */

  const audio = (() => {
    let context = null;

    function ensure() {
      if (!state.settings.sound) return null;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      try {
        if (!context) context = new AudioContextClass();
        if (context.state === 'suspended') context.resume().catch(() => {});
        return context;
      } catch (error) {
        return null;
      }
    }

    function tone(frequency, duration, options = {}) {
      const ctx = ensure();
      if (!ctx) return;
      const {
        type = 'sine',
        volume = 0.04,
        delay = 0
      } = options;
      try {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.035);
      } catch (error) {
        /* Audio is a nice-to-have; never let it interrupt the game. */
      }
    }

    function play(name) {
      if (!state.settings.sound) return;
      if (name === 'click') {
        tone(420, 0.045, { type: 'triangle', volume: 0.022 });
      } else if (name === 'correct') {
        tone(523.25, 0.17, { volume: 0.035 });
        tone(659.25, 0.19, { volume: 0.034, delay: 0.075 });
        tone(783.99, 0.24, { volume: 0.032, delay: 0.15 });
      } else if (name === 'wrong') {
        tone(185, 0.17, { type: 'sawtooth', volume: 0.025 });
        tone(139, 0.22, { type: 'sawtooth', volume: 0.022, delay: 0.12 });
      } else if (name === 'tick') {
        tone(1046.5, 0.022, { type: 'square', volume: 0.009 });
      } else if (name === 'whistle') {
        tone(1760, 0.075, { volume: 0.027 });
        tone(2093, 0.105, { volume: 0.024, delay: 0.085 });
        tone(1975, 0.13, { volume: 0.023, delay: 0.19 });
      } else if (name === 'turn') {
        tone(392, 0.11, { volume: 0.028 });
        tone(523.25, 0.18, { volume: 0.026, delay: 0.085 });
      } else if (name === 'final') {
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
          tone(frequency, 0.22, { volume: 0.033, delay: index * 0.11 });
        });
        tone(523.25, 0.55, { type: 'triangle', volume: 0.02, delay: 0.48 });
        tone(783.99, 0.55, { type: 'triangle', volume: 0.017, delay: 0.48 });
      }
    }

    return { ensure, play };
  })();

  function vibrate(pattern) {
    try {
      // Chrome logs a console error when vibrate() runs without a user gesture;
      // skip it until the player has actually interacted with the page.
      if (!navigator.userActivation?.hasBeenActive) return;
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (error) {
      /* Ignore unsupported haptics. */
    }
  }

  /* ---------------------------------------------------------
     QUESTION TIMER
     --------------------------------------------------------- */

  const gameTimer = {
    limitMs: DEFAULT_TIME_SEC * 1000,
    remainingMs: DEFAULT_TIME_SEC * 1000,
    deadline: 0,
    intervalId: 0,
    running: false,
    paused: false,
    onTick: null,
    onEnd: null,

    start(onTick, onEnd) {
      this.stop();
      this.remainingMs = this.limitMs;
      this.deadline = performance.now() + this.limitMs;
      this.onTick = onTick;
      this.onEnd = onEnd;
      this.running = true;
      this.paused = false;
      this.tick();
      if (this.running) {
        this.intervalId = window.setInterval(() => this.tick(), 100);
      }
    },

    tick() {
      if (!this.running || this.paused) return;
      this.remainingMs = Math.max(0, this.deadline - performance.now());
      if (this.onTick) this.onTick(this.remainingMs);
      if (this.remainingMs <= 0) {
        const endCallback = this.onEnd;
        this.running = false;
        this.paused = false;
        window.clearInterval(this.intervalId);
        this.intervalId = 0;
        this.onTick = null;
        this.onEnd = null;
        if (endCallback) endCallback();
      }
    },

    pause() {
      if (!this.running || this.paused) return;
      this.remainingMs = Math.max(0, this.deadline - performance.now());
      window.clearInterval(this.intervalId);
      this.intervalId = 0;
      this.paused = true;
      if (this.onTick) this.onTick(this.remainingMs);
    },

    resume() {
      if (!this.running || !this.paused) return;
      this.paused = false;
      this.deadline = performance.now() + this.remainingMs;
      this.intervalId = window.setInterval(() => this.tick(), 100);
      this.tick();
    },

    stop() {
      window.clearInterval(this.intervalId);
      this.intervalId = 0;
      this.running = false;
      this.paused = false;
      this.onTick = null;
      this.onEnd = null;
    },

    getRemaining() {
      if (!this.running) return this.remainingMs;
      if (this.paused) return this.remainingMs;
      return Math.max(0, this.deadline - performance.now());
    }
  };

  function pauseGameTimer(reason) {
    timerPauseReasons.add(reason);
    if (gameTimer.running && !gameTimer.paused) gameTimer.pause();
  }

  function resumeGameTimer(reason) {
    timerPauseReasons.delete(reason);
    if (
      timerPauseReasons.size === 0 &&
      gameTimer.running &&
      gameTimer.paused &&
      state.screen === 'game' &&
      state.phase === 'answering' &&
      !document.hidden &&
      !el.rulesDialog.open
    ) {
      gameTimer.resume();
    }
  }

  function setTimerUI(milliseconds) {
    const limit = (state.game && state.game.timeLimitMs) || gameTimer.limitMs || DEFAULT_TIME_SEC * 1000;
    const remaining = clamp(milliseconds, 0, limit);
    el.timerValue.textContent = String(Math.ceil(remaining / 1000));
    el.timerDial.style.setProperty('--timer-angle', `${(remaining / limit) * 360}deg`);
    el.timerDial.classList.toggle('is-urgent', remaining <= 5000 && remaining > 0);
  }

  /* ---------------------------------------------------------
     SMALL UI HELPERS
     --------------------------------------------------------- */

  function showScreen(name, focusTarget) {
    state.screen = name;
    document.body.dataset.screen = name;
    screens.forEach((screen) => {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
    window.scrollTo(0, 0);
    window.clearTimeout(screenFocusTimer);
    if (focusTarget) {
      screenFocusTimer = window.setTimeout(() => {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (error) {
          focusTarget.focus();
        }
      }, 130);
    }
    hideToast();
  }

  function showToast(message, duration = 2600) {
    window.clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove('is-visible');
    }, duration);
  }

  function hideToast() {
    window.clearTimeout(toastTimer);
    el.toast.classList.remove('is-visible');
  }

  function setDocumentTitle(title) {
    document.title = title ? `${title} — Indovina la Squadra` : BASE_TITLE;
  }

  function updateSoundUI() {
    const on = state.settings.sound;
    el.soundBtn.classList.toggle('is-muted', !on);
    el.soundBtn.setAttribute('aria-pressed', String(on));
    el.soundBtn.setAttribute('aria-label', on ? 'Disattiva audio' : 'Attiva audio');
    el.soundBtn.title = on ? 'Disattiva audio' : 'Attiva audio';
    const label = el.soundBtn.querySelector('.sound-label');
    if (label) label.textContent = on ? 'Audio on' : 'Audio off';
  }

  function getInitials(name) {
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return Array.from(words[0])[0].toUpperCase();
    return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
  }

  function getPlayerInitials(player) {
    if (player.first && player.last) {
      return (Array.from(player.first)[0] + Array.from(player.last)[0]).toUpperCase();
    }
    if (player.last) return Array.from(player.last)[0].toUpperCase();
    return getInitials(player.name);
  }

  function getLastNameClass(lastName) {
    const length = Array.from(String(lastName)).length;
    if (length <= 5) return 'sticker-name--xl';
    if (length <= 8) return 'sticker-name--lg';
    if (length <= 11) return 'sticker-name--md';
    return 'sticker-name--sm';
  }

  function leagueFor(country) {
    return LEAGUES[country] || country;
  }

  function fallbackClub(name) {
    const compact = String(name || 'Club').replace(/[^a-z0-9]/gi, '');
    return {
      name: name || 'Club',
      code: (compact.slice(0, 3) || 'FC').toUpperCase(),
      c1: '#b9dcff',
      c2: '#d8ff3e',
      country: 'Italia',
      prestige: 2
    };
  }

  function getClub(name) {
    return clubByName.get(name) || fallbackClub(name);
  }

  function crestMarkup(club, extraClass = '') {
    if (club.logo) {
      const sizeClass = extraClass.includes('crest--large') ? ' club-badge--large' : '';
      return `<span class="club-badge${sizeClass}" aria-hidden="true"><img src="${escapeHTML(club.logo)}" alt="" width="44" height="44" decoding="async"></span>`;
    }
    const primary = safeColor(club.c1, '#172117');
    const secondary = safeColor(club.c2, '#d8ff3e');
    return `<span class="crest ${extraClass}" style="--club-a:${primary};--club-b:${secondary}" aria-hidden="true"><span class="crest-inner"><span class="crest-code">${escapeHTML(club.code)}</span></span></span>`;
  }

  function stickerMarkup(player, options = {}) {
    const club = getClub(player.club);
    const cardColor = STICKER_COLORS[(Number(player.fig) || 1) % STICKER_COLORS.length];
    const stars = TIER_STARS[player.t] || 1;
    const lastName = player.last || player.name;
    const nameClass = getLastNameClass(lastName);
    const shirtNumber = player.num == null ? '' : String(player.num);
    const minimal = Boolean(options.minimal);
    const showAge = !options.hideAge && Boolean(player.age);
    const meta = [player.pos, showAge ? `${player.age} anni` : ''].filter(Boolean).join(' · ');
    const labelAge = options.hideAge ? '' : (player.age ? `, ${player.age} anni` : '');
    const label = minimal
      ? `Figurina di ${player.name}, ${player.nat}${shirtNumber ? `, numero ${shirtNumber}` : ''}`
      : `Figurina di ${player.name}, ${player.nat}, ${player.pos}${labelAge}, ${stars} ${stars === 1 ? 'stella' : 'stelle'}`;
    const decorative = options.decorative ? ' aria-hidden="true"' : ` role="group" aria-label="${escapeHTML(label)}"`;
    const clubA = options.hideClubColors ? 'rgba(23, 33, 23, 0.2)' : safeColor(club.c1, '#172117');
    const clubB = options.hideClubColors ? 'rgba(23, 33, 23, 0.08)' : safeColor(club.c2, '#d8ff3e');
    const hasMeta = !minimal && Boolean(meta || shirtNumber);

    return `<article class="player-sticker ${nameClass}${minimal ? ' is-minimal' : ''}" style="--pc:${cardColor};--club-a:${clubA};--club-b:${clubB}"${decorative}>
      <span class="sticker-edge" aria-hidden="true"></span>
      <div class="sticker-top">
        <span class="sticker-flag">${escapeHTML(player.flag)} ${escapeHTML(player.nat)}</span>
        ${minimal
          ? (shirtNumber ? `<span class="sticker-fig sticker-fig--number">#${escapeHTML(shirtNumber)}</span>` : '')
          : `<span class="sticker-fig">FIG. ${String(player.fig || 0).padStart(3, '0')}</span>`}
      </div>
      <div class="sticker-stage" aria-hidden="true">
        ${minimal ? '' : `<span class="sticker-ghost-num">${escapeHTML(shirtNumber)}</span>`}
        <span class="sticker-initials">${escapeHTML(getPlayerInitials(player))}</span>
        ${minimal ? '' : `<span class="sticker-stars">${'★'.repeat(stars)}</span>`}
      </div>
      <div class="sticker-bottom">
        ${player.first ? `<span class="sticker-first">${escapeHTML(player.first)}</span>` : ''}
        <strong class="sticker-last">${escapeHTML(lastName)}</strong>
        ${hasMeta ? `<div class="sticker-meta"><span>${escapeHTML(meta)}</span>${shirtNumber ? `<span>#${escapeHTML(shirtNumber)}</span>` : ''}</div>` : ''}
      </div>
    </article>`;
  }

  function renderHero() {
    const preferred = ['Lamine Yamal', 'Kylian Mbappé', 'Erling Haaland'];
    const chosen = [];
    preferred.forEach((name) => {
      const player = DATA.players.find((item) => item.name === name);
      if (player) chosen.push(player);
    });
    if (chosen.length < 3) {
      DATA.players
        .filter((player) => player.t === 1 && !chosen.includes(player))
        .slice(0, 3 - chosen.length)
        .forEach((player) => chosen.push(player));
    }
    const classes = ['stack-card--back-left', 'stack-card--back-right', 'stack-card--front'];
    const order = [chosen[1], chosen[2], chosen[0]].filter(Boolean);
    el.heroStickerStack.innerHTML = order.map((player, index) => (
      `<div class="stack-card ${classes[index]}">${stickerMarkup(player, { decorative: true })}</div>`
    )).join('');
  }

  function leaguePool(league) {
    if (!league || league === 'all') return DATA.players;
    return playersByLeague.get(league) || [];
  }

  function leagueLabel(league) {
    return !league || league === 'all' ? 'Tutti i campionati' : LEAGUES[league] || league;
  }

  function populateLeagueSelect() {
    const options = [`<option value="all">Tutti i campionati · ${numberFormat.format(DATA.players.length)}</option>`];
    Object.keys(LEAGUES).forEach((country) => {
      const count = (playersByLeague.get(country) || []).length;
      if (!count) return;
      options.push(`<option value="${escapeHTML(country)}">${escapeHTML(LEAGUES[country])} · ${escapeHTML(country)} — ${numberFormat.format(count)}</option>`);
    });
    el.leagueSelect.innerHTML = options.join('');
    if (!el.leagueSelect.querySelector(`option[value="${state.settings.league}"]`)) {
      state.settings.league = 'all';
    }
    el.leagueSelect.value = state.settings.league;
  }

  function renderSetup(options = {}) {
    const count = state.settings.count;
    const solo = count === 1;
    const infinite = solo && state.settings.infinite;
    const available = leaguePool(state.settings.league).length;
    el.playerCountOutput.textContent = String(count);
    el.countMinus.disabled = count <= MIN_PLAYERS;
    el.countPlus.disabled = count >= MAX_PLAYERS;

    el.namesLabel.textContent = solo ? 'Il tuo nome' : 'Chi scende in campo?';
    el.namesNote.textContent = solo ? 'Come vuoi essere chiamato' : 'Tocca un nome per cambiarlo';
    el.soloSection.hidden = !solo;
    el.infiniteToggle.checked = infinite;
    el.questionsSection.hidden = infinite;

    el.leagueSelect.value = state.settings.league;
    el.leagueNote.textContent = state.settings.league === 'all'
      ? `${numberFormat.format(available)} calciatori`
      : `${LEAGUES[state.settings.league]} · ${numberFormat.format(available)}`;

    el.nameGrid.innerHTML = '';
    for (let index = 0; index < count; index += 1) {
      const label = document.createElement('label');
      label.className = 'name-field';
      label.style.setProperty('--pc', PLAYER_COLORS[index % PLAYER_COLORS.length]);

      const badge = document.createElement('span');
      badge.className = 'name-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = String(index + 1);

      const input = document.createElement('input');
      input.className = 'name-input';
      input.type = 'text';
      input.value = state.settings.names[index];
      input.maxLength = NAME_LIMIT;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.placeholder = solo ? 'Il tuo nome' : '';
      input.setAttribute('aria-label', solo ? 'Il tuo nome' : `Nome del giocatore ${index + 1}`);
      input.addEventListener('input', () => {
        state.settings.names[index] = sanitizeName(input.value, index);
        saveSettings();
      });
      input.addEventListener('blur', () => {
        const clean = sanitizeName(input.value, index);
        input.value = clean;
        state.settings.names[index] = clean;
        saveSettings();
      });

      const srLabel = document.createElement('span');
      srLabel.className = 'sr-only';
      srLabel.textContent = solo ? 'Il tuo nome' : `Nome del giocatore ${index + 1}`;

      label.append(badge, srLabel, input);
      el.nameGrid.append(label);
    }

    el.questionsSegment.querySelectorAll('[data-value]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.value) === state.settings.perPlayer));
    });
    el.difficultyGrid.querySelectorAll('[data-difficulty]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.difficulty === state.settings.difficulty));
    });
    el.answerModeSegment.querySelectorAll('[data-value]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.value === state.settings.answerMode));
    });

    if (el.answerModeNote) {
      el.answerModeNote.textContent = state.settings.answerMode === 'written'
        ? 'Nessun suggerimento, +8 secondi per rispondere'
        : 'Quattro club tra cui scegliere';
    }
    el.questionsNote.textContent = QUESTIONS_NOTES[state.settings.perPlayer] || QUESTIONS_NOTES[5];
    el.difficultyNote.textContent = DIFFICULTIES[state.settings.difficulty].note;

    const totalQuestions = count * state.settings.perPlayer;
    const minutes = Math.max(2, Math.ceil(totalQuestions / 4));
    const leagueText = leagueLabel(state.settings.league);
    const modeText = state.settings.answerMode === 'written' ? 'scrivi tu' : '4 scelte';
    if (infinite) {
      el.setupSummary.textContent = `1 giocatore · infinita · 3 vite · ${modeText} · ${leagueText}`;
      el.startButtonKicker.textContent = 'Tre vite, zero limiti';
      el.startButtonLabel.textContent = 'Inizia la corsa';
    } else {
      el.setupSummary.textContent = `${count} ${count === 1 ? 'giocatore' : 'giocatori'} · ${totalQuestions} domande · ${modeText} · ${leagueText} · ~${minutes} min`;
      el.startButtonKicker.textContent = solo ? 'Un giocatore, zero scuse' : 'Tutto pronto?';
      el.startButtonLabel.textContent = solo ? 'Gioca da solo' : "Fischio d'inizio";
    }
    el.startButton.disabled = available < (infinite ? 1 : totalQuestions);
    updateRulesUI();
    if (options.save !== false) saveSettings();
  }

  function readNamesFromInputs() {
    const inputs = el.nameGrid.querySelectorAll('.name-input');
    inputs.forEach((input, index) => {
      const clean = sanitizeName(input.value, index);
      input.value = clean;
      state.settings.names[index] = clean;
    });
  }

  /* ---------------------------------------------------------
     QUESTION GENERATION
     --------------------------------------------------------- */

  function samplePlayers(total, difficulty, league = 'all') {
    const config = DIFFICULTIES[difficulty] || DIFFICULTIES.medio;
    const tiers = [1, 2, 3];
    const eligible = leaguePool(league);
    const selected = [];
    const clubCounts = new Map();
    const tierPools = { 1: new Map(), 2: new Map(), 3: new Map() };

    eligible.forEach((player) => {
      const tier = [1, 2, 3].includes(player.t) ? player.t : 3;
      const pools = tierPools[tier];
      if (!pools.has(player.club)) pools.set(player.club, []);
      pools.get(player.club).push(player);
    });
    tiers.forEach((tier) => {
      tierPools[tier].forEach((pool, club) => tierPools[tier].set(club, shuffle(pool)));
    });

    const quotas = {};
    const raw = tiers.map((tier) => ({
      tier,
      exact: total * (config.shares[tier] || 0),
      count: 0
    }));
    raw.forEach((item) => {
      item.count = Math.floor(item.exact);
      item.fraction = item.exact - item.count;
    });
    let assigned = raw.reduce((sum, item) => sum + item.count, 0);
    raw.slice().sort((first, second) => second.fraction - first.fraction).forEach((item) => {
      if (assigned < total) {
        item.count += 1;
        assigned += 1;
      }
    });
    raw.forEach((item) => { quotas[item.tier] = item.count; });

    // Pick from the club that has appeared least so far. This spreads a round
    // across the maximum number of clubs, without the old global club cap.
    function takeFromTier(tier) {
      const pools = tierPools[tier];
      let bestCount = Infinity;
      let candidates = [];
      pools.forEach((pool, club) => {
        if (!pool.length) return;
        const count = clubCounts.get(club) || 0;
        if (count < bestCount) {
          bestCount = count;
          candidates = [club];
        } else if (count === bestCount) {
          candidates.push(club);
        }
      });
      if (!candidates.length) return null;
      const club = candidates[Math.floor(Math.random() * candidates.length)];
      const player = pools.get(club).pop();
      selected.push(player);
      clubCounts.set(club, bestCount + 1);
      return player;
    }

    for (const tier of tiers) {
      const wanted = Math.min(quotas[tier] || 0, eligible.filter((player) => player.t === tier).length);
      for (let index = 0; index < wanted; index += 1) {
        if (!takeFromTier(tier)) break;
      }
    }

    let guard = 0;
    const guardLimit = Math.max(80, total * 3);
    while (selected.length < total && guard < guardLimit) {
      guard += 1;
      let picked = null;
      for (const tier of config.fallback) {
        picked = takeFromTier(tier);
        if (picked) break;
      }
      if (!picked) break;
    }

    return selected;
  }

  function pickDistractors(correctClub, amount, game) {
    const counts = game.distractorCounts;
    const picked = [];
    const used = new Set([correctClub.name]);

    function pickFromPool(pool, slots) {
      while (slots > 0) {
        const available = pool.filter((club) => !used.has(club.name));
        if (!available.length) break;
        const weights = available.map((club) => {
          const distance = Math.abs(club.prestige - correctClub.prestige);
          const proximity = 1 / (distance + 0.6);
          const sameCountry = club.country === correctClub.country ? 1.6 : 1;
          const countPenalty = 1 / (1 + (counts.get(club.name) || 0) * 2.4);
          return Math.max(0.001, proximity * sameCountry * countPenalty * (0.8 + Math.random() * 0.4));
        });
        const index = weightedIndex(available, weights);
        const club = available[index];
        picked.push(club);
        used.add(club.name);
        counts.set(club.name, (counts.get(club.name) || 0) + 1);
        slots -= 1;
      }
    }

    const sameCountry = (clubsByCountry.get(correctClub.country) || [])
      .filter((club) => club.name !== correctClub.name);

    if (game.league !== 'all') {
      // In a selected league every wrong option stays in that league.
      pickFromPool(sameCountry, amount);
    } else if (sameCountry.length >= amount) {
      pickFromPool(sameCountry, amount);
    } else {
      pickFromPool(sameCountry, sameCountry.length);
      const neighborCountries = LEAGUE_NEIGHBORS[correctClub.country] || [];
      const neighbors = neighborCountries.flatMap((country) => clubsByCountry.get(country) || []);
      pickFromPool(neighbors, amount - picked.length);
    }

    if (picked.length < amount) {
      pickFromPool(DATA.clubs, amount - picked.length);
    }
    return picked;
  }

  function createQuestion(player, game) {
    const correctClub = getClub(player.club);
    const distractors = pickDistractors(correctClub, 3, game);
    const options = shuffle([correctClub, ...distractors].map((club) => ({
      club,
      correct: club.name === correctClub.name
    })));
    return {
      player,
      correctClub,
      options,
      correctIndex: options.findIndex((option) => option.correct)
    };
  }

  function createSession(config) {
    const count = clamp(Number(config.count) || MIN_PLAYERS, MIN_PLAYERS, MAX_PLAYERS);
    const solo = count === 1;
    const infinite = solo && Boolean(config.infinite);
    const perPlayer = [3, 5, 7].includes(Number(config.perPlayer)) ? Number(config.perPlayer) : 5;
    const difficulty = DIFFICULTIES[config.difficulty] ? config.difficulty : 'medio';
    const answerMode = config.answerMode === 'written' ? 'written' : 'choices';
    const league = config.league === 'all' || LEAGUES[config.league] ? config.league : 'all';
    const names = Array.from({ length: count }, (_, index) => sanitizeName(config.names && config.names[index], index));
    const total = count * perPlayer;
    const eligible = leaguePool(league);
    const sampled = samplePlayers(
      infinite ? Math.min(eligible.length, INFINITE_DECK_LIMIT) : total,
      difficulty,
      league
    );

    if (!sampled.length || (!infinite && sampled.length < total)) {
      throw new Error('Not enough players to build the game.');
    }

    const deck = shuffle(sampled);
    const players = names.map((name, index) => ({
      id: index,
      order: index,
      name,
      initials: getInitials(name),
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      score: 0,
      correct: 0,
      answered: 0,
      totalTime: 0,
      bestStreak: 0,
      currentStreak: 0,
      lives: infinite ? INFINITE_LIVES : null,
      results: [],
      roundPoints: 0,
      roundCorrect: 0,
      roundAnswers: 0,
      roundBestStreak: 0,
      roundTime: 0,
      turnPoints: 0,
      turnCorrect: 0,
      turnAnswers: 0,
      turnBestStreak: 0,
      turnTime: 0
    }));

    return {
      players,
      deck,
      questions: [],
      infiniteQuestions: [],
      distractorCounts: new Map(),
      exhausted: false,
      endedByPlayer: false,
      count,
      solo,
      infinite,
      league,
      perPlayer,
      difficulty,
      answerMode,
      timeLimitMs: baseTimeSeconds(difficulty, answerMode) * 1000,
      totalQuestions: infinite ? null : total,
      config: {
        count,
        perPlayer,
        difficulty,
        answerMode,
        league,
        infinite,
        names: names.slice()
      }
    };
  }

  function currentPlayer() {
    return state.game ? state.game.players[state.turnIndex] : null;
  }

  function questionAt(index) {
    if (!state.game) return null;
    if (state.game.infinite) {
      if (index >= state.game.deck.length) return null;
      if (!state.game.infiniteQuestions[index]) {
        state.game.infiniteQuestions[index] = createQuestion(state.game.deck[index], state.game);
      }
      return state.game.infiniteQuestions[index];
    }
    const position = index * state.game.count + state.turnIndex;
    if (position >= state.game.deck.length) return null;
    if (!state.game.questions[position]) {
      state.game.questions[position] = createQuestion(state.game.deck[position], state.game);
    }
    return state.game.questions[position];
  }

  function resetTurnStats(player) {
    player.turnPoints = 0;
    player.turnCorrect = 0;
    player.turnAnswers = 0;
    player.turnBestStreak = 0;
    player.turnTime = 0;
  }

  function resetRoundStats(player) {
    player.roundPoints = 0;
    player.roundCorrect = 0;
    player.roundAnswers = 0;
    player.roundBestStreak = 0;
    player.roundTime = 0;
  }

  function startGame(config) {
    stopRound();
    stopCelebration();
    audio.play('whistle');

    try {
      const game = createSession(config);
      state.game = game;
      state.turnIndex = 0;
      state.roundIndex = 0;
      state.writtenSubmitAt = 0;
      state.currentQuestion = null;
      if (game.solo) {
        showScreen('game');
        renderQuestion();
      } else {
        showHandoff();
      }
    } catch (error) {
      console.error(error);
      showToast('Non riesco a preparare le domande. Riprova.');
    }
  }

  function stopRound() {
    gameTimer.stop();
    timerPauseReasons.clear();
    hideFeedback();
  }

  /* ---------------------------------------------------------
     HANDOFF
     --------------------------------------------------------- */

  function showHandoff() {
    if (!state.game) return;
    const player = currentPlayer();
    if (!player) return;

    resetTurnStats(player);
    state.currentQuestion = null;
    state.phase = 'idle';

    const game = state.game;
    const roundLabel = `Round ${state.roundIndex + 1} di ${game.perPlayer}`;
    const turnLabel = `${roundLabel} · Turno ${state.turnIndex + 1} di ${game.players.length}`;
    const timeLabel = `${Math.round(game.timeLimitMs / 1000)}″`;
    const recordLabel = player.answered ? `${answerRatioLabel(player.correct, player.answered)}` : 'Prima risposta';
    el.handoffEyebrow.textContent = turnLabel;
    el.handoffLead.textContent = state.turnIndex === 0 && state.roundIndex === 0 ? 'Si comincia con' : 'Passa il telefono a';
    el.handoffName.textContent = player.name;
    el.handoffDesc.textContent = state.roundIndex === 0 && state.turnIndex === 0
      ? 'Una domanda a testa, poi si passa. Quando sei pronto, tocca il pulsante.'
      : 'Una domanda, poi il telefono passa. Niente sbirciatine.';
    el.handoffQuestions.textContent = '1';
    el.handoffTime.textContent = timeLabel;
    el.handoffMode.innerHTML = game.answerMode === 'written' ? '✍ Scrivi tu' : '<strong>4</strong> club';
    el.startTurnLabel.textContent = `Sono ${player.name}, si parte`;

    const initial = Array.from(player.name.trim())[0] || '?';
    const scoreLabel = `${player.score} ${player.score === 1 ? 'punto' : 'punti'}`;
    el.handoffVisual.innerHTML = `<div class="pass-card" style="--pc:${player.color}">
      <div class="pass-top"><span>Matchday pass</span><span>${roundLabel}</span></div>
      <div class="pass-center">
        <span class="pass-initial">${escapeHTML(initial.toUpperCase())}</span>
        <span class="pass-ball">${BALL_ICON}</span>
      </div>
      <div class="pass-bottom">
        <span class="pass-kicker">In campo adesso</span>
        <strong class="pass-name">${escapeHTML(player.name)}</strong>
        <div class="pass-facts"><span>Dom. ${state.roundIndex + 1}/${game.perPlayer}</span><span>${timeLabel}</span><span>${escapeHTML(scoreLabel)}</span></div>
        <span class="pass-record">${escapeHTML(recordLabel)}</span>
      </div>
      <span class="pass-note">Niente<br>sbirciatine</span>
    </div>`;

    showScreen('handoff', handoffTitle);
    setDocumentTitle(`Round ${state.roundIndex + 1} · Tocca a ${player.name}`);
    if (state.turnIndex > 0 || state.roundIndex > 0) audio.play('turn');
  }

  function beginTurn() {
    if (!state.game || state.screen !== 'handoff') return;
    audio.play('click');
    showScreen('game');
    renderQuestion();
  }

  /* ---------------------------------------------------------
     GAME
     --------------------------------------------------------- */

  function renderGameMeta() {
    const player = currentPlayer();
    if (!player) return;
    el.turnChip.style.setProperty('--pc', player.color);
    el.turnChipLabel.textContent = state.game.solo ? 'In campo' : `Round ${state.roundIndex + 1}/${state.game.perPlayer}`;
    el.gameAvatar.textContent = player.initials;
    el.gamePlayerName.textContent = player.name;
    el.gameScore.textContent = `${player.score} pt`;
    el.streakChip.hidden = player.currentStreak < 2;
    el.streakChip.textContent = player.currentStreak >= 2 ? `✦ Serie di ${player.currentStreak}` : '';
  }

  function renderProgress() {
    if (!state.game) return;
    const player = currentPlayer();
    const game = state.game;
    el.endRunBtn.hidden = !game.infinite;

    if (game.infinite) {
      const lives = Math.max(0, Number(player.lives) || 0);
      el.progressDots.hidden = true;
      el.progressLives.hidden = false;
      el.progressLives.innerHTML = Array.from({ length: INFINITE_LIVES }, (_, index) => (
        `<span class="life${index < lives ? '' : ' is-lost'}" aria-hidden="true">♥</span>`
      )).join('');
      el.progressLives.setAttribute('aria-label', `${lives} ${lives === 1 ? 'vita rimasta' : 'vite rimaste'} su ${INFINITE_LIVES}`);
      el.progressText.textContent = `Domanda ${state.roundIndex + 1} · ${answerRatioLabel(player.correct, player.answered)}`;
      return;
    }

    const total = game.perPlayer;
    const dots = [];
    el.progressDots.hidden = false;
    el.progressLives.hidden = true;
    for (let index = 0; index < total; index += 1) {
      let className = 'progress-dot';
      if (player.results[index] === true) className += ' is-correct';
      else if (player.results[index] === false) className += ' is-wrong';
      else if (index === state.roundIndex && state.phase === 'answering') className += ' is-active';
      dots.push(`<span class="${className}"></span>`);
    }
    el.progressDots.innerHTML = dots.join('');
    const answeredTotal = game.players.reduce((sum, item) => sum + item.answered, 0);
    const questionNumber = Math.min(game.totalQuestions, answeredTotal + (state.phase === 'feedback' ? 0 : 1));
    const record = `${answerRatioLabel(player.correct, player.answered)}`;
    el.progressText.textContent = game.solo
      ? `Domanda ${state.roundIndex + 1} di ${total} · ${record}`
      : `Round ${state.roundIndex + 1}/${total} · Tua ${state.roundIndex + 1}/${total} · Partita ${questionNumber}/${game.totalQuestions} · ${record}`;
  }

  function renderAnswers(question) {
    el.answers.innerHTML = question.options.map((option, index) => {
      const club = option.club;
      return `<button class="answer" type="button" data-index="${index}" style="animation-delay:${index * 45}ms">
        ${crestMarkup(club)}
        <span class="answer-copy">
          <span class="answer-name">${escapeHTML(club.name)}</span>
          <span class="answer-league"><span>${escapeHTML(leagueFor(club.country))}</span><span class="answer-country"> · ${escapeHTML(club.country)}</span></span>
        </span>
        <span class="answer-key" aria-hidden="true">${index + 1}</span>
      </button>`;
    }).join('');
    el.answers.classList.remove('is-locked');
  }

  function startQuestionTimer() {
    timerPauseReasons.clear();
    const limitMs = state.game.timeLimitMs;
    let lastSecond = Math.ceil(limitMs / 1000);
    gameTimer.limitMs = limitMs;
    setTimerUI(limitMs);
    gameTimer.start((milliseconds) => {
      setTimerUI(milliseconds);
      const seconds = Math.ceil(milliseconds / 1000);
      if (seconds !== lastSecond) {
        if (seconds > 0 && seconds <= 5) audio.play('tick');
        lastSecond = seconds;
      }
    }, handleTimeout);
  }

  function renderQuestion() {
    if (!state.game) return;
    const player = currentPlayer();
    const game = state.game;
    const question = questionAt(state.roundIndex);
    if (!player) {
      showToast('Qualcosa non quadra nel tabellone. Ricomincia la partita.');
      return;
    }
    if (!question) {
      if (game.infinite) {
        game.exhausted = true;
        showFinal();
        return;
      }
      showToast('Qualcosa non quadra nel tabellone. Ricomincia la partita.');
      return;
    }

    hideFeedback();
    state.currentQuestion = question;
    state.phase = 'answering';
    state.writtenSubmitAt = 0;
    const written = game.answerMode === 'written';

    el.gameSticker.innerHTML = stickerMarkup(question.player, {
      hideClubColors: true,
      hideAge: game.difficulty === 'estremo',
      minimal: game.difficulty === 'estremo'
    });
    el.gameSticker.style.setProperty('--player-color', player.color);
    el.questionTitle.innerHTML = `Dove gioca <em>${escapeHTML(question.player.name)}</em>?`;
    el.answers.hidden = written;
    el.answers.classList.remove('is-locked');
    el.writtenForm.hidden = !written;
    el.writtenForm.classList.remove('is-locked', 'is-shaking');
    el.writtenInput.disabled = false;
    el.writtenInput.value = '';
    el.writtenInput.setAttribute('aria-invalid', 'false');
    if (written) {
      el.answers.innerHTML = '';
      el.keyHint.innerHTML = '<span><kbd>Invio</kbd> per confermare · nessuna opzione</span><span class="key-hint-time">+50 punti se esatta</span>';
      try {
        el.writtenInput.focus({ preventScroll: true });
      } catch (error) {
        el.writtenInput.focus();
      }
    } else {
      renderAnswers(question);
      el.keyHint.innerHTML = '<span><kbd>1</kbd>—<kbd>4</kbd> per rispondere</span><span class="key-hint-time">Più veloce = più punti</span>';
    }
    renderGameMeta();
    renderProgress();
    startQuestionTimer();
    setDocumentTitle(`Dove gioca ${question.player.name}?`);

    window.clearTimeout(feedbackFocusTimer);
    if (!written) {
      feedbackFocusTimer = window.setTimeout(() => {
        if (state.screen === 'game' && state.phase === 'answering') {
          try {
            el.questionTitle.focus({ preventScroll: true });
          } catch (error) {
            el.questionTitle.focus();
          }
        }
      }, state.roundIndex === 0 ? 240 : 80);
    }
  }

  function bumpScore() {
    window.clearTimeout(scoreBumpTimer);
    el.gameScore.classList.remove('is-bumping');
    void el.gameScore.offsetWidth;
    el.gameScore.classList.add('is-bumping');
    scoreBumpTimer = window.setTimeout(() => el.gameScore.classList.remove('is-bumping'), 520);
  }

  function handleTimeout() {
    if (state.phase !== 'answering') return;
    answerQuestion(null);
  }

  function shakeWrittenForm() {
    el.writtenForm.classList.remove('is-shaking');
    void el.writtenForm.offsetWidth;
    el.writtenForm.classList.add('is-shaking');
    window.setTimeout(() => el.writtenForm.classList.remove('is-shaking'), 380);
  }

  function submitWrittenAnswer() {
    if (!state.game || state.game.answerMode !== 'written' || state.phase !== 'answering' || !state.currentQuestion) return;
    const value = el.writtenInput.value.trim().replace(/\s+/g, ' ');
    if (!value) {
      shakeWrittenForm();
      el.writtenInput.focus();
      return;
    }
    const matched = matchWrittenClub(value);
    state.writtenSubmitAt = performance.now();
    resolveAnswer({
      correct: matched === state.currentQuestion.correctClub.name,
      selectedIndex: null,
      isTimeout: false,
      writtenAnswer: value
    });
  }

  function answerQuestion(selectedIndex) {
    if (!state.game || state.phase !== 'answering' || !state.currentQuestion) return;
    // In written mode only the timeout path (selectedIndex === null) may use
    // this function; normal submissions go through submitWrittenAnswer().
    if (state.game.answerMode !== 'choices' && selectedIndex !== null) return;
    const question = state.currentQuestion;
    const isTimeout = selectedIndex === null;
    const selected = isTimeout ? null : question.options[selectedIndex];
    if (!isTimeout && !selected) return;

    resolveAnswer({
      correct: Boolean(selected && selected.correct),
      selectedIndex,
      isTimeout,
      writtenAnswer: ''
    });
  }

  function resolveAnswer({ correct, selectedIndex = null, isTimeout = false, writtenAnswer = '' }) {
    if (!state.game || state.phase !== 'answering' || !state.currentQuestion) return;
    const player = currentPlayer();
    const question = state.currentQuestion;
    const game = state.game;
    const remainingMs = gameTimer.getRemaining();
    const limitMs = game.timeLimitMs;
    const limitSeconds = limitMs / 1000;
    state.phase = 'feedback';
    gameTimer.stop();
    const elapsed = clamp((limitMs - remainingMs) / 1000, 0, limitSeconds);
    let points = 0;
    let streakBonus = 0;
    let speedBonus = 0;
    let writtenBonus = 0;

    if (correct) {
      speedBonus = clamp(Math.round((remainingMs / limitMs) * 50), 0, 50);
      writtenBonus = writtenAnswer ? WRITTEN_POINTS : 0;
      player.currentStreak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      player.turnBestStreak = Math.max(player.turnBestStreak, player.currentStreak);
      player.roundBestStreak = Math.max(player.roundBestStreak, player.currentStreak);
      streakBonus = Math.min(60, Math.max(0, 15 * (player.currentStreak - 1)));
      points = 100 + speedBonus + streakBonus + writtenBonus;
      player.score += points;
      player.correct += 1;
      player.roundCorrect += 1;
    } else {
      player.currentStreak = 0;
      if (game.infinite) player.lives = Math.max(0, (player.lives || 0) - 1);
    }

    player.answered += 1;
    player.totalTime += elapsed;
    player.turnTime += elapsed;
    player.turnAnswers += 1;
    player.turnPoints += points;
    player.roundTime += elapsed;
    player.roundAnswers += 1;
    player.roundPoints += points;
    if (game.infinite) player.results.push(correct);
    else player.results[state.roundIndex] = correct;

    if (game.answerMode === 'written') {
      el.writtenInput.disabled = true;
      el.writtenForm.classList.add('is-locked');
      el.writtenInput.setAttribute('aria-invalid', String(!correct));
    } else {
      const buttons = Array.from(el.answers.querySelectorAll('.answer'));
      const correctIndex = question.correctIndex;
      buttons.forEach((button, index) => {
        button.setAttribute('aria-disabled', 'true');
        button.tabIndex = -1;
        const key = button.querySelector('.answer-key');
        if (index === correctIndex) {
          button.classList.add('is-correct');
          if (key) key.textContent = '✓';
        } else if (index === selectedIndex) {
          button.classList.add('is-wrong');
          if (key) key.textContent = '✕';
        } else {
          button.classList.add('is-muted');
        }
      });
      el.answers.classList.add('is-locked');
    }

    renderGameMeta();
    renderProgress();
    if (correct) bumpScore();

    if (correct) {
      audio.play('correct');
      vibrate([14, 28, 16]);
    } else if (isTimeout) {
      audio.play('wrong');
      vibrate([24, 36, 24]);
    } else {
      audio.play('wrong');
      vibrate([45, 45, 25]);
    }

    showFeedback({ question, correct, isTimeout, points, speedBonus, streakBonus, writtenAnswer, writtenBonus });
  }

  function showFeedback({ question, correct, isTimeout, points, speedBonus, streakBonus, writtenAnswer = '', writtenBonus = 0 }) {
    const player = currentPlayer();
    const game = state.game;
    const club = question.correctClub;
    const revealedSticker = el.gameSticker.querySelector('.player-sticker');
    if (revealedSticker) {
      revealedSticker.style.setProperty('--club-a', safeColor(club.c1, '#172117'));
      revealedSticker.style.setProperty('--club-b', safeColor(club.c2, '#d8ff3e'));
    }
    const infinite = game.infinite;
    const gameOver = infinite && player.lives <= 0;
    const isLast = !infinite && state.roundIndex >= game.perPlayer - 1;
    const duration = correct ? 2600 : writtenAnswer ? 4400 : 3800;
    const livesLeft = infinite ? Math.max(0, player.lives) : 0;
    const livesText = infinite
      ? (livesLeft === 1 ? 'Ti resta una vita.' : `Ti restano ${livesLeft} vite.`)
      : '';
    const titleOptions = correct
      ? ['Che colpo!', 'Palla in rete!', 'Da applausi!', 'Risposta da campione!']
      : gameOver
        ? ['Corsa finita', 'Fino a qui', 'L’ultima vita']
        : isTimeout
          ? ['Tempo scaduto', 'Troppo lenti', 'Il tempo è volato']
          : ['Fuori di poco', 'Palla fuori', 'Non ci siamo'];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    const kicker = correct ? 'Risposta esatta' : gameOver ? 'Run conclusa' : isTimeout ? 'Tempo scaduto' : 'Risposta sbagliata';
    let subtitle;
    if (correct) {
      const streakText = player.currentStreak >= 2 ? `Serie di ${player.currentStreak}. ` : '';
      if (writtenAnswer) {
        subtitle = `${streakText}Hai scritto ${writtenAnswer}: +${writtenBonus} punti. ${infinite ? livesText : 'Continua così.'}`;
      } else {
        subtitle = infinite
          ? `${streakText}${livesText}`
          : `${streakText}Il club era quello giusto. Continua così.`;
      }
    } else if (writtenAnswer) {
      subtitle = gameOver
        ? `Hai scritto ${writtenAnswer}. La corsa finisce qui: ${club.name} era la risposta.`
        : `Hai scritto ${writtenAnswer}. La risposta corretta era ${club.name}. ${infinite ? livesText : ''}`.trim();
    } else if (gameOver) {
      subtitle = `La corsa finisce qui: ${club.name} era la risposta.`;
    } else if (isTimeout) {
      subtitle = infinite
        ? `${club.name} era la risposta. ${livesText}`
        : `${club.name} era la risposta. Il tempo però è volato.`;
    } else {
      subtitle = infinite
        ? `La risposta corretta era ${club.name}. ${livesText}`
        : `La risposta corretta era ${club.name}.`;
    }
    const nextPlayer = !game.solo && state.turnIndex + 1 < game.count
      ? game.players[state.turnIndex + 1]
      : null;
    const nextLabel = infinite
      ? (gameOver ? 'Vedi il risultato' : 'Prossima domanda')
      : game.solo
        ? (isLast ? 'Vedi il risultato' : 'Prossima domanda')
        : nextPlayer
          ? `Passa a ${nextPlayer.name}`
          : `Vedi il round ${state.roundIndex + 1}`;

    const bonusParts = [];
    if (correct && speedBonus > 0) bonusParts.push('velocità');
    if (correct && streakBonus > 0) bonusParts.push('serie');
    if (correct && writtenBonus > 0) bonusParts.push('scritta');
    const pointsLabel = bonusParts.length === 0
      ? 'punti'
      : bonusParts.length === 1
        ? `bonus ${bonusParts[0]}`
        : bonusParts.join(' + ');

    el.feedback.classList.toggle('is-wrong', !correct);
    el.feedback.style.setProperty('--feedback-time', `${duration}ms`);
    el.feedback.innerHTML = `<div class="feedback-main">
      <div class="feedback-status">
        <span class="feedback-kicker">${escapeHTML(kicker)}</span>
        <strong class="feedback-title">${escapeHTML(title)}</strong>
        <span class="feedback-sub">${escapeHTML(subtitle)}</span>
      </div>
      <div class="feedback-answer">
        ${crestMarkup(club, 'crest--large')}
        <span class="feedback-answer-copy">
          <span class="feedback-answer-label">La risposta giusta</span>
          <span class="feedback-club">${escapeHTML(club.name)}</span>
        </span>
      </div>
      <div class="feedback-points">
        <strong>${points > 0 ? `+${points}` : '0'}</strong>
        <span>${pointsLabel}</span>
      </div>
      <button class="feedback-next" type="button">${escapeHTML(nextLabel)}<span class="button-arrow">${ARROW_ICON}</span></button>
    </div>
    <div class="feedback-progress"><i></i></div>`;
    el.feedback.hidden = false;

    const nextButton = el.feedback.querySelector('.feedback-next');
    if (nextButton) {
      nextButton.addEventListener('click', advanceFromFeedback);
      window.clearTimeout(feedbackFocusTimer);
      feedbackFocusTimer = window.setTimeout(() => {
        if (state.phase === 'feedback' && !el.rulesDialog.open) {
          try {
            nextButton.focus({ preventScroll: true });
          } catch (error) {
            nextButton.focus();
          }
        }
      }, 110);
    }

    scheduleFeedbackAdvance(duration);
  }

  function scheduleFeedbackAdvance(duration) {
    clearFeedbackAdvance();
    feedbackAuto = {
      remaining: duration,
      startedAt: performance.now(),
      paused: false,
      id: window.setTimeout(advanceFromFeedback, duration)
    };
  }

  function clearFeedbackAdvance() {
    if (!feedbackAuto) return;
    window.clearTimeout(feedbackAuto.id);
    feedbackAuto = null;
  }

  function pauseFeedbackAdvance() {
    if (!feedbackAuto || feedbackAuto.paused) return;
    window.clearTimeout(feedbackAuto.id);
    const elapsed = performance.now() - feedbackAuto.startedAt;
    feedbackAuto.remaining = Math.max(250, feedbackAuto.remaining - elapsed);
    feedbackAuto.paused = true;
    const bar = el.feedback.querySelector('.feedback-progress i');
    if (bar) bar.style.animationPlayState = 'paused';
  }

  function resumeFeedbackAdvance() {
    if (!feedbackAuto || !feedbackAuto.paused) return;
    if (document.hidden || el.rulesDialog.open || state.screen !== 'game' || state.phase !== 'feedback') return;
    feedbackAuto.paused = false;
    feedbackAuto.startedAt = performance.now();
    feedbackAuto.id = window.setTimeout(advanceFromFeedback, feedbackAuto.remaining);
    const bar = el.feedback.querySelector('.feedback-progress i');
    if (bar) bar.style.animationPlayState = 'running';
  }

  function hideFeedback() {
    clearFeedbackAdvance();
    window.clearTimeout(feedbackFocusTimer);
    el.feedback.hidden = true;
    el.feedback.innerHTML = '';
  }

  function advanceFromFeedback() {
    if (!state.game || state.phase !== 'feedback' || state.screen !== 'game') return;
    clearFeedbackAdvance();
    state.phase = 'advancing';
    hideFeedback();

    if (state.game.infinite) {
      if (currentPlayer().lives <= 0) {
        showFinal();
      } else {
        state.roundIndex += 1;
        renderQuestion();
      }
      return;
    }

    if (state.game.solo) {
      if (state.roundIndex + 1 >= state.game.perPlayer) {
        showFinal();
      } else {
        state.roundIndex += 1;
        renderQuestion();
      }
      return;
    }

    if (state.turnIndex + 1 < state.game.count) {
      state.turnIndex += 1;
      showHandoff();
    } else {
      endRound();
    }
  }

  /* ---------------------------------------------------------
     RANKING, SUMMARY, FINAL
     --------------------------------------------------------- */

  function rankPlayers(players) {
    return players.slice().sort((first, second) => (
      second.score - first.score ||
      second.correct - first.correct ||
      second.bestStreak - first.bestStreak ||
      first.totalTime - second.totalTime ||
      first.order - second.order
    ));
  }

  function accuracyFor(player) {
    return player.answered ? Math.round((player.correct / player.answered) * 100) : 0;
  }

  function answerRatioLabel(correct, answered) {
    const right = Number(correct) || 0;
    const total = Number(answered) || 0;
    return `${right}/${total} ${right === 1 && total === 1 ? 'esatta' : 'esatte'}`;
  }

  function averageTimeFor(player) {
    return player.answered ? player.totalTime / player.answered : 0;
  }

  function formatDuration(seconds) {
    return `${Math.max(0, seconds).toFixed(2).replace('.', ',')}s`;
  }

  function tiebreakSentence(winner, second) {
    if (!second || winner.score !== second.score) return '';
    if (winner.correct !== second.correct) {
      return ` Pareggio spezzato dalle risposte esatte: ${winner.correct} a ${second.correct}.`;
    }
    if (winner.bestStreak !== second.bestStreak) {
      return ` Pareggio spezzato dalla miglior serie: ${winner.bestStreak} a ${second.bestStreak}.`;
    }
    if (winner.totalTime !== second.totalTime) {
      return ` Pareggio spezzato dal tempo totale: ${formatDuration(winner.totalTime)} contro ${formatDuration(second.totalTime)}.`;
    }
    return ' Parità assoluta: decide l’ordine di gioco.';
  }

  function renderLeaderboard(highlightCurrent = true) {
    const ranked = rankPlayers(state.game.players);
    const current = highlightCurrent ? currentPlayer() : null;
    const topScore = Math.max(1, ...ranked.map((player) => player.score));

    el.leaderboardList.innerHTML = ranked.map((player, index) => {
      const isCurrent = Boolean(current && player.id === current.id);
      const meter = player.score > 0 ? Math.max(6, Math.round((player.score / topScore) * 100)) : 4;
      return `<div class="lb-row${isCurrent ? ' is-current' : ''}${index === 0 ? ' is-leader' : ''}" style="--pc:${player.color};--meter:${meter}%"${isCurrent ? ' aria-current="true"' : ''}>
        <span class="lb-rank">${index + 1}</span>
        <span class="lb-avatar">${escapeHTML(player.initials)}</span>
        <span class="lb-info">
          <span class="lb-name"><strong>${escapeHTML(player.name)}</strong><span>${answerRatioLabel(player.correct, player.answered)}</span></span>
          <span class="lb-meter"><i></i></span>
        </span>
        <span class="lb-score">${player.score}<small>pt</small></span>
      </div>`;
    }).join('');
    el.leaderboardTurn.textContent = String(state.roundIndex + 1);
  }

  function endRound() {
    if (!state.game) return;
    state.phase = 'roundSummary';
    gameTimer.stop();
    timerPauseReasons.clear();
    hideFeedback();

    const ranked = rankPlayers(state.game.players);
    const leader = ranked[0];
    const roundBest = state.game.players.slice().sort((first, second) => (
      second.roundPoints - first.roundPoints ||
      second.roundCorrect - first.roundCorrect ||
      second.roundBestStreak - first.roundBestStreak ||
      first.order - second.order
    ))[0];
    const totalQuestions = state.game.totalQuestions;
    const answered = state.game.players.reduce((sum, player) => sum + player.answered, 0);
    const roundNumber = state.roundIndex + 1;

    el.summaryEyebrow.textContent = `Round ${roundNumber} di ${state.game.perPlayer} concluso`;
    el.summaryTitle.innerHTML = `Round <em>${roundNumber}</em> archiviato.`;
    el.summaryDesc.textContent = `In testa ${leader.name} con ${leader.score} punti. Miglior round: ${roundBest.name}, +${roundBest.roundPoints}.`;
    el.summaryPoints.textContent = `+${roundBest.roundPoints}`;
    el.summaryTotal.textContent = `Leader: ${leader.name} · ${leader.score} pt`;
    el.summaryStats.innerHTML = [
      { value: `${roundNumber}/${state.game.perPlayer}`, label: 'Round' },
      { value: `${answered}/${totalQuestions}`, label: 'Domande giocate' },
      { value: `${leader.correct}/${leader.answered}`, label: 'Esatte del leader' }
    ].map((stat) => `<div class="summary-stat"><strong>${escapeHTML(stat.value)}</strong><span>${escapeHTML(stat.label)}</span></div>`).join('');

    if (roundNumber >= state.game.perPlayer) {
      el.summaryNextLabel.textContent = 'La classifica finale';
      el.summaryNextNote.textContent = 'Ultimo round. È il momento della verità.';
    } else {
      const nextRound = roundNumber + 1;
      const firstPlayer = state.game.players[0];
      el.summaryNextLabel.textContent = `Inizia il round ${nextRound} · Tocca a ${firstPlayer.name}`;
      el.summaryNextNote.textContent = `Si riparte da ${firstPlayer.name}. Le serie restano vive.`;
    }

    renderLeaderboard(false);
    showScreen('summary', el.summaryTitle);
    setDocumentTitle(`Riepilogo round ${roundNumber}`);
    audio.play('turn');
  }

  function handleSummaryNext() {
    if (!state.game || state.screen !== 'summary') return;
    audio.play('click');
    if (state.roundIndex + 1 >= state.game.perPlayer) {
      showFinal();
      return;
    }
    state.roundIndex += 1;
    state.turnIndex = 0;
    state.game.players.forEach(resetRoundStats);
    resetTurnStats(state.game.players[0]);
    showHandoff();
  }

  function renderPodium(ranked) {
    const visible = ranked.slice(0, 3);
    el.podium.innerHTML = visible.map((player, index) => {
      const place = index + 1;
      const order = place === 1 ? 2 : place === 2 ? 1 : 3;
      return `<div class="podium-item is-${place === 1 ? 'first' : place === 2 ? 'second' : 'third'}" style="--pc:${player.color};order:${order}" aria-label="${place}° posto: ${escapeHTML(player.name)}, ${player.score} punti">
        <div class="podium-person">
          <span class="podium-avatar">${escapeHTML(player.initials)}</span>
          <span class="podium-name">${escapeHTML(player.name)}</span>
          <span class="podium-score">${player.score} pt</span>
        </div>
        <div class="podium-block"><strong>${place}</strong></div>
        <div class="podium-floor"></div>
      </div>`;
    }).join('');
  }

  function renderRanking(ranked) {
    el.rankingList.innerHTML = ranked.map((player, index) => (
      `<div class="rank-row${index === 0 ? ' is-winner' : ''}" style="--pc:${player.color}">
        <span class="rank-number">${index + 1}</span>
        <span class="rank-avatar">${escapeHTML(player.initials)}</span>
        <div class="rank-copy">
          <strong>${escapeHTML(player.name)}</strong>
          <span>${answerRatioLabel(player.correct, player.answered)} · ${accuracyFor(player)}% precisione</span>
        </div>
        <span class="rank-points">${player.score}<small>pt</small></span>
      </div>`
    )).join('');
  }

  function showFinal() {
    if (!state.game) return;
    const ranked = rankPlayers(state.game.players);
    const winner = ranked[0];
    const second = ranked[1];
    const accuracy = accuracyFor(winner);
    const season = DATA.season || '2026/27';
    const solo = state.game.solo;
    const infinite = state.game.infinite;
    const exhausted = state.game.exhausted;
    const endedByPlayer = state.game.endedByPlayer;
    state.phase = 'final';
    gameTimer.stop();
    timerPauseReasons.clear();
    hideFeedback();
    el.endRunBtn.hidden = true;
    el.finalScreen.classList.toggle('is-solo', solo);
    el.winnerCard.style.setProperty('--pc', winner.color);
    el.rematchBtn.querySelector('span').textContent = solo ? 'Rigioca' : 'Rivincita';

    if (solo) {
      el.finalTitle.innerHTML = infinite
        ? (exhausted
          ? `<em>${escapeHTML(winner.name)}</em>,<br>tabellone finito.`
          : endedByPlayer
            ? `<em>${escapeHTML(winner.name)}</em>,<br>corsa chiusa.`
            : `<em>${escapeHTML(winner.name)}</em>,<br>fino all'ultima vita.`)
        : `<em>${escapeHTML(winner.name)}</em>,<br>partita chiusa.`;
      const answeredWord = winner.answered === 1 ? 'domanda' : 'domande';
      const correctWord = winner.correct === 1 ? 'esatta' : 'esatte';
      el.finalDesc.textContent = infinite
        ? `Corsa conclusa dopo ${winner.answered} ${answeredWord} e ${winner.score} punti: ${winner.correct} ${correctWord} su ${winner.answered} (${accuracy}%).${exhausted ? ' Hai svuotato il tabellone: non succede quasi mai.' : endedByPlayer ? ' Hai scelto tu quando fermarti.' : ' Le vite sono finite.'}`
        : `Hai risposto a ${winner.answered} ${answeredWord} e chiuso a ${winner.score} punti. ${winner.correct === winner.answered ? 'En plein: non ne hai sbagliata una.' : `Serie migliore: ${winner.bestStreak}.`}`;
      el.winnerCard.innerHTML = `<span class="winner-stamp">${infinite ? 'Infinita' : 'Solo'}<br>${escapeHTML(season)}</span>
        <span class="winner-kicker"><span>★</span> ${infinite ? 'La tua corsa' : 'Sfida completata'}</span>
        <span class="winner-initials">${escapeHTML(winner.initials)}</span>
        <span class="winner-label">Punteggio finale</span>
        <div class="winner-score"><strong>${winner.score}</strong><span>punti</span></div>
        <div class="winner-stats">
          ${infinite
            ? `<span>${winner.answered} ${answeredWord}</span><span>${winner.correct} ${correctWord}</span><span>Serie ${winner.bestStreak}</span>`
            : `<span>${answerRatioLabel(winner.correct, winner.answered)}</span><span>Serie ${winner.bestStreak}</span><span>${accuracy}% precisione</span>`}
        </div>`;
      el.podium.innerHTML = '';
      el.rankingList.innerHTML = '';
    } else {
      el.finalTitle.innerHTML = `<em>${escapeHTML(winner.name)}</em>,<br>alza la coppa.`;
      el.finalDesc.textContent = `Dopo ${state.game.totalQuestions} domande, ${winner.name} chiude a ${winner.score} punti.${second ? ` Sul secondo gradino ${second.name} con ${second.score}.` : ''}${tiebreakSentence(winner, second)}`;
      el.winnerCard.innerHTML = `<span class="winner-stamp">Campione<br>${escapeHTML(season)}</span>
        <span class="winner-kicker"><span>★</span> Primo posto</span>
        <span class="winner-initials">${escapeHTML(winner.initials)}</span>
        <span class="winner-label">Campione della partita</span>
        <div class="winner-score"><strong>${winner.score}</strong><span>punti</span></div>
        <div class="winner-stats">
          <span>${answerRatioLabel(winner.correct, winner.answered)}</span>
          <span>Serie ${winner.bestStreak}</span>
          <span>${accuracy}% precisione</span>
        </div>`;
      renderPodium(ranked);
      renderRanking(ranked);
    }

    showScreen('final', el.finalTitle);
    setDocumentTitle(solo ? (infinite ? `Corsa di ${winner.name}` : `Partita di ${winner.name}`) : `${winner.name} campione`);
    audio.play('final');
    scheduleCelebration();
  }

  /* ---------------------------------------------------------
     CONFETTI
     --------------------------------------------------------- */

  let confettiFrame = 0;

  function stopCelebration() {
    window.clearTimeout(celebrationTimer);
    if (confettiFrame) {
      window.cancelAnimationFrame(confettiFrame);
      confettiFrame = 0;
    }
    const context = el.confetti.getContext('2d');
    if (context) context.clearRect(0, 0, el.confetti.width, el.confetti.height);
  }

  function scheduleCelebration() {
    stopCelebration();
    if (reduceMotion) return;
    celebrationTimer = window.setTimeout(launchConfetti, 320);
  }

  function launchConfetti() {
    if (reduceMotion) return;
    const canvas = el.confetti;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = ['#d8ff3e', '#ff604d', '#b9dcff', '#d8c6ff', '#ffd36e', '#fcf7ec', '#172117'];
    const pieces = Array.from({ length: window.innerWidth < 700 ? 110 : 165 }, () => ({
      x: Math.random() * width,
      y: -24 - Math.random() * height * 0.55,
      vx: (Math.random() - 0.5) * 1.25,
      vy: 1.65 + Math.random() * 2.45,
      width: 5 + Math.random() * 7,
      height: 7 + Math.random() * 10,
      rotation: Math.random() * Math.PI,
      speed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.16 ? 'circle' : 'rect',
      wobble: Math.random() * Math.PI * 2,
      life: 0,
      maxLife: 260 + Math.random() * 170
    }));

    let lastFrame = performance.now();
    function draw(now) {
      const step = Math.min(2.2, (now - lastFrame) / 16.67);
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      let alive = false;

      pieces.forEach((piece) => {
        piece.life += step;
        piece.x += piece.vx * step + Math.sin((piece.life + piece.wobble) * 0.05) * 0.45;
        piece.y += piece.vy * step;
        piece.vy += 0.03 * step;
        piece.rotation += piece.speed * step;
        if (piece.y < height + 50 && piece.life < piece.maxLife) {
          alive = true;
          const fade = Math.min(1, (piece.maxLife - piece.life) / 40);
          context.save();
          context.translate(piece.x, piece.y);
          context.rotate(piece.rotation);
          context.globalAlpha = Math.max(0, fade);
          context.fillStyle = piece.color;
          if (piece.shape === 'circle') {
            context.beginPath();
            context.arc(0, 0, piece.width * 0.48, 0, Math.PI * 2);
            context.fill();
          } else {
            context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
          }
          context.restore();
        }
      });

      if (alive) {
        confettiFrame = window.requestAnimationFrame(draw);
      } else {
        confettiFrame = 0;
        context.clearRect(0, 0, width, height);
      }
    }
    confettiFrame = window.requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     SHARE / NAVIGATION
     --------------------------------------------------------- */

  function shareText() {
    if (!state.game) return '';
    if (state.game.solo) {
      const player = state.game.players[0];
      if (state.game.infinite) {
        return `🏆 Indovina la Squadra — Modalità infinita\n${player.name}: ${player.score} pt · ${answerRatioLabel(player.correct, player.answered)} · serie ${player.bestStreak}`;
      }
      return `🏆 Indovina la Squadra — Solo\n${player.name}: ${player.score} pt (${player.correct}/${player.answered})`;
    }
    const ranked = rankPlayers(state.game.players);
    const lines = ranked.map((player, index) => (
      `${index + 1}. ${player.name} — ${player.score} pt (${player.correct}/${player.answered})`
    ));
    return `🏆 Indovina la Squadra — Stagione ${DATA.season || '2026/27'}\n${lines.join('\n')}`;
  }

  function withTimeout(promise, milliseconds, fallback) {
    return Promise.race([
      Promise.resolve(promise).catch(() => fallback),
      new Promise((resolve) => window.setTimeout(() => resolve(fallback), milliseconds))
    ]);
  }

  function legacyCopyText(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-100px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand('copy');
      textArea.remove();
      return copied;
    } catch (error) {
      return false;
    }
  }

  async function copyText(text) {
    if (legacyCopyText(text)) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          navigator.clipboard.writeText(text).catch(() => {});
        } catch (error) {
          /* The synchronous copy already succeeded. */
        }
      }
      return true;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        const copied = await withTimeout(
          navigator.clipboard.writeText(text).then(() => true),
          900,
          false
        );
        if (copied) return true;
      } catch (error) {
        /* Fall through to the unavailable state. */
      }
    }
    return false;
  }

  async function handleShare() {
    if (!state.game || state.phase !== 'final') return;
    audio.play('click');
    const text = shareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Indovina la Squadra', text });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
    const copied = await copyText(text);
    showToast(copied ? 'Risultato copiato. Incollalo nella chat!' : 'Copia non disponibile su questo browser.');
  }

  function rematch() {
    if (!state.game) return;
    const config = { ...state.game.config, names: state.game.config.names.slice() };
    audio.play('click');
    startGame(config);
  }

  function returnToSetup() {
    stopRound();
    stopCelebration();
    state.game = null;
    state.phase = 'idle';
    state.turnIndex = 0;
    state.roundIndex = 0;
    state.writtenSubmitAt = 0;
    state.currentQuestion = null;
    el.finalScreen.classList.remove('is-solo');
    renderSetup({ save: false });
    showScreen('setup', heroTitle);
    setDocumentTitle('');
  }

  function handleBrand() {
    if (state.screen === 'setup') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (state.screen === 'final') {
      returnToSetup();
      return;
    }
    showToast('Partita in corso: finisci la partita.');
  }

  /* ---------------------------------------------------------
     RULES
     --------------------------------------------------------- */

  function openRules() {
    if (el.rulesDialog.open) return;
    audio.play('click');
    updateRulesUI();
    el.abortGameBtn.hidden = !state.game || !['handoff', 'game', 'summary'].includes(state.screen);
    pauseGameTimer('rules');
    pauseFeedbackAdvance();
    if (typeof el.rulesDialog.showModal === 'function') {
      el.rulesDialog.showModal();
    } else {
      el.rulesDialog.setAttribute('open', '');
    }
  }

  function closeRules() {
    if (!el.rulesDialog.open) return;
    audio.play('click');
    el.rulesDialog.close();
  }

  /* ---------------------------------------------------------
     EVENT BINDING
     --------------------------------------------------------- */

  function navigateCount(delta) {
    const next = clamp(state.settings.count + delta, MIN_PLAYERS, MAX_PLAYERS);
    if (next === state.settings.count) return;
    state.settings.count = next;
    audio.play('click');
    renderSetup();
  }

  function bindSetup() {
    el.countMinus.addEventListener('click', () => navigateCount(-1));
    el.countPlus.addEventListener('click', () => navigateCount(1));

    el.answerModeSegment.addEventListener('click', (event) => {
      const button = event.target.closest('[data-value]');
      if (!button) return;
      const value = button.dataset.value === 'written' ? 'written' : 'choices';
      if (value === state.settings.answerMode) return;
      state.settings.answerMode = value;
      audio.play('click');
      renderSetup();
    });

    el.questionsSegment.addEventListener('click', (event) => {
      const button = event.target.closest('[data-value]');
      if (!button) return;
      const value = Number(button.dataset.value);
      if (![3, 5, 7].includes(value) || value === state.settings.perPlayer) return;
      state.settings.perPlayer = value;
      audio.play('click');
      renderSetup();
    });

    el.difficultyGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-difficulty]');
      if (!button) return;
      const value = button.dataset.difficulty;
      if (!DIFFICULTIES[value] || value === state.settings.difficulty) return;
      state.settings.difficulty = value;
      audio.play('click');
      renderSetup();
    });

    el.leagueSelect.addEventListener('change', () => {
      const value = el.leagueSelect.value;
      state.settings.league = value === 'all' || LEAGUES[value] ? value : 'all';
      audio.play('click');
      renderSetup();
    });

    el.infiniteToggle.addEventListener('change', () => {
      state.settings.infinite = el.infiniteToggle.checked;
      audio.play('click');
      renderSetup();
    });

    el.setupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      readNamesFromInputs();
      saveSettings();
      const config = {
        count: state.settings.count,
        names: state.settings.names.slice(),
        perPlayer: state.settings.perPlayer,
        difficulty: state.settings.difficulty,
        league: state.settings.league,
        infinite: state.settings.infinite,
        answerMode: state.settings.answerMode
      };
      startGame(config);
    });
  }

  function bindGame() {
    el.startTurnBtn.addEventListener('click', beginTurn);
    el.writtenForm.addEventListener('submit', (event) => {
      event.preventDefault();
      submitWrittenAnswer();
    });
    el.endRunBtn.addEventListener('click', () => {
      if (!state.game || !state.game.infinite || state.screen !== 'game') return;
      audio.play('click');
      state.game.endedByPlayer = true;
      showFinal();
    });
    el.answers.addEventListener('click', (event) => {
      const button = event.target.closest('.answer');
      if (!button || state.phase !== 'answering') return;
      answerQuestion(Number(button.dataset.index));
    });
    el.summaryNextBtn.addEventListener('click', handleSummaryNext);
    el.rematchBtn.addEventListener('click', rematch);
    el.newGameBtn.addEventListener('click', () => {
      audio.play('click');
      returnToSetup();
    });
    el.shareBtn.addEventListener('click', handleShare);
  }

  function bindGlobal() {
    el.brandBtn.addEventListener('click', handleBrand);
    el.rulesBtn.addEventListener('click', openRules);
    el.closeRulesBtn.addEventListener('click', closeRules);
    el.rulesOkBtn.addEventListener('click', closeRules);
    el.abortGameBtn.addEventListener('click', () => {
      if (!state.game) return;
      if (!window.confirm('Abbandonare la partita? Il progresso non verrà salvato.')) return;
      closeRules();
      returnToSetup();
      showToast('Partita abbandonata.');
    });
    el.rulesDialog.addEventListener('click', (event) => {
      if (event.target === el.rulesDialog) closeRules();
    });
    el.rulesDialog.addEventListener('close', () => {
      resumeGameTimer('rules');
      resumeFeedbackAdvance();
    });

    el.soundBtn.addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      saveSettings();
      updateSoundUI();
      if (state.settings.sound) audio.play('click');
    });

    document.addEventListener('pointerdown', () => audio.ensure(), { once: true, capture: true });
    document.addEventListener('keydown', () => audio.ensure(), { once: true, capture: true });

    document.addEventListener('keydown', (event) => {
      if (el.rulesDialog.open || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      const activate = event.key === 'Enter' || event.key === ' ';
      if (activate && target && target.tagName === 'BUTTON') return;

      if (state.screen === 'handoff' && activate) {
        event.preventDefault();
        el.startTurnBtn.click();
        return;
      }
      if (state.screen === 'summary' && activate) {
        event.preventDefault();
        el.summaryNextBtn.click();
        return;
      }

      if (state.screen !== 'game') return;
      if (state.phase === 'answering' && state.game && state.game.answerMode === 'choices' && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        answerQuestion(Number(event.key) - 1);
      } else if (state.phase === 'feedback' && (event.key === 'Enter' || event.key === ' ')) {
        if (performance.now() - state.writtenSubmitAt < 350) return;
        event.preventDefault();
        advanceFromFeedback();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseGameTimer('visibility');
        pauseFeedbackAdvance();
      } else {
        resumeGameTimer('visibility');
        resumeFeedbackAdvance();
      }
    });
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */

  function hydrateData() {
    const playerCount = DATA.players.length;
    const clubCount = DATA.clubs.length;
    const countryCount = new Set(DATA.clubs.map((club) => club.country)).size;
    document.querySelectorAll('[data-player-count]').forEach((node) => { node.textContent = numberFormat.format(playerCount); });
    document.querySelectorAll('[data-club-count]').forEach((node) => { node.textContent = numberFormat.format(clubCount); });
    document.querySelectorAll('[data-country-count]').forEach((node) => { node.textContent = numberFormat.format(countryCount); });
    document.querySelectorAll('[data-season]').forEach((node) => { node.textContent = DATA.season || '2026/27'; });
    if (el.dataUpdated) el.dataUpdated.textContent = DATA.updated || 'novembre 2026';

    document.querySelectorAll('.ticker-track span').forEach((node) => {
      node.innerHTML = `${numberFormat.format(playerCount)} campioni <b>✦</b> ${numberFormat.format(clubCount)} club <b>✦</b> ${numberFormat.format(countryCount)} paesi <b>✦</b> una sola risposta giusta <b>✦</b>&nbsp;`;
    });
  }

  function init() {
    hydrateData();
    renderHero();
    populateLeagueSelect();
    renderSetup({ save: false });
    updateSoundUI();
    bindSetup();
    bindGame();
    bindGlobal();
    showScreen('setup');
    setDocumentTitle('');
  }

  init();
})();

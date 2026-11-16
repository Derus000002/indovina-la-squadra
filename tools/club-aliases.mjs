// Canonical club resolver shared by the data pipeline.
// Maps the many English/Italian spellings found on Wikipedia to the 99 clubs
// used by the game, and flags reserve teams, inactive players and external clubs.
import { CLUBS } from "./clubs.mjs";
import { CLUB_PAGES } from "./club-pages.mjs";

export const CANONICAL_CLUBS = CLUBS.map(([name]) => name);
const canonicalByKey = new Map(CANONICAL_CLUBS.map((name) => [normalizeClubKey(name), name]));
const aliasByKey = new Map();

// A few English names that do not share enough tokens with the Italian
// catalogue name to be derived automatically from CLUB_PAGES.
export const CLUB_NAMES = {
  "AC Milan": "Milan",
  "Inter Milan": "Inter",
  "Paris Saint-Germain": "PSG",
  "Paris Saint-Germain F.C.": "PSG",
  "Bayern Munich": "Bayern Monaco",
  "FC Bayern Munich": "Bayern Monaco",
  "Al Hilal": "Al Hilal",
  "Al-Hilal": "Al Hilal",
  "Al Hilal SFC": "Al Hilal",
  "Al-Ahli": "Al Ahli",
  "Al Ahli Saudi FC": "Al Ahli",
  "Al-Ahli Saudi FC": "Al Ahli",
  "Al-Nassr": "Al Nassr",
  "Al Nassr FC": "Al Nassr",
  "Al-Qadsiah": "Al Qadsiah",
  "Al-Qadsiah FC": "Al Qadsiah",
  "Al-Shabab": "Al Shabab",
  "Al Shabab Club": "Al Shabab",
  "Al-Diriyah": "Al Diriyah",
  "Diriyah Club": "Al Diriyah",
  "Al-Shamal": "Al Shamal",
  "Deportivo A Coruña": "Deportivo La Coruña",
  "Deportivo de A Coruña": "Deportivo La Coruña",
  "Deportivo de La Coruña": "Deportivo La Coruña",
  "Red Star Belgrade": "Stella Rossa",
  "Tottenham Hotspur": "Tottenham",
  "Brighton & Hove Albion": "Brighton",
  "Wolverhampton Wanderers": "Wolverhampton",
  "West Ham United": "West Ham",
  "Leeds United": "Leeds",
  "Los Angeles FC": "LAFC",
  "SC Freiburg": "Friburgo",
  "VfB Stuttgart": "Stuttgart",
  "VfL Wolfsburg": "Wolfsburg",
  "Bayer Leverkusen": "Leverkusen",
  "Bayer 04 Leverkusen": "Leverkusen",
  "RB Leipzig": "Lipsia",
  "Eintracht Frankfurt": "Eintracht Francoforte",
  "Club Brugge": "Club Bruges",
  "Club Brugge KV": "Club Bruges",
  NEC: "NEC Nijmegen",
  "NEC Nijmegen": "NEC Nijmegen",
  "Schalke 04": "Schalke 04",
  "FC Schalke 04": "Schalke 04",
  "Mainz 05": "Mainz 05",
  "1. FSV Mainz 05": "Mainz 05",
  "S.L. Benfica": "Benfica",
  "SL Benfica": "Benfica",
  "Sport Lisboa e Benfica": "Benfica",
  "Sporting CP": "Sporting CP",
  "Sporting Lisbon": "Sporting CP",
  "Sporting Clube de Portugal": "Sporting CP",
  "K.A.A. Gent": "Gent",
  "KAA Gent": "Gent",
  "AA Gent": "Gent",
  "Galatasaray S.K.": "Galatasaray",
  "Galatasaray S.K. (football)": "Galatasaray",
  "Fenerbahçe S.K.": "Fenerbahçe",
  "Fenerbahçe S.K. (football)": "Fenerbahçe",
  "Beşiktaş J.K.": "Beşiktaş",
  "SC Corinthians Paulista": "Corinthians",
  Corinthians: "Corinthians",
  "SE Palmeiras": "Palmeiras",
  "CR Flamengo": "Flamengo",
  "Clube de Regatas do Flamengo": "Flamengo",
  "Club Atlético River Plate": "River Plate",
  "Club Atlético Boca Juniors": "Boca Juniors",
  "Racing Club de Avellaneda": "Racing Club",
  "Club Atlético Rosario Central": "Rosario Central",
  "FK Crvena zvezda": "Stella Rossa",
  "Crvena Zvezda": "Stella Rossa",
  "FK Partizan": "Partizan",
  "Partizan Belgrade": "Partizan",
  "FK Vojvodina": "Vojvodina",
  "Vojvodina Novi Sad": "Vojvodina",
  "FK Čukarički": "Čukarički",
  "FK Cukaricki": "Čukarički",
  "AFC Ajax": "Ajax",
  "Ajax Amsterdam": "Ajax",
  "PSV Eindhoven": "PSV",
  "Feyenoord Rotterdam": "Feyenoord"
};

const LEGAL_TOKENS = new Set([
  "fc", "afc", "cf", "sc", "ac", "as", "ss", "ssc", "rc", "sk", "jk", "kv",
  "sv", "vfb", "vfl", "fsv", "bsc", "tsg", "kaa", "krc", "rsc", "cr", "se",
  "club", "calcio", "spa", "sad", "sa", "sl", "sport"
]);
const CONNECTOR_TOKENS = new Set(["de", "del", "della", "dei", "do", "da", "dos", "das", "du", "des", "la", "le", "lo", "of", "the"]);

function addAlias(alias, canonical) {
  const key = normalizeClubKey(alias);
  if (!key || aliasByKey.has(key)) return;
  if (canonicalByKey.get(key) === canonical) return;
  aliasByKey.set(key, canonical);
}

function keyVariants(value) {
  const base = normalizeClubKey(value);
  if (!base) return [];
  const variants = new Set([base]);
  const tokens = base.split(" ").filter(Boolean);

  const withoutLegal = tokens.filter((token) => !LEGAL_TOKENS.has(token) && !/^\d+$/.test(token) && !/^[a-z]$/.test(token));
  if (withoutLegal.length) variants.add(withoutLegal.join(" "));

  const withoutConnectors = withoutLegal.filter((token) => !CONNECTOR_TOKENS.has(token));
  if (withoutConnectors.length) variants.add(withoutConnectors.join(" "));

  // "1. FSV Mainz 05" -> "mainz", "Bayer 04 Leverkusen" -> "bayer leverkusen".
  const onlyWords = tokens.filter((token) => !LEGAL_TOKENS.has(token) && !/^\d+$/.test(token) && !/^[a-z]$/.test(token));
  if (onlyWords.length) variants.add(onlyWords.join(" "));

  return [...variants].filter((variant) => variant.length >= 3);
}

function addValueVariants(value, canonical) {
  for (const variant of keyVariants(value)) addAlias(variant, canonical);
}

CANONICAL_CLUBS.forEach((canonical) => addAlias(canonical, canonical));

Object.entries(CLUB_PAGES).forEach(([canonical, title]) => {
  if (!canonicalByKey.has(normalizeClubKey(canonical))) return;
  addValueVariants(title, canonical);
  addValueVariants(title.replace(/\s*\([^)]*\)\s*$/, ""), canonical);
});

Object.entries(CLUB_NAMES).forEach(([alias, canonical]) => {
  if (!canonicalByKey.has(normalizeClubKey(canonical))) return;
  addValueVariants(alias, canonical);
});

// Common English/Italian names and a couple of well-known short forms.
const EXTRA_ALIASES = {
  Milan: ["Milan", "AC Milan", "A.C. Milan", "Milan FC", "Associazione Calcio Milan"],
  Inter: ["Inter", "Inter Milan", "Internazionale", "FC Internazionale", "FC Internazionale Milano", "Inter FC"],
  Juventus: ["Juventus", "Juventus FC", "Juventus F.C.", "Juventus Turin", "Juve"],
  Napoli: ["Napoli", "SSC Napoli", "S.S.C. Napoli", "Napoli FC"],
  Roma: ["Roma", "AS Roma", "A.S. Roma", "Roma FC"],
  Lazio: ["Lazio", "SS Lazio", "S.S. Lazio", "Lazio FC"],
  Atalanta: ["Atalanta", "Atalanta BC", "Atalanta Bergamasca Calcio"],
  Bologna: ["Bologna", "Bologna FC 1909", "Bologna FC"],
  Fiorentina: ["Fiorentina", "ACF Fiorentina", "Fiorentina FC"],
  Como: ["Como", "Como 1907", "Como Calcio"],
  Parma: ["Parma", "Parma Calcio 1913", "Parma FC"],
  Udinese: ["Udinese", "Udinese Calcio", "Udinese FC"],
  "Bayern Monaco": ["Bayern Monaco", "Bayern Munich", "FC Bayern Munich", "FC Bayern München", "Bayern München"],
  Leverkusen: ["Leverkusen", "Bayer 04 Leverkusen", "Bayer Leverkusen", "Bayer 04"],
  "Borussia Dortmund": ["Borussia Dortmund", "BVB", "Dortmund"],
  "Eintracht Francoforte": ["Eintracht Francoforte", "Eintracht Frankfurt", "Frankfurt"],
  Lipsia: ["Lipsia", "RB Leipzig", "Leipzig", "RasenBallsport Leipzig"],
  Stuttgart: ["Stuttgart", "VfB Stuttgart"],
  Wolfsburg: ["Wolfsburg", "VfL Wolfsburg"],
  Friburgo: ["Friburgo", "SC Freiburg", "Freiburg"],
  "Mainz 05": ["Mainz 05", "1. FSV Mainz 05", "Mainz"],
  "Schalke 04": ["Schalke 04", "FC Schalke 04", "Schalke"],
  PSG: ["PSG", "Paris Saint-Germain", "Paris Saint-Germain F.C.", "Paris SG"],
  Marseille: ["Marseille", "Olympique de Marseille", "Olympique Marseille", "OM"],
  Monaco: ["Monaco", "AS Monaco", "AS Monaco FC", "Monaco FC"],
  Lyon: ["Lyon", "Olympique Lyonnais", "Olympique Lyonnais F.C.", "OL"],
  Lens: ["Lens", "RC Lens", "Racing Club de Lens"],
  "Deportivo La Coruña": ["Deportivo La Coruña", "Deportivo A Coruña", "Deportivo de A Coruña", "Deportivo de La Coruña", "Deportivo La Coruna", "Deportivo"],
  Benfica: ["Benfica", "S.L. Benfica", "SL Benfica", "Sport Lisboa e Benfica"],
  Porto: ["Porto", "FC Porto", "F.C. Porto"],
  "Sporting CP": ["Sporting CP", "Sporting Lisbon", "Sporting Clube de Portugal"],
  Braga: ["Braga", "S.C. Braga", "SC Braga", "Sporting Clube de Braga"],
  Ajax: ["Ajax", "AFC Ajax", "Ajax Amsterdam"],
  PSV: ["PSV", "PSV Eindhoven"],
  Feyenoord: ["Feyenoord", "Feyenoord Rotterdam"],
  "NEC Nijmegen": ["NEC Nijmegen", "NEC", "N.E.C."],
  "Club Bruges": ["Club Bruges", "Club Brugge", "Club Brugge KV", "Brugge"],
  Anderlecht: ["Anderlecht", "RSC Anderlecht", "Royal Sporting Club Anderlecht"],
  Genk: ["Genk", "KRC Genk", "RC Genk"],
  Gent: ["Gent", "K.A.A. Gent", "KAA Gent", "AA Gent"],
  Galatasaray: ["Galatasaray", "Galatasaray S.K.", "Galatasaray SK"],
  Fenerbahçe: ["Fenerbahçe", "Fenerbahçe S.K.", "Fenerbahce", "Fenerbahçe JK"],
  Beşiktaş: ["Beşiktaş", "Beşiktaş J.K.", "Besiktas", "Beşiktaş JK"],
  Trabzonspor: ["Trabzonspor"],
  "Al Hilal": ["Al Hilal", "Al Hilal SFC", "Al-Hilal", "Al Hilal Saudi FC", "Al-Hilal Saudi FC"],
  "Al Nassr": ["Al Nassr", "Al-Nassr FC", "Al Nassr FC", "Al-Nassr"],
  "Al Ahli": ["Al Ahli", "Al-Ahli Saudi FC", "Al Ahli Saudi FC", "Al-Ahli"],
  "Al Qadsiah": ["Al Qadsiah", "Al-Qadsiah FC", "Al Qadsiah FC", "Al-Qadsiah"],
  "Al Shabab": ["Al Shabab", "Al Shabab Club", "Al-Shabab FC", "Al Shabab FC", "Al-Shabab"],
  "Al Diriyah": ["Al Diriyah", "Diriyah Club", "Al-Diriyah", "Diriyah"],
  "Al Kharaitiyat": ["Al Kharaitiyat", "Al-Kharaitiyat SC", "Al Kharaitiyat SC", "Al-Kharaitiyat"],
  "Al Sadd": ["Al Sadd", "Al Sadd SC", "Al-Sadd"],
  "Al Shamal": ["Al Shamal", "Al-Shamal SC", "Al Shamal SC", "Al-Shamal"],
  "Al Duhail": ["Al Duhail", "Al-Duhail SC", "Al Duhail SC", "Al-Duhail"],
  "Al Wasl": ["Al Wasl", "Al Wasl F.C.", "Al Wasl FC", "Al-Wasl"],
  "Al Ain": ["Al Ain", "Al Ain FC", "Al-Ain"],
  "Shabab Al Ahli": ["Shabab Al Ahli", "Shabab Al Ahli Club", "Shabab Al-Ahli"],
  "Al Jazira": ["Al Jazira", "Al Jazira Club", "Al-Jazira"],
  "Inter Miami": ["Inter Miami", "Inter Miami CF"],
  "Chicago Fire": ["Chicago Fire", "Chicago Fire FC"],
  LAFC: ["LAFC", "Los Angeles FC"],
  "Orlando City": ["Orlando City", "Orlando City SC"],
  Flamengo: ["Flamengo", "CR Flamengo", "Clube de Regatas do Flamengo"],
  Palmeiras: ["Palmeiras", "SE Palmeiras", "Sociedade Esportiva Palmeiras"],
  Corinthians: ["Corinthians", "SC Corinthians Paulista", "Corinthians Paulista"],
  Santos: ["Santos", "Santos FC"],
  "River Plate": ["River Plate", "Club Atlético River Plate"],
  "Boca Juniors": ["Boca Juniors", "Club Atlético Boca Juniors"],
  "Racing Club": ["Racing Club", "Racing Club de Avellaneda"],
  "Rosario Central": ["Rosario Central", "Club Atlético Rosario Central"],
  "Stella Rossa": ["Stella Rossa", "Red Star Belgrade", "Crvena Zvezda", "FK Crvena zvezda"],
  Partizan: ["Partizan", "FK Partizan", "Partizan Belgrade"],
  Vojvodina: ["Vojvodina", "FK Vojvodina", "Vojvodina Novi Sad"],
  Čukarički: ["Čukarički", "FK Čukarički", "Cukaricki", "FK Cukaricki"]
};

Object.entries(EXTRA_ALIASES).forEach(([canonical, aliases]) => {
  if (!canonicalByKey.has(normalizeClubKey(canonical))) return;
  aliases.forEach((alias) => addValueVariants(alias, canonical));
});

export function normalizeClubKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function stripWikiMarkup(value) {
  let text = String(value || "");
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ");
  text = text.replace(/<ref[^>]*\/>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  // Prefer the link target for clubs: [[AC Milan|Milan]] -> AC Milan.
  text = text.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_match, target, label) =>
    /^(?:file|image|category):/i.test(target) ? " " : target
  );
  text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  text = text.replace(/'''?/g, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, " and ");
  return text.replace(/\s+/g, " ").trim();
}

export function firstWikiTarget(value) {
  const text = String(value || "");
  const regex = /\[\[\s*([^\]|#]+?)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let match;
  while ((match = regex.exec(text))) {
    const target = match[1].trim();
    if (target && !/^(?:file|image|category):/i.test(target)) return target;
  }
  return "";
}

const RESERVE_PATTERN = /(?:\bII\b|(?:^|[\s(])B(?:[\s)]|$)|next\s*gen|nextgen|futuro|castilla|atl[eè]tic(?!o)|jong|ili?citano|campus|primavera|\[\[[^\]]*\bII\b|\bu-?\d{2}\b|\bunder-?\d{2}\b|\b(?:youth|reserves?|academy|juvenil|fabril|nxt)\b|\b[bc]\s+team\b)/i;
const INACTIVE_PATTERN = /\b(free agent|without (?:a )?club|no club|unattached|clubless|retired|retirement|released|deceased|svincolato|ritirato)\b|^(?:head coach|coach|manager|assistant coach|assistant manager|caretaker manager)\b/i;

function rawPrimaryClubText(raw) {
  return stripWikiMarkup(raw)
    .replace(/<br\s*\/?>/gi, " / ")
    .split(/\s*[/(]\s*(?:on loan|loan|prestito|in prestito|from|dal|dalla)\b/i)[0]
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim();
}

function primaryClubText(raw, target) {
  return target || rawPrimaryClubText(raw);
}

export function resolveCanonicalClub(rawText, linkTarget = "") {
  const raw = String(rawText || "").trim();
  const target = String(linkTarget || "").trim() || firstWikiTarget(raw);
  const rawPrimary = rawPrimaryClubText(raw);
  const primary = primaryClubText(raw, target);
  if (!raw && !target) return { name: null, raw, target, status: "unknown", matchedBy: null };

  if (RESERVE_PATTERN.test(target) || RESERVE_PATTERN.test(rawPrimary) || RESERVE_PATTERN.test(primary)) {
    return { name: null, raw, target, status: "reserve", matchedBy: null, cleaned: primary || raw };
  }
  if (INACTIVE_PATTERN.test(primary) || (!target && INACTIVE_PATTERN.test(stripWikiMarkup(raw)))) {
    return { name: null, raw, target, status: "non-active", matchedBy: null, cleaned: primary || raw };
  }

  const candidates = [];
  if (target) candidates.push(target);
  if (primary) candidates.push(primary);
  const stripped = stripWikiMarkup(raw);
  if (stripped) candidates.push(stripped);
  const withoutNote = stripped.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (withoutNote) candidates.push(withoutNote);

  for (const candidate of candidates) {
    for (const key of keyVariants(candidate)) {
      if (canonicalByKey.has(key)) {
        return { name: canonicalByKey.get(key), raw, target, status: "canonical", matchedBy: candidate };
      }
      if (aliasByKey.has(key)) {
        return { name: aliasByKey.get(key), raw, target, status: "canonical", matchedBy: candidate };
      }
    }
  }

  // A readable cleaned name is still useful for diagnostics, but the club is
  // outside the 99-club catalogue and must not enter the game data.
  return {
    name: null,
    raw,
    target,
    cleaned: primary || stripped || raw,
    status: "external",
    matchedBy: null
  };
}

// Backwards-compatible name used by the first version of the fetchers.
export function resolveClub(value, linkTarget = "") {
  return resolveCanonicalClub(value, linkTarget);
}

export function isCanonicalClub(name) {
  return canonicalByKey.has(normalizeClubKey(name));
}

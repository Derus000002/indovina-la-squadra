// Builds game-data.js from tools/raw-players.json and tools/clubs.mjs.
// Usage: node tools/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { CLUBS } from "./clubs.mjs";
import { resolveCountry } from "./countries.mjs";
import { resolveCanonicalClub } from "./club-aliases.mjs";

const root = path.join(import.meta.dirname, "..");
const raw = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "raw-players.json"), "utf8"));
const squadFile = path.join(import.meta.dirname, "raw-squad-players.json");
const squads = fs.existsSync(squadFile)
  ? JSON.parse(fs.readFileSync(squadFile, "utf8"))
  : { players: [], fetchedAt: raw.fetchedAt };

let logoData = { logos: {} };
try {
  logoData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "logos.json"), "utf8"));
} catch (error) {
  console.warn("tools/logos.json non trovato: uso gli stemmi stilizzati.");
}

const NAME_OVERRIDES = {
  "Joan Garcia": "Joan García",
  "Julián Alvarez": "Julián Álvarez",
  "Lucas Hernandez": "Lucas Hernández",
};

const AGE_OVERRIDES = {
  "Edoardo Bove": 24,
  "Rodrigo Gomes": 23,
};

const SPLIT_OVERRIDES = {
  "Kevin De Bruyne": ["Kevin", "De Bruyne"],
  "Virgil van Dijk": ["Virgil", "van Dijk"],
  "Trent Alexander-Arnold": ["Trent", "Alexander-Arnold"],
  "Alexis Mac Allister": ["Alexis", "Mac Allister"],
  "Rodrigo De Paul": ["Rodrigo", "De Paul"],
  "Ángel Di María": ["Ángel", "Di María"],
  "Giovanni Di Lorenzo": ["Giovanni", "Di Lorenzo"],
  "Marten de Roon": ["Marten", "de Roon"],
  "Randal Kolo Muani": ["Randal", "Kolo Muani"],
  "Son Heung-min": ["Heung-min", "Son"],
  "Lee Kang-in": ["Kang-in", "Lee"],
  "Kim Min-jae": ["Min-jae", "Kim"],
  "Hwang Hee-chan": ["Hee-chan", "Hwang"],
  "Hwang In-beom": ["In-beom", "Hwang"],
  "Lee Jae-sung": ["Jae-sung", "Lee"],
  "Lee Han-beom": ["Han-beom", "Lee"],
  "Oh Hyeon-gyu": ["Hyeon-gyu", "Oh"],
  "Yang Min-hyeok": ["Min-hyeok", "Yang"],
  "Kim Ye-geon": ["Ye-geon", "Kim"],
  "Rayan Aït-Nouri": ["Rayan", "Aït-Nouri"],
  "Jean-Philippe Mateta": ["Jean-Philippe", "Mateta"],
  "Charles De Ketelaere": ["Charles", "De Ketelaere"],
  "Frenkie de Jong": ["Frenkie", "de Jong"],
  "Robin Le Normand": ["Robin", "Le Normand"],
  "Rúben Dias": ["Rúben", "Dias"],
  "Rúben Neves": ["Rúben", "Neves"],
};

const clubMap = new Map(CLUBS.map(([name, code, c1, c2, country, prestige]) => [name, { name, code, c1, c2, country, prestige }]));
if (clubMap.size !== CLUBS.length) throw new Error("Duplicate club name in the catalogue");

// The curated list is the editorial backbone of the game. Every curated
// player is at least Tier 2; only its original Tier 1 plus genuinely famous
// active players (long Wikipedia profiles) stay in Tier 1. New squad players
// are Tier 2 only when their profile is substantial, otherwise Tier 3.
const curatedByName = new Map();
const curatedByTitle = new Map();
raw.players.forEach((player) => {
  const nameKey = normalizeKey(cleanDisplayName(player.name));
  if (nameKey) curatedByName.set(nameKey, Number(player.tier));
  const titleKey = normalizeKey(titleFromUrl(player.page));
  if (titleKey) curatedByTitle.set(titleKey, Number(player.tier));
});

const pageLengthByName = new Map();
const pageLengthByTitle = new Map();
for (const player of squads.players || []) {
  const length = Number(player.pageLength) || 0;
  if (!length) continue;
  const nameKey = normalizeKey(cleanDisplayName(cleanSquadName(player.name)));
  const titleKey = normalizeKey(titleFromUrl(player.page));
  if (nameKey) pageLengthByName.set(nameKey, Math.max(length, pageLengthByName.get(nameKey) || 0));
  if (titleKey) pageLengthByTitle.set(titleKey, Math.max(length, pageLengthByTitle.get(titleKey) || 0));
}

function assignTier({ curatedTier, pageLength }) {
  const curated = Number(curatedTier);
  const length = Number(pageLength) || 0;
  if (curated === 1 || length >= 85000) return 1;
  if (Number.isFinite(curated) || length >= 25000) return 2;
  return 3;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanSquadName(value) {
  const text = String(value || "").trim();
  const interlanguage = text.match(/\{\{\s*ill\s*\|([^|}]+)/i);
  if (interlanguage) return interlanguage[1].trim();
  return text
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Wikipedia page titles carry disambiguators such as "(footballer, born 1991)".
// They must never surface in the quiz or inside the first/last split.
function cleanDisplayName(value) {
  return String(value || "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromUrl(url) {
  if (!url) return "";
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    return pathname.replace(/^\/wiki\//, "").replace(/_/g, " ");
  } catch (error) {
    return "";
  }
}

const EAST_ASIAN_SURNAMES = new Set([
  "lee", "kim", "park", "choi", "jung", "jeong", "kang", "cho", "yoon", "jang", "lim", "han",
  "oh", "seo", "shin", "kwon", "hwang", "ahn", "song", "hong", "yoo", "moon", "bae", "baek",
  "nam", "ryu", "ko", "ha", "heo", "son", "jeon", "jo", "noh", "yang", "koo", "kwak", "min",
  "sung", "won", "chun", "chung", "jin", "ma", "paik", "pang", "pyun", "suh", "yeo", "yun"
]);
const NAME_PARTICLES = new Set([
  "van", "von", "de", "der", "den", "di", "da", "del", "della", "dei", "dos", "das", "do",
  "du", "des", "le", "la", "ben", "bin", "al", "el", "ter", "ten", "op", "af", "av",
  "abu", "st", "st."
]);

function splitName(name) {
  if (SPLIT_OVERRIDES[name]) return SPLIT_OVERRIDES[name];
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return ["", name];

  // East Asian order: surname first, given name last (Lee Kang-in, Kim Min Jae).
  if (parts.length >= 2 && parts.length <= 3 && EAST_ASIAN_SURNAMES.has(parts[0].toLowerCase())) {
    return [parts.slice(1).join(" "), parts[0]];
  }

  // Particle-aware surnames: Virgil van Dijk, Frenkie de Jong, Di Lorenzo.
  // Only the final surname may consume particles. Otherwise a given name such
  // as Van (Van Williams, Vanja) would absorb the surname it precedes.
  let surnameStart = parts.length - 1;
  while (surnameStart > 1 && NAME_PARTICLES.has(parts[surnameStart - 1].toLowerCase())) {
    surnameStart -= 1;
  }
  if (surnameStart < parts.length - 1) {
    // Keep an initial surname segment (Kolo Muani, Mac Allister), but never
    // move the surname itself into the given-name side.
    const surname = parts.slice(surnameStart).join(" ");
    const given = parts.slice(0, surnameStart);
    if (given.length >= 1) return [given.join(" "), surname];
    return ["", surname];
  }

  // Generational suffixes stay with the surname.
  if (/^(jr|sr|ii|iii|iv)\.?$/i.test(parts[parts.length - 1]) && parts.length > 2) {
    return [parts.slice(0, -2).join(" "), parts.slice(-2).join(" ")];
  }

  const last = parts.pop();
  return [parts.join(" "), last];
}

function createPlayer({ name, club, pos, nat, flag, age, num, tier, src }) {
  if (!clubMap.has(club)) throw new Error(`Missing club metadata for "${club}" (${name})`);
  const displayName = cleanDisplayName(NAME_OVERRIDES[name] || name);
  const split = splitName(displayName);
  const numericAge = age == null ? NaN : Number(age);
  const numericNumber = num == null ? NaN : Number(num);
  return {
    name: displayName,
    first: split[0],
    last: split[1],
    club,
    pos: pos || "Calciatore",
    nat: nat || "Sconosciuta",
    flag: flag || "🏳️",
    age: Number.isFinite(numericAge) ? numericAge : (AGE_OVERRIDES[displayName] ?? null),
    num: Number.isFinite(numericNumber) ? numericNumber : null,
    t: [1, 2, 3].includes(Number(tier)) ? Number(tier) : 3,
    src: src || null,
  };
}

function resolvePlayerCountry(player) {
  return resolveCountry(player.nationalTeamCountry || "", "")
    || resolveCountry("", player.squadNat || "")
    || resolveCountry(player.birthPlaceCountry || "", "")
    || resolveCountry(player.country || "", "");
}

const players = [];
const usedNames = new Set();
const usedTitles = new Set();
let skippedWithoutCountry = 0;
let skippedWithoutClub = 0;

for (const player of raw.players) {
  const name = cleanDisplayName(NAME_OVERRIDES[player.name] || player.name);
  const resolved = resolveCanonicalClub(player.currentClubRaw || player.club, player.currentClubTarget || "");
  if (resolved.status !== "canonical" || !clubMap.has(resolved.name)) {
    console.warn(`Salto ${name}: club attuale non valido (${player.currentClubRaw || player.club})`);
    skippedWithoutClub += 1;
    continue;
  }
  const club = resolved.name;
  const country = resolvePlayerCountry(player);
  if (!country) {
    console.warn(`Salto ${name}: nazionalità non risolta (${player.country || "?"})`);
    skippedWithoutCountry += 1;
    continue;
  }
  const title = titleFromUrl(player.page);
  const titleKey = title ? normalizeKey(title) : "";
  const pageLength = pageLengthByTitle.get(titleKey) || pageLengthByName.get(normalizeKey(name)) || 0;
  usedNames.add(normalizeKey(name));
  if (titleKey) usedTitles.add(titleKey);
  players.push(createPlayer({
    name,
    club,
    pos: player.pos,
    nat: country.label,
    flag: country.flag,
    age: player.age,
    num: player.number,
    tier: assignTier({ curatedTier: player.tier, pageLength }),
    src: player.page,
  }));
}

let addedFromSquads = 0;

for (const player of squads.players || []) {
  const cleanName = cleanSquadName(player.name);
  const name = cleanDisplayName(NAME_OVERRIDES[cleanName] || cleanName);
  if (!name) continue;
  const resolved = resolveCanonicalClub(player.currentClubRaw || player.club, player.currentClubTarget || "");
  if (resolved.status !== "canonical" || !clubMap.has(resolved.name)) {
    skippedWithoutClub += 1;
    continue;
  }
  const club = resolved.name;

  const country = resolvePlayerCountry(player);
  if (!country) {
    skippedWithoutCountry += 1;
    continue;
  }

  const title = titleFromUrl(player.page);
  const nameKey = normalizeKey(name);
  const titleKey = title ? normalizeKey(title) : "";
  if (usedNames.has(nameKey) || (titleKey && usedTitles.has(titleKey))) continue;

  const curatedTier = curatedByName.get(nameKey)
    ?? curatedByTitle.get(titleKey)
    ?? (player.existing ? Number(player.tier) : Number.NaN);

  usedNames.add(nameKey);
  if (titleKey) usedTitles.add(titleKey);
  players.push(createPlayer({
    name,
    club,
    pos: player.pos,
    nat: country.label,
    flag: country.flag,
    age: player.age,
    num: player.number,
    tier: assignTier({ curatedTier, pageLength: player.pageLength }),
    src: player.page,
  }));
  addedFromSquads += 1;
}

players.sort((a, b) => a.name.localeCompare(b.name, "it"));
players.forEach((p, i) => (p.fig = i + 1));

const fetched = new Date(squads.fetchedAt || raw.fetchedAt);
const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const updated = `${monthNames[fetched.getMonth()]} ${fetched.getFullYear()}`;
const season = fetched.getMonth() >= 6 ? `${fetched.getFullYear()}/${String(fetched.getFullYear() + 1).slice(-2)}` : `${fetched.getFullYear() - 1}/${String(fetched.getFullYear()).slice(-2)}`;

const clubs = CLUBS.map(([name, code, c1, c2, country, prestige]) => {
  const logoEntry = logoData.logos?.[name];
  const logo = logoEntry && fs.existsSync(path.join(root, logoEntry.file)) ? logoEntry.file : null;
  return { name, code, c1, c2, country, prestige, ...(logo ? { logo } : {}) };
});

const serialize = (rows) => rows.map((row) => "    " + JSON.stringify(row)).join(",\n");
const output = `/* Generato da tools/build-data.mjs — non modificare a mano. */
window.GAME_DATA = {
  season: ${JSON.stringify(season)},
  updated: ${JSON.stringify(updated)},
  players: [
${serialize(players)}
  ],
  clubs: [
${serialize(clubs)}
  ]
};
`;

fs.writeFileSync(path.join(root, "game-data.js"), output, "utf8");

const tiers = players.reduce((acc, p) => ((acc[p.t] = (acc[p.t] || 0) + 1), acc), {});
const missingCountry = players.filter((p) => !p.nat).length;
const missingAge = players.filter((p) => !p.age).length;
console.log(`Wrote game-data.js`);
console.log(`Players: ${players.length} (tier 1: ${tiers[1] || 0}, tier 2: ${tiers[2] || 0}, tier 3: ${tiers[3] || 0})`);
console.log(`Added from current squads: ${addedFromSquads} · skipped without country: ${skippedWithoutCountry} · skipped unknown club: ${skippedWithoutClub}`);
console.log(`Clubs: ${clubs.length} (${clubs.filter((club) => club.logo).length} with real crest) · Countries: ${new Set(clubs.map((c) => c.country)).size}`);
console.log(`Season: ${season} · Updated: ${updated}`);
if (missingCountry) console.warn(`WARNING: ${missingCountry} players without nationality`);
if (missingAge) console.warn(`WARNING: ${missingAge} players without age`);
const clubCounts = players.reduce((acc, p) => ((acc[p.club] = (acc[p.club] || 0) + 1), acc), {});
const unknownPlayers = clubs.filter((c) => !clubCounts[c.name]).map((c) => c.name);
if (unknownPlayers.length) console.log(`Catalogue-only clubs (${unknownPlayers.length}): ${unknownPlayers.join(", ")}`);

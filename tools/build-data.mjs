// Builds game-data.js from tools/raw-players.json and tools/clubs.mjs.
// Usage: node tools/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { CLUBS } from "./clubs.mjs";
import { resolveCountry } from "./countries.mjs";

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

const CLUB_NAMES = {
  "AC Milan": "Milan",
  "Inter Milan": "Inter",
  "Paris Saint-Germain": "PSG",
  "Bayern Munich": "Bayern Monaco",
  "Al Hilal": "Al Hilal",
  "Al-Hilal": "Al Hilal",
  "Al-Ahli": "Al Ahli",
  "Al-Nassr": "Al Nassr",
  "Al-Qadsiah": "Al Qadsiah",
  "Al-Shabab": "Al Shabab",
  "Al-Diriyah": "Al Diriyah",
  "Al-Shamal": "Al Shamal",
  "Deportivo A Coruña": "Deportivo La Coruña",
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
  "RB Leipzig": "Lipsia",
  "Eintracht Frankfurt": "Eintracht Francoforte",
  "Club Brugge": "Club Bruges",
  NEC: "NEC Nijmegen",
  "Schalke 04": "Schalke 04",
  "Mainz 05": "Mainz 05",
};

const COUNTRY = {
  Algeria: ["Algeria", "🇩🇿"],
  Argentina: ["Argentina", "🇦🇷"],
  Armenia: ["Armenia", "🇦🇲"],
  Austria: ["Austria", "🇦🇹"],
  Belgium: ["Belgio", "🇧🇪"],
  "Bosnia and Herzegovina": ["Bosnia ed Erzegovina", "🇧🇦"],
  Brazil: ["Brasile", "🇧🇷"],
  Cameroon: ["Camerun", "🇨🇲"],
  Canada: ["Canada", "🇨🇦"],
  Colombia: ["Colombia", "🇨🇴"],
  Croatia: ["Croazia", "🇭🇷"],
  "Czech Republic": ["Rep. Ceca", "🇨🇿"],
  Denmark: ["Danimarca", "🇩🇰"],
  Ecuador: ["Ecuador", "🇪🇨"],
  Egypt: ["Egitto", "🇪🇬"],
  England: ["Inghilterra", "🇬🇧"],
  France: ["Francia", "🇫🇷"],
  Gambia: ["Gambia", "🇬🇲"],
  Georgia: ["Georgia", "🇬🇪"],
  Germany: ["Germania", "🇩🇪"],
  Ghana: ["Ghana", "🇬🇭"],
  Greece: ["Grecia", "🇬🇷"],
  Guinea: ["Guinea", "🇬🇳"],
  Hungary: ["Ungheria", "🇭🇺"],
  Iran: ["Iran", "🇮🇷"],
  Italy: ["Italia", "🇮🇹"],
  "Ivory Coast": ["Costa d'Avorio", "🇨🇮"],
  Japan: ["Giappone", "🇯🇵"],
  Kosovo: ["Kosovo", "🇽🇰"],
  Mexico: ["Messico", "🇲🇽"],
  Morocco: ["Marocco", "🇲🇦"],
  Netherlands: ["Paesi Bassi", "🇳🇱"],
  Nigeria: ["Nigeria", "🇳🇬"],
  Norway: ["Norvegia", "🇳🇴"],
  Poland: ["Polonia", "🇵🇱"],
  Portugal: ["Portogallo", "🇵🇹"],
  "Republic of Ireland": ["Irlanda", "🇮🇪"],
  Russia: ["Russia", "🇷🇺"],
  Scotland: ["Scozia", "🇬🇧"],
  Senegal: ["Senegal", "🇸🇳"],
  Serbia: ["Serbia", "🇷🇸"],
  Slovakia: ["Slovacchia", "🇸🇰"],
  Slovenia: ["Slovenia", "🇸🇮"],
  "South Korea": ["Corea del Sud", "🇰🇷"],
  Spain: ["Spagna", "🇪🇸"],
  Sweden: ["Svezia", "🇸🇪"],
  Switzerland: ["Svizzera", "🇨🇭"],
  Turkey: ["Turchia", "🇹🇷"],
  Ukraine: ["Ucraina", "🇺🇦"],
  "United States": ["Stati Uniti", "🇺🇸"],
  Uruguay: ["Uruguay", "🇺🇾"],
  Wales: ["Galles", "🇬🇧"],
};

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

function titleFromUrl(url) {
  if (!url) return "";
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    return pathname.replace(/^\/wiki\//, "").replace(/_/g, " ");
  } catch (error) {
    return "";
  }
}

function splitName(name) {
  if (SPLIT_OVERRIDES[name]) return SPLIT_OVERRIDES[name];
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return ["", name];
  const last = parts.pop();
  return [parts.join(" "), last];
}

function createPlayer({ name, club, pos, nat, flag, age, num, tier, src }) {
  if (!clubMap.has(club)) throw new Error(`Missing club metadata for "${club}" (${name})`);
  const displayName = NAME_OVERRIDES[name] || name;
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

const players = [];
const usedNames = new Set();
const usedTitles = new Set();

for (const player of raw.players) {
  const name = NAME_OVERRIDES[player.name] || player.name;
  const club = CLUB_NAMES[player.club] || player.club;
  const country = COUNTRY[player.country];
  if (!country) throw new Error(`Missing country metadata for "${player.country}" (${player.name})`);
  const title = titleFromUrl(player.page);
  usedNames.add(normalizeKey(name));
  if (title) usedTitles.add(normalizeKey(title));
  players.push(createPlayer({
    name,
    club,
    pos: player.pos,
    nat: country[0],
    flag: country[1],
    age: player.age,
    num: player.number,
    tier: player.tier,
    src: player.page,
  }));
}

let addedFromSquads = 0;
let skippedWithoutCountry = 0;
let skippedWithoutClub = 0;

for (const player of squads.players || []) {
  const cleanName = cleanSquadName(player.name);
  const name = NAME_OVERRIDES[cleanName] || cleanName;
  if (!name) continue;
  const club = CLUB_NAMES[player.club] || player.club;
  if (!clubMap.has(club)) {
    skippedWithoutClub += 1;
    continue;
  }
  const title = titleFromUrl(player.page);
  const nameKey = normalizeKey(name);
  const titleKey = title ? normalizeKey(title) : "";
  if (usedNames.has(nameKey) || (titleKey && usedTitles.has(titleKey))) continue;

  const country = resolveCountry(player.country, player.squadNat)
    || resolveCountry(player.country, "")
    || resolveCountry("", player.squadNat);
  if (!country) {
    skippedWithoutCountry += 1;
    continue;
  }

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
    // The curated list defines the top tier; new squad players are capped at
    // tier 2 so "facile" doesn't surface long-tail youth players as stars.
    tier: player.existing ? player.tier : (Number(player.tier) === 1 ? 2 : player.tier),
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

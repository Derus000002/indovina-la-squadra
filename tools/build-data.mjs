// Builds game-data.js from tools/raw-players.json and tools/clubs.mjs.
// Usage: node tools/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { CLUBS } from "./clubs.mjs";

const root = path.join(import.meta.dirname, "..");
const raw = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "raw-players.json"), "utf8"));

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

const players = raw.players.map((p) => {
  const name = NAME_OVERRIDES[p.name] || p.name;
  const club = CLUB_NAMES[p.club] || p.club;
  if (!clubMap.has(club)) throw new Error(`Missing club metadata for "${club}" (${p.name})`);
  const country = COUNTRY[p.country];
  if (!country) throw new Error(`Missing country metadata for "${p.country}" (${p.name})`);
  const split = SPLIT_OVERRIDES[name] || (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return ["", name];
    const last = parts.pop();
    return [parts.join(" "), last];
  })();
  return {
    name,
    first: split[0],
    last: split[1],
    club,
    pos: p.pos,
    nat: country[0],
    flag: country[1],
    age: p.age ?? AGE_OVERRIDES[name] ?? null,
    num: p.number ? Number(p.number) : null,
    t: p.tier,
    src: p.page,
  };
});

players.sort((a, b) => a.name.localeCompare(b.name, "it"));
players.forEach((p, i) => (p.fig = i + 1));

const fetched = new Date(raw.fetchedAt);
const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const updated = `${monthNames[fetched.getMonth()]} ${fetched.getFullYear()}`;
const season = fetched.getMonth() >= 6 ? `${fetched.getFullYear()}/${String(fetched.getFullYear() + 1).slice(-2)}` : `${fetched.getFullYear() - 1}/${String(fetched.getFullYear()).slice(-2)}`;

const clubs = CLUBS.map(([name, code, c1, c2, country, prestige]) => ({ name, code, c1, c2, country, prestige }));

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
console.log(`Clubs: ${clubs.length} · Countries: ${new Set(clubs.map((c) => c.country)).size}`);
console.log(`Season: ${season} · Updated: ${updated}`);
if (missingCountry) console.warn(`WARNING: ${missingCountry} players without nationality`);
if (missingAge) console.warn(`WARNING: ${missingAge} players without age`);
const clubCounts = players.reduce((acc, p) => ((acc[p.club] = (acc[p.club] || 0) + 1), acc), {});
const unknownPlayers = clubs.filter((c) => !clubCounts[c.name]).map((c) => c.name);
if (unknownPlayers.length) console.log(`Catalogue-only clubs (${unknownPlayers.length}): ${unknownPlayers.join(", ")}`);

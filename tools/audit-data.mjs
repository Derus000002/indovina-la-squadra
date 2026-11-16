// Quick sanity audit for the generated game-data.js.
// Usage: node tools/audit-data.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { resolveCanonicalClub } from "./club-aliases.mjs";

const root = path.join(import.meta.dirname, "..");
const code = fs.readFileSync(path.join(root, "game-data.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(code, sandbox, { filename: "game-data.js" });
const data = sandbox.window.GAME_DATA;

if (!data || !Array.isArray(data.players) || !Array.isArray(data.clubs)) {
  console.error("game-data.js non contiene un tabellone valido.");
  process.exit(1);
}

const players = data.players;
const clubs = data.clubs;
const clubByName = new Map(clubs.map((club) => [club.name, club]));
const playersByClub = new Map();
const playersByCountry = new Map();
const tierCounts = new Map();
const nameCounts = new Map();
const countryCounts = new Map();
const sourceCounts = new Map();
const sourceNames = new Map();
const positions = new Map();
const RESERVE_PATTERN = /\bII\b|\bnext\s*gen\b|\bfuturo\b|\bcastilla\b|\batl[eè]tic(?!o)\b|\bjong\b|\bcampus\b|\bprimavera\b|\bu-?\d{2}\b|\bunder-?\d{2}\b|\byouth\b|\breserves?\b|\bacademy\b|\b[bc]\s+team\b|ilic[ií]tano/i;
const RESERVE_NAME_PATTERN = /\bII\b|\bnext\s*gen\b|\bfuturo\b|\bcastilla\b|\bcampus\b|\bprimavera\b|\bu-?\d{2}\b|\bunder-?\d{2}\b|\byouth\b|\breserves?\b|\bacademy\b|\b[bc]\s+team\b|ilic[ií]tano/i;
const ages = [];
const numbers = [];
const duplicates = [];
const issues = [];
let missingSource = 0;

for (const club of clubs) {
  if (!club.logo) issues.push(`Logo mancante nei dati: ${club.name}`);
  else if (!fs.existsSync(path.join(root, club.logo))) issues.push(`File logo assente: ${club.name} -> ${club.logo}`);
  if (!club.country) issues.push(`Paese mancante: ${club.name}`);
}

for (const [index, player] of players.entries()) {
  if (!player.name) issues.push(`Giocatore senza nome all'indice ${index}`);
  if (!clubByName.has(player.club)) issues.push(`Club sconosciuto: ${player.name} -> ${player.club}`);
  if (!player.nat) issues.push(`Nazionalità mancante: ${player.name}`);
  if (!player.pos) issues.push(`Ruolo mancante: ${player.name}`);
  if (player.age != null && (!Number.isFinite(player.age) || player.age < 14 || player.age > 55)) {
    issues.push(`Età anomala: ${player.name} -> ${player.age}`);
  }
  if (player.num != null && (!Number.isFinite(player.num) || player.num < 1 || player.num > 99)) {
    issues.push(`Numero anomalo: ${player.name} -> ${player.num}`);
  }
  if (player.fig !== index + 1) issues.push(`FIG non sequenziale: ${player.name} -> ${player.fig}`);
  if (!player.src) missingSource += 1;
  else if (!/^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/.test(player.src)) {
    issues.push(`Fonte non valida: ${player.name} -> ${player.src}`);
  } else {
    sourceCounts.set(player.src, (sourceCounts.get(player.src) || 0) + 1);
    const names = sourceNames.get(player.src) || [];
    names.push(player.name);
    sourceNames.set(player.src, names);
  }
  const resolved = resolveCanonicalClub(player.club);
  if (resolved.status !== "canonical") {
    issues.push(`Club non canonico: ${player.name} -> ${player.club} (${resolved.status})`);
  }
  if (RESERVE_NAME_PATTERN.test(player.name)) {
    issues.push(`Indicatore riserve/giovanili nel nome: ${player.name}`);
  }
  if (!clubByName.has(player.club) && RESERVE_PATTERN.test(player.club)) {
    issues.push(`Indicatore riserve/giovanili nel club: ${player.name} -> ${player.club}`);
  }

  playersByClub.set(player.club, (playersByClub.get(player.club) || 0) + 1);
  playersByCountry.set(player.nat, (playersByCountry.get(player.nat) || 0) + 1);
  tierCounts.set(player.t, (tierCounts.get(player.t) || 0) + 1);
  const key = player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  if (player.age != null) ages.push(player.age);
  if (player.num != null) numbers.push(player.num);
  const posKey = player.pos || "?";
  positions.set(posKey, (positions.get(posKey) || 0) + 1);
}

for (const [source, count] of sourceCounts) {
  if (count > 1) issues.push(`Fonte duplicata (${count} giocatori): ${sourceNames.get(source).join(", ")}`);
}

for (const [key, count] of nameCounts) {
  if (count > 1) duplicates.push(`${key} ×${count}`);
}

for (const club of clubs) {
  if (!playersByClub.has(club.name)) issues.push(`Club senza giocatori: ${club.name}`);
  if (!countryCounts.has(club.country)) countryCounts.set(club.country, 0);
  countryCounts.set(club.country, countryCounts.get(club.country) + 1);
}

const countryOptionProblems = [];
for (const [country, count] of countryCounts) {
  if (count < 4 && (playersByCountry.get(country) || 0) > 0) {
    countryOptionProblems.push(`${country}: ${count} club`);
  }
}

const rawIssues = [];
const rawSquadFile = path.join(import.meta.dirname, "raw-squad-players.json");
if (fs.existsSync(rawSquadFile)) {
  const rawSquad = JSON.parse(fs.readFileSync(rawSquadFile, "utf8"));
  const rawSeen = new Set();
  const rawSources = new Map();
  for (const player of rawSquad.players || []) {
    const resolved = resolveCanonicalClub(player.currentClubRaw || player.club, player.currentClubTarget || "");
    if (resolved.status !== "canonical") {
      rawIssues.push(`Rosa: club non attivo "${player.currentClubRaw || player.club}" (${resolved.status}) per ${player.name}`);
    }
    const status = player.status || "squad";
    if (!["squad", "infobox"].includes(status)) {
      rawIssues.push(`Rosa: stato non attivo "${status}" per ${player.name}`);
    }
    if (player.page && !/^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/.test(player.page)) {
      rawIssues.push(`Rosa: fonte non valida per ${player.name} -> ${player.page}`);
    }
    if (RESERVE_NAME_PATTERN.test(player.name)) {
      rawIssues.push(`Rosa: indicatore riserve/giovanili nel nome per ${player.name}`);
    }
    if (player.page) {
      const sourceNames = rawSources.get(player.page) || [];
      sourceNames.push(player.name);
      rawSources.set(player.page, sourceNames);
    }
    const key = `${String(player.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}::${player.club}`;
    if (rawSeen.has(key)) rawIssues.push(`Rosa: duplicato dopo risoluzione ${player.name} -> ${player.club}`);
    rawSeen.add(key);
  }
  for (const [source, names] of rawSources) {
    if (names.length > 1) rawIssues.push(`Rosa: fonte duplicata ${source} -> ${names.join(", ")}`);
  }
}

const sortedClubs = [...playersByClub.entries()].sort((a, b) => b[1] - a[1]);
const sortedCountries = [...playersByCountry.entries()].sort((a, b) => b[1] - a[1]);
const tierSummary = [1, 2, 3].map((tier) => {
  const count = tierCounts.get(tier) || 0;
  return `T${tier} ${count} (${((count / players.length) * 100).toFixed(1)}%)`;
}).join(" · ");
const ageSummary = ages.length
  ? `min ${Math.min(...ages)} · max ${Math.max(...ages)} · media ${(ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)}`
  : "nessuna età";
const numberSummary = numbers.length
  ? `${numbers.length} maglie (${((numbers.length / players.length) * 100).toFixed(1)}%)`
  : "nessun numero";

console.log(`Stagione ${data.season} · aggiornato ${data.updated}`);
console.log(`Giocatori ${players.length} · club ${clubs.length} · nazionalità ${playersByCountry.size}`);
console.log(`Tier: ${tierSummary}`);
console.log(`Età: ${ageSummary}`);
console.log(`Numeri di maglia: ${numberSummary}`);
console.log(`Fonte pagina disponibile: ${players.length - missingSource}/${players.length}`);
console.log(`Ruoli: ${[...positions.entries()].sort((a, b) => b[1] - a[1]).map(([role, count]) => `${role} ${count}`).join(" · ")}`);
console.log(`Logo presenti: ${clubs.filter((club) => club.logo).length}/${clubs.length}`);
console.log(`Club con più giocatori: ${sortedClubs.slice(0, 8).map(([club, count]) => `${club} ${count}`).join(" · ")}`);
console.log(`Club con meno giocatori: ${sortedClubs.slice(-8).map(([club, count]) => `${club} ${count}`).join(" · ")}`);
console.log(`Nazionalità più rappresentate: ${sortedCountries.slice(0, 8).map(([country, count]) => `${country} ${count}`).join(" · ")}`);
console.log(`Nazionalità meno rappresentate: ${sortedCountries.slice(-8).map(([country, count]) => `${country} ${count}`).join(" · ")}`);
console.log(`Nomi duplicati: ${duplicates.length ? duplicates.join(", ") : "nessuno"}`);
if (countryOptionProblems.length) console.log(`Paesi con meno di 4 club: ${countryOptionProblems.join(", ")}`);
if (rawIssues.length) console.log(`Problemi pipeline rose: ${rawIssues.length}`);
issues.push(...rawIssues);
if (issues.length) {
  console.log(`\nProblemi (${issues.length}):`);
  issues.slice(0, 80).forEach((issue) => console.log(`- ${issue}`));
  if (issues.length > 80) console.log(`… e altri ${issues.length - 80}`);
  process.exitCode = 1;
} else {
  console.log("\nNessun problema strutturale rilevato.");
}

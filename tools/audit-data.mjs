// Quick sanity audit for the generated game-data.js.
// Usage: node tools/audit-data.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

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
const positions = new Map();
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

  playersByClub.set(player.club, (playersByClub.get(player.club) || 0) + 1);
  playersByCountry.set(player.nat, (playersByCountry.get(player.nat) || 0) + 1);
  tierCounts.set(player.t, (tierCounts.get(player.t) || 0) + 1);
  const key = player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  if (player.age != null) ages.push(player.age);
  if (player.num != null) numbers.push(player.num);
  const posKey = player.posGroup || player.pos || "?";
  positions.set(posKey, (positions.get(posKey) || 0) + 1);
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

const sortedClubs = [...playersByClub.entries()].sort((a, b) => b[1] - a[1]);
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
console.log(`Nomi duplicati: ${duplicates.length ? duplicates.join(", ") : "nessuno"}`);
if (countryOptionProblems.length) console.log(`Paesi con meno di 4 club: ${countryOptionProblems.join(", ")}`);
if (issues.length) {
  console.log(`\nProblemi (${issues.length}):`);
  issues.slice(0, 80).forEach((issue) => console.log(`- ${issue}`));
  if (issues.length > 80) console.log(`… e altri ${issues.length - 80}`);
  process.exitCode = 1;
} else {
  console.log("\nNessun problema strutturale rilevato.");
}

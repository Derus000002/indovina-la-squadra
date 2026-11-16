// Fetches current player data from Wikipedia and writes tools/raw-players.json.
// Usage: node tools/fetch-players.mjs
import fs from "node:fs";
import path from "node:path";
import { resolveCanonicalClub } from "./club-aliases.mjs";
import { cleanWiki, parseFootballBio } from "./wikitext.mjs";

const PLAYERS = [
  // tier 1 — everyone knows them
  ["Lionel Messi", 1],
  ["Cristiano Ronaldo", 1],
  ["Kylian Mbappé", 1],
  ["Erling Haaland", 1],
  ["Vinícius Júnior", 1],
  ["Jude Bellingham", 1],
  ["Lamine Yamal", 1],
  ["Mohamed Salah", 1],
  ["Harry Kane", 1],
  ["Kevin De Bruyne", 1],
  ["Neymar", 1],
  ["Robert Lewandowski", 1],
  ["Luka Modrić", 1],
  ["Son Heung-min", 1],
  ["Bukayo Saka", 1],
  ["Cole Palmer", 1],
  ["Pedri", 1],
  ["Rodri", 1],
  ["Phil Foden", 1],
  ["Karim Benzema", 1],
  ["Antoine Griezmann", 1],
  ["Lautaro Martínez", 1],
  ["Ousmane Dembélé", 1],
  ["Virgil van Dijk", 1],
  ["Thibaut Courtois", 1],
  ["Manuel Neuer", 1],

  // tier 2 — well-known regulars
  ["Declan Rice", 2],
  ["Martin Ødegaard", 2],
  ["William Saliba", 2],
  ["Rúben Dias", 2],
  ["Bernardo Silva", 2],
  ["Bruno Fernandes", 2],
  ["Marcus Rashford", 2],
  ["Trent Alexander-Arnold", 2],
  ["Florian Wirtz", 2],
  ["Luis Díaz", 2],
  ["Alexis Mac Allister", 2],
  ["Dominik Szoboszlai", 2],
  ["Alexander Isak", 2],
  ["Cody Gakpo", 2],
  ["Enzo Fernández", 2],
  ["Moisés Caicedo", 2],
  ["Kai Havertz", 2],
  ["Gabriel Martinelli", 2],
  ["Gabriel Magalhães", 2],
  ["Cristian Romero", 2],
  ["James Maddison", 2],
  ["Ollie Watkins", 2],
  ["Bruno Guimarães", 2],
  ["Anthony Gordon", 2],
  ["Jarrod Bowen", 2],
  ["Jack Grealish", 2],
  ["John Stones", 2],
  ["Kyle Walker", 2],
  ["Ederson", 2],
  ["Gianluigi Donnarumma", 2],
  ["Joško Gvardiol", 2],
  ["Jérémy Doku", 2],
  ["Omar Marmoush", 2],
  ["Rayan Cherki", 2],
  ["Tijjani Reijnders", 2],
  ["Morgan Rogers", 2],
  ["Eberechi Eze", 2],
  ["Viktor Gyökeres", 2],
  ["Martín Zubimendi", 2],
  ["Mikel Merino", 2],
  ["David Raya", 2],
  ["Rodrygo", 2],
  ["Federico Valverde", 2],
  ["Aurélien Tchouaméni", 2],
  ["Eduardo Camavinga", 2],
  ["Antonio Rüdiger", 2],
  ["Arda Güler", 2],
  ["Endrick", 2],
  ["Dean Huijsen", 2],
  ["Álvaro Carreras", 2],
  ["Raphinha", 2],
  ["Gavi", 2],
  ["Frenkie de Jong", 2],
  ["Jules Koundé", 2],
  ["Pau Cubarsí", 2],
  ["Dani Olmo", 2],
  ["Ferran Torres", 2],
  ["Alejandro Balde", 2],
  ["Joan García", 2],
  ["Julián Álvarez", 2],
  ["Jan Oblak", 2],
  ["Rodrigo De Paul", 2],
  ["José María Giménez", 2],
  ["Alexander Sørloth", 2],
  ["Conor Gallagher", 2],
  ["Robin Le Normand", 2],
  ["Nico Williams", 2],
  ["Mikel Oyarzabal", 2],
  ["Unai Simón", 2],
  ["Takefusa Kubo", 2],
  ["Oihan Sancet", 2],
  ["Marcus Thuram", 2],
  ["Nicolò Barella", 2],
  ["Hakan Çalhanoğlu", 2],
  ["Alessandro Bastoni", 2],
  ["Denzel Dumfries", 2],
  ["Federico Dimarco", 2],
  ["Yann Sommer", 2],
  ["Rafael Leão", 2],
  ["Christian Pulisic", 2],
  ["Adrien Rabiot", 2],
  ["Mike Maignan", 2],
  ["Strahinja Pavlović", 2],
  ["Santiago Giménez", 2],
  ["Romelu Lukaku", 2],
  ["Scott McTominay", 2],
  ["Giovanni Di Lorenzo", 2],
  ["Alessandro Buongiorno", 2],
  ["Dušan Vlahović", 2],
  ["Kenan Yıldız", 2],
  ["Gleison Bremer", 2],
  ["Andrea Cambiaso", 2],
  ["Michele Di Gregorio", 2],
  ["Teun Koopmeiners", 2],
  ["Paulo Dybala", 2],
  ["Lorenzo Pellegrini", 2],
  ["Artem Dovbyk", 2],
  ["Matías Soulé", 2],
  ["Mile Svilar", 2],
  ["Moise Kean", 2],
  ["Ademola Lookman", 2],
  ["Charles De Ketelaere", 2],
  ["Marten de Roon", 2],
  ["Riccardo Orsolini", 2],
  ["Lewis Ferguson", 2],
  ["Santiago Castro", 2],
  ["Dan Ndoye", 2],
  ["Davide Frattesi", 2],
  ["Matteo Politano", 2],
  ["Stanislav Lobotka", 2],
  ["André-Frank Zambo Anguissa", 2],
  ["Alex Meret", 2],
  ["Amir Rrahmani", 2],
  ["Jamal Musiala", 2],
  ["Joshua Kimmich", 2],
  ["Michael Olise", 2],
  ["Serge Gnabry", 2],
  ["Leroy Sané", 2],
  ["Dayot Upamecano", 2],
  ["Kim Min-jae", 2],
  ["Alphonso Davies", 2],
  ["Patrik Schick", 2],
  ["Alejandro Grimaldo", 2],
  ["Granit Xhaka", 2],
  ["Serhou Guirassy", 2],
  ["Karim Adeyemi", 2],
  ["Julian Brandt", 2],
  ["Nico Schlotterbeck", 2],
  ["Gregor Kobel", 2],
  ["Emre Can", 2],
  ["Maximilian Beier", 2],
  ["Xavi Simons", 2],
  ["Benjamin Šeško", 2],
  ["Loïs Openda", 2],
  ["David Raum", 2],
  ["Hugo Ekitike", 2],
  ["Nathaniel Brown", 2],
  ["Nick Woltemade", 2],
  ["Chris Führich", 2],
  ["Deniz Undav", 2],
  ["Vincenzo Grifo", 2],
  ["Mohammed Amoura", 2],
  ["Jonathan Burkardt", 2],
  ["Bradley Barcola", 2],
  ["Khvicha Kvaratskhelia", 2],
  ["Vitinha", 2],
  ["João Neves", 2],
  ["Fabián Ruiz", 2],
  ["Warren Zaïre-Emery", 2],
  ["Marquinhos", 2],
  ["Achraf Hakimi", 2],
  ["Nuno Mendes", 2],
  ["Willian Pacho", 2],
  ["Lucas Hernández", 2],
  ["Désiré Doué", 2],
  ["Lee Kang-in", 2],
  ["Gonçalo Ramos", 2],
  ["Mason Greenwood", 2],
  ["Amine Gouiri", 2],
  ["Jonathan David", 2],
  ["Takumi Minamino", 2],
  ["Folarin Balogun", 2],
  ["Maghnes Akliouche", 2],
  ["Vanderson", 2],
  ["Thilo Kehrer", 2],
  ["Denis Zakaria", 2],
  ["Aleksandr Golovin", 2],
  ["Corentin Tolisso", 2],
  ["Malick Fofana", 2],
  ["Georges Mikautadze", 2],

  // tier 3 — for the connoisseurs
  ["Sergio Busquets", 3],
  ["Jordi Alba", 3],
  ["Luis Suárez", 3],
  ["Sadio Mané", 3],
  ["Riyad Mahrez", 3],
  ["N'Golo Kanté", 3],
  ["Kalidou Koulibaly", 3],
  ["Rúben Neves", 3],
  ["Sergej Milinković-Savić", 3],
  ["Victor Osimhen", 3],
  ["Mauro Icardi", 3],
  ["Dušan Tadić", 3],
  ["Edin Džeko", 3],
  ["Yassine Bounou", 3],
  ["Édouard Mendy", 3],
  ["Roberto Firmino", 3],
  ["Fabinho", 3],
  ["João Cancelo", 3],
  ["Ángel Di María", 3],
  ["Nicolás Otamendi", 3],
  ["Orkun Kökçü", 3],
  ["Vangelis Pavlidis", 3],
  ["Diogo Costa", 3],
  ["Samu Aghehowa", 3],
  ["Francisco Trincão", 3],
  ["Morten Hjulmand", 3],
  ["Amad Diallo", 3],
  ["Kobbie Mainoo", 3],
  ["Leny Yoro", 3],
  ["Rasmus Højlund", 3],
  ["Jadon Sancho", 3],
  ["Pedro Neto", 3],
  ["Nicolas Jackson", 3],
  ["Levi Colwill", 3],
  ["João Pedro", 3],
  ["Matheus Cunha", 3],
  ["Bryan Mbeumo", 3],
  ["Ibrahima Konaté", 3],
  ["Andrew Robertson", 3],
  ["Darwin Núñez", 3],
  ["Weston McKennie", 3],
  ["Timothy Weah", 3],
  ["Davide Zappacosta", 3],
  ["Giorgio Scalvini", 3],
  ["Nicolò Fagioli", 3],
  ["Edoardo Bove", 3],
  ["Federico Chiesa", 3],
  ["Yunus Musah", 3],
  ["Fikayo Tomori", 3],
  ["Matteo Gabbia", 3],
  ["Youssouf Fofana", 3],
  ["Tammy Abraham", 3],
  ["Henrikh Mkhitaryan", 3],
  ["Mehdi Taremi", 3],
  ["Marko Arnautović", 3],
  ["Piotr Zieliński", 3],
  ["Mateo Retegui", 3],
  ["Nicolò Zaniolo", 3],
  ["Giovanni Fabbian", 3],
  ["Wilfried Singo", 3],
  ["Folarin Balogun", 3],
  ["Mika Biereth", 3],
  ["Krépin Diatta", 3],
  ["Ritsu Dōan", 3],
  ["Yannick Carrasco", 3],
  ["Nadiem Amiri", 3],
  ["Jonas Wind", 3],
  ["Maximilian Arnold", 3],
  ["Ridle Baku", 3],
  ["Josip Stanišić", 3],
  ["Konrad Laimer", 3],
  ["Raphaël Guerreiro", 3],
  ["Pascal Groß", 3],
  ["Waldemar Anton", 3],
  ["Felix Nmecha", 3],
  ["Karim Bellarabi", 3],
  ["Lucas Chevalier", 3],
  ["Matvey Safonov", 3],
  ["Presnel Kimpembe", 3],
  ["Nordi Mukiele", 3],
  ["Randal Kolo Muani", 3],
  ["Christopher Nkunku", 3],
  ["Jean-Philippe Mateta", 3],
  ["Odsonne Édouard", 3],
  ["Evan Ferguson", 3],
  ["Georginio Rutter", 3],
  ["Yankuba Minteh", 3],
  ["Facundo Buonanotte", 3],
  ["Carlos Baleba", 3],
  ["Jack Hinshelwood", 3],
  ["Lewis Dunk", 3],
  ["James Tarkowski", 3],
  ["Dominic Calvert-Lewin", 3],
  ["Jarrad Branthwaite", 3],
  ["Dwight McNeil", 3],
  ["Morgan Gibbs-White", 3],
  ["Chris Wood", 3],
  ["Ola Aina", 3],
  ["Neco Williams", 3],
  ["Harry Wilson", 3],
  ["Antoine Semenyo", 3],
  ["Marcos Senesi", 3],
  ["Milos Kerkez", 3],
  ["Ilya Zabarnyi", 3],
  ["Andoni Iraola", 3],
  ["Jhon Durán", 3],
  ["Jhon Arias", 3],
  ["Igor Jesus", 3],
  ["Gonzalo Plata", 3],
  ["Sávio", 3],
  ["Lucas Paquetá", 3],
  ["João Gomes", 3],
  ["Matheus Nunes", 3],
  ["Rayan Aït-Nouri", 3],
  ["Morgan Fox", 3],
  ["Nélson Semedo", 3],
  ["Toti Gomes", 3],
  ["Rodrigo Gomes", 3],
];

const now = new Date();
const results = [];
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parsePage(title, wikitext, tier, pageMissing = false) {
  const info = parseFootballBio(wikitext);
  if (!info.found) return { skip: true, status: "no-infobox" };
  const params = info.params || {};
  const rawClub = cleanWiki(info.currentClubRaw || "");
  const rawClubTarget = info.currentClubTarget || "";
  if (/head coach|manager|assistant coach|assistant manager|\bcoach\b/i.test(rawClub)) {
    return { skip: true, status: "coach" };
  }
  const resolved = resolveCanonicalClub(rawClub, rawClubTarget);
  if (resolved.status !== "canonical") {
    return { skip: true, status: resolved.status, raw: rawClub };
  }

  const rawPos = params.position || "";
  const posText = cleanWiki(rawPos).split(/[,/]/)[0].trim();
  let posGroup = "MF";
  if (/goalkeeper/i.test(posText)) posGroup = "GK";
  else if (/defender|back/i.test(posText)) posGroup = "DF";
  else if (/forward|winger|striker/i.test(posText)) posGroup = "FW";
  else if (/midfielder/i.test(posText)) posGroup = "MF";

  let pos = "Calciatore";
  if (/goalkeeper/i.test(posText)) pos = "Portiere";
  else if (/centre.back|center.back/i.test(posText)) pos = "Difensore centrale";
  else if (/right.back/i.test(posText)) pos = "Terzino destro";
  else if (/left.back/i.test(posText)) pos = "Terzino sinistro";
  else if (/full.back|wing.back/i.test(posText)) pos = "Terzino";
  else if (/defender|centre.back|center.back/i.test(posText)) pos = "Difensore";
  else if (/defensive midfielder/i.test(posText)) pos = "Mediano";
  else if (/attacking midfielder/i.test(posText)) pos = "Trequartista";
  else if (/midfielder/i.test(posText)) pos = "Centrocampista";
  else if (/right winger/i.test(posText)) pos = "Ala destra";
  else if (/left winger/i.test(posText)) pos = "Ala sinistra";
  else if (/winger/i.test(posText)) pos = "Ala";
  else if (/striker|centre.forward|center.forward/i.test(posText)) pos = "Centravanti";
  else if (/forward/i.test(posText)) pos = "Attaccante";

  if (pos === "Portiere") posGroup = "GK";
  else if (/Difensore|Terzino/.test(pos)) posGroup = "DF";
  else if (/Centrocampista|Mediano|Trequartista/.test(pos)) posGroup = "MF";
  else if (/Ala|Esterno|Attaccante|Centravanti/.test(pos)) posGroup = "FW";

  const isYouthTeam = (val) => /\bU-?\d{2}\b|\bunder-?\d{2}\b|youth|olympic|B team/i.test(val);
  const isNonFifaTeam = (val) =>
    /Catalonia|Galicia|Basque Country|Andalusia|Murcia|Valencia national|Canary Islands|Corsica|Brittany|Padania|Lombardy|Sardinia|Tibet|Kurdistan|Palestine national|Abkhazia|South Ossetia|Northern Cyprus|Western Sahara|Somaliland|Zanzibar/i.test(
      val,
    );

  let nationalTeamCountry = "";
  for (const team of info.nationalTeams || []) {
    const val = cleanWiki(team.value);
    if (!val || isYouthTeam(val) || isNonFifaTeam(val)) continue;
    const candidate = val.split(" / ")[0].replace(/\s*(national football team|national team)$/i, "").trim();
    if (candidate) {
      nationalTeamCountry = candidate;
      break;
    }
  }

  let birthPlaceCountry = "";
  const birthPlace = cleanWiki(info.birthPlace || "");
  const parts = birthPlace.split(",").map((s) => s.trim());
  const candidate = parts.length > 1 ? parts[parts.length - 1] : "";
  if (candidate && !isYouthTeam(candidate)) birthPlaceCountry = candidate;

  nationalTeamCountry = nationalTeamCountry.replace(/\[\[|\]\]/g, "").trim();
  birthPlaceCountry = birthPlaceCountry.replace(/\[\[|\]\]/g, "").trim();
  const country = nationalTeamCountry || birthPlaceCountry;

  let age = null;
  const b = (params.birth_date || "").match(/(\d{4})\|(\d{1,2})\|(\d{1,2})/);
  if (b) {
    const bd = new Date(Number(b[1]), Number(b[2]) - 1, Number(b[3]));
    age = now.getFullYear() - bd.getFullYear() - (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate()) ? 1 : 0);
  }

  const number = (params.club_number || params.currentnumber || "").replace(/[^\d]/g, "") || null;
  return {
    name: title,
    club: resolved.name,
    pos,
    posGroup,
    country,
    nationalTeamCountry,
    birthPlaceCountry,
    age,
    number,
    tier,
    currentClubRaw: rawClub || null,
    currentClubTarget: rawClubTarget || null,
    status: resolved.status,
    page: pageMissing || !title
      ? null
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

async function fetchBatch(names) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1" +
    "&prop=revisions&rvslots=main&rvprop=content&titles=" +
    encodeURIComponent(names.join("|"));
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "IndovinaLaSquadra/1.0 (local party game; data refresh)",
          Accept: "application/json",
        },
      });
      if (res.status === 429) {
        const wait = 5000 * (attempt + 1);
        console.log(`Rate limited, waiting ${wait / 1000}s…`);
        lastError = new Error("HTTP 429");
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.query) throw new Error(json.error?.info || "empty query");
      return json.query;
    } catch (err) {
      lastError = err;
      if (attempt === 5) break;
      await sleep(2500 * (attempt + 1));
    }
  }
  throw lastError || new Error("Wikipedia API retry limit reached");
}

async function searchPlayerPage(name) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    list: "search",
    srsearch: `${name} footballer`,
    srnamespace: "0",
    srlimit: "5",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "IndovinaLaSquadra/1.0 (local party game; data refresh)",
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const hits = json.query?.search || [];
      if (!hits.length) return null;
      const surname = name.trim().split(/\s+/).pop().toLowerCase();
      return (hits.find((hit) => hit.title.toLowerCase().includes(surname)) || hits[0]).title;
    } catch (error) {
      if (attempt === 2) return null;
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

async function main() {
  const unique = [...new Map(PLAYERS.map(([name, tier]) => [name, tier])).entries()];
  const tierByName = new Map(unique);
  const batches = [];
  for (let i = 0; i < unique.length; i += 40) batches.push(unique.slice(i, i + 40));

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length} (${batch.length} pages)…`);
    const query = await fetchBatch(batch.map(([name]) => name));
    const normalized = new Map((query.normalized || []).map((n) => [n.from, n.to]));
    const redirected = new Map((query.redirects || []).map((r) => [r.from, r.to]));
    const finalToOriginal = new Map();
    for (const [name] of batch) {
      const norm = normalized.get(name) || name;
      const final = redirected.get(norm) || norm;
      finalToOriginal.set(final, name);
    }
    const pages = query.pages || [];
    for (const page of pages) {
      const original = finalToOriginal.get(page.title) || page.title;
      const tier = tierByName.get(original) ?? 2;
      let content = page.missing ? "" : page.revisions?.[0]?.slots?.main?.content;
      let usedTitle = page.title;
      let data = content ? parsePage(usedTitle, content, tier, Boolean(page.missing)) : null;

      if (!data || (data.skip && ["no-infobox", "page missing or empty", "missing page"].includes(data.status))) {
        const better = await searchPlayerPage(original);
        if (better && better !== usedTitle) {
          try {
            const fallbackQuery = await fetchBatch([better]);
            const fallbackPage = fallbackQuery?.pages?.[0];
            const fallbackContent = fallbackPage?.revisions?.[0]?.slots?.main?.content;
            if (fallbackContent && !fallbackPage.missing) {
              usedTitle = fallbackPage.title;
              data = parsePage(usedTitle, fallbackContent, tier, Boolean(fallbackPage.missing));
            }
          } catch (fallbackError) {
            console.log(`Fallback lookup failed for ${original}: ${fallbackError.message}`);
          }
          await sleep(600);
        }
      }

      try {
        if (data && !data.skip) results.push(data);
        else errors.push({ name: usedTitle, reason: data?.status || "no current club / filtered", raw: data?.raw || null });
      } catch (err) {
        errors.push({ name: usedTitle, reason: String(err?.message || err) });
      }
    }
    await sleep(500);
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  const clubs = [...new Set(results.map((p) => p.club))].sort();
  const countries = [...new Set(results.map((p) => p.country))].sort();
  const out = path.join(import.meta.dirname, "raw-players.json");
  fs.writeFileSync(out, JSON.stringify({ fetchedAt: new Date().toISOString(), players: results }, null, 2));
  console.log(`\nSaved ${results.length} players to ${out}`);
  console.log(`\nUnique clubs (${clubs.length}):\n${clubs.join(" · ")}`);
  console.log(`\nUnique countries (${countries.length}):\n${countries.join(" · ")}`);
  if (errors.length) {
    console.log(`\nSkipped (${errors.length}):`);
    for (const e of errors) console.log(`- ${e.name}: ${e.reason}${e.raw ? ` [${e.raw}]` : ""}`);
  }
}

main();

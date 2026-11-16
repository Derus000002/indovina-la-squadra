// Discovers players from the "Current squad" sections of the club pages in club-pages.mjs,
// then refreshes age, nationality and position from each player's Wikipedia infobox.
// Output: tools/raw-squad-players.json
// Usage: node tools/fetch-squads.mjs
import fs from "node:fs";
import path from "node:path";
import { CLUBS } from "./clubs.mjs";
import { CLUB_PAGES } from "./club-pages.mjs";
import { resolveCanonicalClub } from "./club-aliases.mjs";
import { cleanWiki, extractTemplates, parseFootballBio, templateParams } from "./wikitext.mjs";

const root = path.join(import.meta.dirname, "..");
const USER_AGENT = "IndovinaLaSquadra/1.0 (local pass-and-play quiz; squad refresh)";
const API = "https://en.wikipedia.org/w/api.php";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = new Date();

function chunks(list, size) {
  const out = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function requestJson(params, tries = 7) {
  const url = `${API}?${new URLSearchParams(params).toString()}`;
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json"
        }
      });
      if (response.status === 429) {
        const wait = 12000 * (attempt + 1);
        console.log(`Rate limited, attendo ${Math.round(wait / 1000)}s…`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.query) throw new Error(json.error?.info || "query vuota");
      return json.query;
    } catch (error) {
      if (attempt === tries - 1) throw error;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error("Rate limit non superato");
}

async function fetchPages(titles, withContent = true) {
  const batches = chunks(titles, 30);
  const pages = new Map();
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`  pagina ${index + 1}/${batches.length} (${batch.length} titoli)…`);
    const query = await requestJson({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: withContent ? "revisions|info" : "info",
      ...(withContent ? { rvslots: "main", rvprop: "content" } : {}),
      titles: batch.join("|")
    });
    const normalized = new Map((query.normalized || []).map((item) => [item.from, item.to]));
    const redirected = new Map((query.redirects || []).map((item) => [item.from, item.to]));
    const finalToOriginal = new Map();
    for (const title of batch) {
      const normalizedTitle = normalized.get(title) || title;
      const finalTitle = redirected.get(normalizedTitle) || normalizedTitle;
      finalToOriginal.set(finalTitle, title);
    }
    for (const page of query.pages || []) {
      const original = finalToOriginal.get(page.title) || page.title;
      pages.set(original, { ...page, requestedTitle: original });
    }
    await sleep(1000);
  }
  return pages;
}

function findHeadings(text) {
  const headings = [];
  const regex = /^(={2,6})\s*([^=\n][^\n]*?)\s*\1\s*$/gm;
  let match;
  while ((match = regex.exec(text))) {
    headings.push({
      start: match.index,
      end: match.index + match[0].length,
      level: match[1].length,
      title: match[2].replace(/'{2,}/g, "").trim()
    });
  }
  return headings;
}

function extractNameAndPage(value) {
  const cleaned = String(value || "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{flagicon\|[^{}]*\}\}/gi, "")
    .replace(/\{\{flagcountry\|[^{}]*\}\}/gi, "")
    .trim();
  const link = cleaned.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (link) {
    const target = link[1].trim();
    let display = (link[2] || target).replace(/\s*\([^)]*\)\s*$/, "").trim();
    display = cleanWiki(display);
    return { name: display, pageTitle: target };
  }
  return { name: cleanWiki(cleaned), pageTitle: null };
}

function headingForTemplate(headings, position) {
  let found = null;
  for (const heading of headings) {
    if (heading.start < position) found = heading;
    else break;
  }
  return found;
}

function isExcludedHeading(title) {
  return /out on loan|loaned out|loan out|\bloan(?:ed|s)?\b|reserve|youth|academy|former|women|manager|staff|transfer|notable|records|honours|european|history|support|stadium|kit|crest|ownership|season|statistic|top scorer|personnel|coaching|honor|junior|campus|unregistered|primavera|next\s*gen|\bii\b|\b[bc]\s+team\b|other players/i.test(title);
}

function isSquadHeading(title) {
  return /current|first[- ]team|senior|playing squad|squad|roster|team|players/i.test(title);
}

function discoverSquad(text, clubName) {
  const headings = findHeadings(text);
  const templates = extractTemplates(text, (body) => /^(?:fs|football squad|football squad player|squad player|fb squad player)\s+player\b/i.test(body));
  const groups = new Map();
  for (const template of templates) {
    const heading = headingForTemplate(headings, template.start);
    if (!heading) continue;
    if (isExcludedHeading(heading.title) || !isSquadHeading(heading.title)) continue;
    const entries = groups.get(heading.title) || [];
    entries.push(template);
    groups.set(heading.title, entries);
  }

  let chosen = [...groups.entries()]
    .filter(([, entries]) => entries.length > 0)
    .sort((a, b) => b[1].length - a[1].length);
  if (!chosen.length) {
    const fallbackGroups = new Map();
    for (const template of templates) {
      const heading = headingForTemplate(headings, template.start);
      const title = heading?.title || "senza sezione";
      if (isExcludedHeading(title)) continue;
      const entries = fallbackGroups.get(title) || [];
      entries.push(template);
      fallbackGroups.set(title, entries);
    }
    chosen = [...fallbackGroups.entries()].filter(([, entries]) => entries.length >= 8).sort((a, b) => b[1].length - a[1].length);
  }
  if (!chosen.length) return { entries: [], groups: [...groups.entries()].map(([title, items]) => `${title}:${items.length}`), totalTemplates: templates.length };

  const seen = new Set();
  const entries = [];
  for (const [heading, templatesInGroup] of chosen) {
    for (const template of templatesInGroup) {
      const params = templateParams(template.body);
      const other = cleanWiki(params.other || "");
      if (/unregistered|svincolato|free agent|without club|reserve|primavera|youth|academy|next\s*gen|futuro|castilla|atl[eè]tic|jong|campus|\bii\b|\b[bc]\s+team\b|\bU-?\d{2}\b|\bunder-?\d{2}\b/i.test(other)) continue;
      // Keep loanees who are currently in this squad ("on loan from …"), but
      // drop players the club has loaned out ("on loan to/at …"). The player
      // infobox later confirms the exact current club either way.
      if (/\bout on loan\b|\bon loan (?:to|at)\b|\bloaned (?:out )?(?:to|at)\b|\bloan (?:to|at)\b|\bprestito (?:a|al|alla)\b/i.test(other)) continue;
      const extracted = extractNameAndPage(params.name || "");
      if (!extracted.name) continue;
      const key = normalizeName(extracted.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const posCode = cleanWiki(params.pos || "").toUpperCase();
      let posGroup = null;
      if (/^GK/.test(posCode) || /goalkeeper/i.test(posCode)) posGroup = "GK";
      else if (/^DF/.test(posCode) || /defender/i.test(posCode)) posGroup = "DF";
      else if (/^MF/.test(posCode) || /midfielder/i.test(posCode)) posGroup = "MF";
      else if (/^FW/.test(posCode) || /forward|striker/i.test(posCode)) posGroup = "FW";
      entries.push({
        name: extracted.name,
        pageTitle: extracted.pageTitle,
        club: clubName,
        posGroup,
        number: (cleanWiki(params.no || "").match(/\d+/) || [null])[0],
        squadNat: cleanWiki(params.nat || "")
      });
    }
  }
  return {
    entries,
    groups: [...groups.entries()].map(([title, items]) => `${title}:${items.length}`),
    totalTemplates: templates.length
  };
}

function positionFromPage(value, fallbackGroup) {
  const text = cleanWiki(value || "").split(/[,/]/)[0].trim();
  let pos = "";
  if (/goalkeeper/i.test(text)) pos = "Portiere";
  else if (/centre.back|center.back/i.test(text)) pos = "Difensore centrale";
  else if (/right.back/i.test(text)) pos = "Terzino destro";
  else if (/left.back/i.test(text)) pos = "Terzino sinistro";
  else if (/full.back|wing.back/i.test(text)) pos = "Terzino";
  else if (/defender|centre.back|center.back/i.test(text)) pos = "Difensore";
  else if (/defensive midfielder/i.test(text)) pos = "Mediano";
  else if (/attacking midfielder/i.test(text)) pos = "Trequartista";
  else if (/midfielder/i.test(text)) pos = "Centrocampista";
  else if (/right winger/i.test(text)) pos = "Ala destra";
  else if (/left winger/i.test(text)) pos = "Ala sinistra";
  else if (/winger/i.test(text)) pos = "Ala";
  else if (/striker|centre.forward|center.forward/i.test(text)) pos = "Centravanti";
  else if (/forward/i.test(text)) pos = "Attaccante";

  if (pos) return pos;
  return {
    GK: "Portiere",
    DF: "Difensore",
    MF: "Centrocampista",
    FW: "Attaccante"
  }[fallbackGroup] || "Calciatore";
}

function parsePlayerInfobox(wikitext) {
  const info = parseFootballBio(wikitext);
  const params = info.params || {};

  let age = null;
  const birth = String(params.birth_date || "").match(/(\d{4})\|(\d{1,2})\|(\d{1,2})/);
  if (birth) {
    const date = new Date(Number(birth[1]), Number(birth[2]) - 1, Number(birth[3]));
    age = now.getFullYear() - date.getFullYear() - (now < new Date(now.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
  }

  const isYouthTeam = (val) => /\bU-?\d{2}\b|\bunder-?\d{2}\b|youth|olympic|B team/i.test(val);
  const isNonFifaTeam = (val) => /Catalonia|Galicia|Basque Country|Andalusia|Murcia|Valencia national|Canary Islands|Corsica|Brittany|Padania|Lombardy|Sardinia|Tibet|Kurdistan|Palestine national|Abkhazia|South Ossetia|Northern Cyprus|Western Sahara|Somaliland|Zanzibar/i.test(val);
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
  const parts = birthPlace.split(",").map((part) => part.trim());
  const candidate = parts.length > 1 ? parts[parts.length - 1] : "";
  if (candidate && !isYouthTeam(candidate)) birthPlaceCountry = candidate;
  const country = nationalTeamCountry || birthPlaceCountry;

  return {
    age,
    country: country.replace(/\[\[|\]\]/g, "").trim(),
    nationalTeamCountry: nationalTeamCountry.replace(/\[\[|\]\]/g, "").trim(),
    birthPlaceCountry: birthPlaceCountry.replace(/\[\[|\]\]/g, "").trim(),
    positionText: info.position || "",
    currentClubRaw: cleanWiki(info.currentClubRaw || ""),
    currentClubTarget: cleanWiki(info.currentClubTarget || ""),
    status: cleanWiki(info.status || ""),
    hasInfobox: info.found
  };
}

function autoTier(pageLength, clubPrestige) {
  if (pageLength >= 120000) return 1;
  if (pageLength >= 50000) return 2;
  if (pageLength >= 30000 && clubPrestige <= 2) return 2;
  return 3;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "raw-players.json"), "utf8"));
  const existingByName = new Map(existing.players.map((player) => [normalizeName(player.name), player]));
  const clubByName = new Map(CLUBS.map(([name, code, c1, c2, country, prestige]) => [name, {
    name, code, c1, c2, country, prestige
  }]));

  const clubs = Object.entries(CLUB_PAGES)
    .filter(([name]) => clubByName.has(name))
    .map(([name, page]) => ({ name, page, ...clubByName.get(name) }));

  console.log(`Scarico ${clubs.length} pagine di club…`);
  const pageQuery = await fetchPages(clubs.map((club) => club.page), true);
  const discovered = [];
  const diagnostics = [];

  for (const club of clubs) {
    const page = pageQuery.get(club.page);
    const content = page?.revisions?.[0]?.slots?.main?.content;
    if (!content) {
      diagnostics.push({ club: club.name, page: club.page, status: "missing page" });
      continue;
    }
    const result = discoverSquad(content, club.name);
    diagnostics.push({
      club: club.name,
      page: club.page,
      entries: result.entries.length,
      groups: result.groups,
      templates: result.totalTemplates
    });
    for (const entry of result.entries) discovered.push({ ...entry, clubPrestige: club.prestige });
    console.log(`${club.name}: ${result.entries.length} giocatori${result.entries.length ? "" : " — NESSUNA ROSA TROVATA"}`);
  }

  const players = discovered;
  console.log(`\nGiocatori trovati: ${players.length}`);
  console.log("Scarico le pagine dei giocatori per età, nazionalità e club attuale…");

  const pageTitles = [...new Set(players.map((player) => player.pageTitle).filter(Boolean))];
  const playerPages = await fetchPages(pageTitles, true);
  const candidates = [];
  const resolution = [];

  for (const entry of players) {
    const page = entry.pageTitle ? playerPages.get(entry.pageTitle) : null;
    const pageMissing = Boolean(page?.missing);
    const content = pageMissing ? "" : page?.revisions?.[0]?.slots?.main?.content || "";
    const info = content
      ? parsePlayerInfobox(content)
      : {
          age: null,
          country: "",
          nationalTeamCountry: "",
          birthPlaceCountry: "",
          positionText: "",
          currentClubRaw: "",
          currentClubTarget: "",
          status: "",
          hasInfobox: false
        };
    const existingPlayer = existingByName.get(normalizeName(entry.name));
    const pageLength = pageMissing ? 0 : page?.length || 0;
    const clubPrestige = entry.clubPrestige;
    const tier = existingPlayer?.tier || autoTier(pageLength, clubPrestige);
    const pos = positionFromPage(info.positionText, entry.posGroup);

    let club = entry.club;
    let status = "squad";
    if (info.currentClubRaw || info.currentClubTarget) {
      const resolved = resolveCanonicalClub(info.currentClubRaw, info.currentClubTarget);
      if (resolved.status === "canonical") {
        club = resolved.name;
        status = "infobox";
      } else {
        status = resolved.status;
      }
    }

    const pageTitle = pageMissing ? entry.pageTitle || null : page?.title || entry.pageTitle || null;
    const record = {
      name: entry.name,
      club,
      squadClub: entry.club,
      pos,
      posGroup: entry.posGroup,
      country: info.country,
      nationalTeamCountry: info.nationalTeamCountry || "",
      birthPlaceCountry: info.birthPlaceCountry || "",
      squadNat: entry.squadNat,
      age: info.age,
      number: entry.number ? Number(entry.number) : null,
      tier,
      currentClubRaw: info.currentClubRaw || null,
      currentClubTarget: info.currentClubTarget || null,
      status,
      pageTitle,
      pageMissing,
      page: pageMissing || !pageTitle
        ? null
        : `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
      pageLength,
      existing: Boolean(existingPlayer)
    };

    resolution.push({
      name: entry.name,
      squadClub: entry.club,
      currentClubRaw: info.currentClubRaw,
      currentClubTarget: info.currentClubTarget,
      resolvedClub: club,
      status,
      pageTitle
    });
    if (!["squad", "infobox"].includes(status)) continue;
    candidates.push(record);
  }

  const candidateScore = (candidate) => {
    let score = 0;
    if (candidate.pageTitle && !candidate.pageMissing) score += 100;
    if (candidate.number != null) score += 20;
    if (candidate.existing) score += 10;
    if (candidate.status === "infobox") score += 5;
    score += Math.min(10, Math.floor(candidate.pageLength / 20000));
    return score;
  };

  const grouped = new Map();
  for (const candidate of candidates) {
    const key = normalizeName(candidate.name);
    const group = grouped.get(key) || [];
    group.push(candidate);
    grouped.set(key, group);
  }

  const finalResults = [];
  for (const group of grouped.values()) {
    const validPages = new Set(
      group
        .filter((candidate) => candidate.pageTitle && !candidate.pageMissing)
        .map((candidate) => normalizeName(candidate.pageTitle))
    );
    if (validPages.size > 1) {
      for (const candidate of group) {
        resolution.push({
          name: candidate.name,
          squadClub: candidate.squadClub,
          currentClubRaw: candidate.currentClubRaw,
          resolvedClub: null,
          status: "ambiguous-name",
          pageTitle: candidate.pageTitle,
          otherPages: [...validPages]
        });
      }
      continue;
    }

    group.sort((a, b) => candidateScore(b) - candidateScore(a) || a.name.localeCompare(b.name));
    const [chosen, ...duplicates] = group;
    for (const duplicate of duplicates) {
      resolution.push({
        name: duplicate.name,
        squadClub: duplicate.squadClub,
        currentClubRaw: duplicate.currentClubRaw,
        resolvedClub: duplicate.club,
        status: "duplicate-name",
        pageTitle: duplicate.pageTitle,
        chosenClub: chosen.club
      });
    }
    const { squadClub, currentClubTarget, pageTitle, pageMissing, ...player } = chosen;
    finalResults.push(player);
  }

  finalResults.sort((a, b) => a.name.localeCompare(b.name));
  const out = path.join(import.meta.dirname, "raw-squad-players.json");
  fs.writeFileSync(out, JSON.stringify({
    fetchedAt: now.toISOString(),
    source: "Wikipedia current squad sections + player infoboxes",
    clubs: clubs.map((club) => ({ name: club.name, page: club.page })),
    diagnostics,
    resolution,
    players: finalResults
  }, null, 2));

  const tiers = finalResults.reduce((acc, player) => ((acc[player.tier] = (acc[player.tier] || 0) + 1), acc), {});
  const withAge = finalResults.filter((player) => player.age).length;
  const withCountry = finalResults.filter((player) => player.country).length;
  console.log(`\nSalvati ${finalResults.length} giocatori in ${out}`);
  console.log(`Tier: ${JSON.stringify(tiers)} · età: ${withAge}/${finalResults.length} · paese: ${withCountry}/${finalResults.length}`);
  const empty = diagnostics.filter((item) => !item.entries);
  if (empty.length) {
    console.log(`\nClub senza rosa trovata (${empty.length}):`);
    for (const item of empty) console.log(`- ${item.club}: ${item.status || "0 template"} (${item.templates || 0} template totali)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

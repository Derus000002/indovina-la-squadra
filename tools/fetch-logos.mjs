// Downloads 180px club crest thumbnails from Wikipedia and writes tools/logos.json.
// The crests remain trademarks of their clubs and are used here only to identify teams.
// Usage: node tools/fetch-logos.mjs
import fs from "node:fs";
import path from "node:path";
import { CLUBS } from "./clubs.mjs";
import { CLUB_PAGES } from "./club-pages.mjs";

const root = path.join(import.meta.dirname, "..");
const logoDir = path.join(root, "assets", "logos");
const metaFile = path.join(import.meta.dirname, "logos.json");
const USER_AGENT = "IndovinaLaSquadra/1.0 (local pass-and-play quiz; crest refresh)";
const API = "https://en.wikipedia.org/w/api.php";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fs.mkdirSync(logoDir, { recursive: true });

function chunks(list, size) {
  const out = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
}

async function request(url, options = {}, tries = 7) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "*/*",
          ...(options.headers || {})
        }
      });
      if (response.status === 429) {
        const wait = 12000 * (attempt + 1);
        console.log(`Rate limited, attendo ${Math.round(wait / 1000)}s…`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (attempt === tries - 1) throw error;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error("Rate limit non superato");
}

async function api(params) {
  const response = await request(`${API}?${new URLSearchParams(params).toString()}`);
  return response.json();
}

function extractInfoboxImage(wikitext) {
  const start = wikitext.search(/\{\{\s*Infobox football club/i);
  if (start < 0) return "";
  const box = wikitext.slice(start, start + 12000);
  const match = box.match(/^\s*\|\s*(?:image|logo|badge|crest)\s*=\s*(.+)$/mi);
  if (!match) return "";
  let value = match[1].trim();
  const linked = value.match(/\[\[(?:File|Image):([^|\]]+)/i);
  if (linked) return linked[1].trim();
  value = value
    .replace(/^\{\{.*?\}\}$/g, "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/^(?:File|Image):/i, "")
    .split("|")[0]
    .trim();
  return value;
}

function cleanFileTitle(name) {
  return `File:${String(name || "").replace(/^(?:File|Image):/i, "").trim()}`;
}

function toFileUrl(page) {
  return page?.thumbnail?.source || page?.original?.source || "";
}

async function fetchFileInfos(fileTitles) {
  const map = new Map();
  const batches = chunks([...new Set(fileTitles.filter(Boolean))], 20);
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`  file immagine ${index + 1}/${batches.length} (${batch.length})…`);
    const json = await api({
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "180",
      titles: batch.join("|")
    });
    const normalized = new Map((json.query?.normalized || []).map((item) => [item.from, item.to]));
    const redirected = new Map((json.query?.redirects || []).map((item) => [item.from, item.to]));
    const pages = new Map((json.query?.pages || []).map((page) => [page.title, page]));
    for (const title of batch) {
      const norm = normalized.get(title) || title;
      const final = redirected.get(norm) || norm;
      const page = pages.get(final) || pages.get(title);
      if (page && !page.missing && page.imageinfo?.[0]) map.set(title, page);
    }
    await sleep(1200);
  }
  return map;
}

async function main() {
  const clubByName = new Map(CLUBS.map(([name, code, c1, c2, country, prestige]) => [name, {
    name, code, c1, c2, country, prestige
  }]));
  const entries = Object.entries(CLUB_PAGES).filter(([name]) => clubByName.has(name));
  let previous = { logos: {} };
  try {
    previous = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  } catch (error) {
    /* First run. */
  }
  const results = { ...(previous.logos || {}) };
  const missing = entries.filter(([name]) => {
    const existing = results[name];
    return !existing || !fs.existsSync(path.join(root, existing.file));
  });
  console.log(`${missing.length} club da recuperare su ${entries.length}.`);

  const pageCandidates = [];
  const fileCandidates = [];
  const batches = chunks(missing, 15);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    console.log(`Club batch ${batchIndex + 1}/${batches.length} (${batch.length})…`);
    const json = await api({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: "pageimages|revisions|info",
      piprop: "thumbnail|original",
      pithumbsize: "180",
      rvslots: "main",
      rvprop: "content",
      titles: batch.map(([, title]) => title).join("|")
    });
    const normalized = new Map((json.query?.normalized || []).map((item) => [item.from, item.to]));
    const redirects = new Map((json.query?.redirects || []).map((item) => [item.from, item.to]));
    const pages = new Map((json.query?.pages || []).map((page) => [page.title, page]));

    for (const [clubName, pageTitle] of batch) {
      const club = clubByName.get(clubName);
      const norm = normalized.get(pageTitle) || pageTitle;
      const finalTitle = redirects.get(norm) || norm;
      const page = pages.get(finalTitle) || pages.get(pageTitle);
      if (!page || page.missing) {
        console.log(`  MISSING page: ${clubName} -> ${pageTitle}`);
        continue;
      }
      const wiki = `https://en.wikipedia.org/wiki/${encodeURIComponent((page.title || finalTitle).replace(/ /g, "_"))}`;
      const content = page.revisions?.[0]?.slots?.main?.content || "";
      const imageName = extractInfoboxImage(content);
      if (imageName) {
        fileCandidates.push({
          club,
          pageTitle: page.title || finalTitle,
          wiki,
          fileTitle: cleanFileTitle(imageName),
          via: "infobox"
        });
        console.log(`  infobox: ${club.name} -> ${cleanFileTitle(imageName)}`);
        continue;
      }

      const direct = toFileUrl(page);
      if (direct) {
        pageCandidates.push({
          club,
          pageTitle: page.title || finalTitle,
          wiki,
          imageUrl: direct,
          via: "pageimage",
          fileTitle: null
        });
        console.log(`  pageimage: ${club.name}`);
        continue;
      }

      console.log(`  NO IMAGE: ${clubName} (${pageTitle})`);
    }
    await sleep(1600);
  }

  const filePages = await fetchFileInfos(fileCandidates.map((item) => item.fileTitle));
  for (const item of fileCandidates) {
    const page = filePages.get(item.fileTitle);
    const imageUrl = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
    if (!imageUrl) {
      console.log(`  FILE IMAGE MISSING: ${item.club.name} -> ${item.fileTitle}`);
      continue;
    }
    pageCandidates.push({ ...item, imageUrl, via: "infobox" });
  }

  for (const candidate of pageCandidates) {
    const club = candidate.club;
    try {
      const imageResponse = await request(candidate.imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      const fileName = `${club.code.toLowerCase()}.png`;
      const target = path.join(logoDir, fileName);
      fs.writeFileSync(target, buffer);
      results[club.name] = {
        club: club.name,
        code: club.code,
        page: candidate.pageTitle,
        wiki: candidate.wiki,
        file: `assets/logos/${fileName}`,
        imageUrl: candidate.imageUrl,
        via: candidate.via,
        bytes: buffer.length,
        fetchedAt: new Date().toISOString()
      };
      console.log(`  salvato ${club.name}: ${fileName} (${Math.round(buffer.length / 1024)} KB)`);
    } catch (error) {
      console.log(`  DOWNLOAD FAILED: ${club.name} — ${error.message}`);
    }
    await sleep(350);
  }

  fs.writeFileSync(metaFile, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: "English Wikipedia page images and club infobox images",
    note: "Club crests are trademarks of their respective owners and are used for identification only.",
    logos: results
  }, null, 2));

  console.log(`\nLoghi disponibili: ${Object.keys(results).length}/${CLUBS.length}`);
  const absent = CLUBS.map(([name]) => name).filter((name) => !results[name]);
  if (absent.length) console.log(`Senza logo (${absent.length}): ${absent.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

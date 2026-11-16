// Shared, balanced wikitext helpers for the data pipeline.
// The old fetchers stopped at the first line containing "}}" which truncates
// infoboxes that use nested templates (birth dates, national teams, flags).

export function findTemplateEnd(text, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < text.length - 1; index += 1) {
    if (text[index] === "{" && text[index + 1] === "{") {
      depth += 1;
      index += 1;
    } else if (text[index] === "}" && text[index + 1] === "}") {
      depth -= 1;
      index += 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

export function extractTemplate(text, startIndex) {
  const end = findTemplateEnd(text, startIndex);
  if (end < 0) return null;
  return { start: startIndex, end, body: text.slice(startIndex + 2, end - 2) };
}

export function extractTemplates(text, matcher) {
  const found = [];
  let cursor = 0;
  while (cursor < text.length - 1) {
    const start = text.indexOf("{{", cursor);
    if (start < 0) break;
    const template = extractTemplate(text, start);
    if (!template) break;
    if (matcher(template.body)) found.push(template);
    cursor = template.end;
  }
  return found;
}

export function splitTemplateParams(body) {
  const parts = [];
  let current = "";
  let linkDepth = 0;
  let templateDepth = 0;
  for (let index = 0; index < body.length; index += 1) {
    const pair = body.slice(index, index + 2);
    if (pair === "[[") {
      linkDepth += 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "]]" && linkDepth > 0) {
      linkDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "{{") {
      templateDepth += 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "}}" && templateDepth > 0) {
      templateDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }
    if (body[index] === "|" && linkDepth === 0 && templateDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += body[index];
  }
  parts.push(current);
  return parts;
}

export function templateParams(body) {
  const params = {};
  splitTemplateParams(body).forEach((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return;
    const key = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();
    if (key) params[key] = value;
  });
  return params;
}

export function findInfobox(text, prefixes = ["infobox football biography", "infobox football club"]) {
  for (const prefix of prefixes) {
    const regex = new RegExp(`\\{\\{\\s*${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    const match = regex.exec(text);
    if (match) {
      const template = extractTemplate(text, match.index);
      if (template) return template;
    }
  }
  return null;
}

function firstWikiLinkTarget(value) {
  const regex = /\[\[\s*([^\]|#]+?)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let match;
  while ((match = regex.exec(String(value || "")))) {
    const target = match[1].trim();
    if (target && !/^(?:file|image|category):/i.test(target)) return target;
  }
  return "";
}

export function parseFootballBio(text) {
  const template = findInfobox(text, ["infobox football biography"]);
  if (!template) {
    return {
      found: false,
      params: {},
      currentClubRaw: "",
      currentClubTarget: "",
      nationalTeams: [],
      birthPlace: "",
      birthDate: "",
      position: "",
      number: "",
      status: ""
    };
  }
  const params = templateParams(template.body);
  const nationalTeams = Object.keys(params)
    .filter((key) => /^national_?team\d*$/.test(key) || /^nationalteam\d*$/.test(key))
    .sort((first, second) => {
      const firstNumber = Number(first.match(/\d+$/)?.[0] || 0);
      const secondNumber = Number(second.match(/\d+$/)?.[0] || 0);
      return firstNumber - secondNumber;
    })
    .map((key) => ({ key, value: params[key] }))
    .filter((entry) => String(entry.value || "").trim());

  return {
    found: true,
    params,
    currentClubRaw: params.current_club || params.currentclub || params.club || "",
    currentClubTarget: firstWikiLinkTarget(params.current_club || params.currentclub || params.club || ""),
    nationalTeams,
    birthPlace: params.birth_place || params.birthplace || "",
    birthDate: params.birth_date || params.birthdate || "",
    position: params.position || "",
    number: params.currentnumber || params.club_number || params.number || "",
    status: params.status || ""
  };
}

export function stripRefs(value) {
  return String(value || "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ")
    .replace(/<ref[^>]*\/>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

export function cleanWiki(value) {
  let text = stripRefs(value);
  text = text.replace(/\{\{\s*(?:small|nowrap|flagicon|flagcountry|flag|fc)\s*\|\s*([^{}|]*).*?\}\}/gi, "$1 ");
  text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  text = text.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, " ");
  text = text.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1");
  text = text.replace(/'''?/g, "");
  text = text.replace(/<br\s*\/?>/gi, " / ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, " & ");
  return text.replace(/\s+/g, " ").replace(/\s*\/\s*/g, " / ").trim();
}

export function firstTemplateValue(value, names) {
  const text = String(value || "");
  for (const name of names) {
    const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\|\\s*([^}|]*)`, "i");
    const match = text.match(regex);
    if (match) return cleanWiki(match[1]);
  }
  return "";
}

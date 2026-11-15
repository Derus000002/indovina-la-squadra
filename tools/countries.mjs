// Country labels and flag emoji for the game. Uses Intl for Italian region names.
// Handles English country names from Wikipedia and three-letter codes from squad tables.

const ISO3_TO_ISO2 = {
  ALB: "AL", AND: "AD", ARM: "AM", AUT: "AT", AZE: "AZ", BLR: "BY", BEL: "BE",
  BIH: "BA", BUL: "BG", CRO: "HR", CYP: "CY", CZE: "CZ", DEN: "DK", ENG: "GB",
  EST: "EE", FRO: "FO", FIN: "FI", FRA: "FR", GEO: "GE", GER: "DE", GIB: "GI",
  GRE: "GR", HUN: "HU", ISL: "IS", ISR: "IL", ITA: "IT", KAZ: "KZ", KOS: "XK",
  LBN: "LB", LVA: "LV", LIE: "LI", LTU: "LT", LUX: "LU", MLT: "MT", MDA: "MD", MNE: "ME",
  NED: "NL", MKD: "MK", NIR: "GB", NOR: "NO", POL: "PL", POR: "PT", IRL: "IE",
  ROU: "RO", RUS: "RU", SMR: "SM", SCO: "GB", SEN: "SN", SER: "RS", SLO: "SI",
  SRB: "RS", SVK: "SK", SVN: "SI", SUD: "SD",
  ESP: "ES", SWE: "SE", SUI: "CH", TUR: "TR", UKR: "UA", WAL: "GB",
  ARG: "AR", BOL: "BO", BRA: "BR", CHI: "CL", COL: "CO", ECU: "EC", PAR: "PY",
  PER: "PE", URU: "UY", VEN: "VE",
  CAN: "CA", CRC: "CR", CUB: "CU", CUW: "CW", DOM: "DO", SLV: "SV", GUA: "GT",
  HAI: "HT", HON: "HN", JAM: "JM", MEX: "MX", PAN: "PA", PUR: "PR", TRI: "TT",
  USA: "US", SUR: "SR", NCA: "NI", BLZ: "BZ", BRB: "BB", BER: "BM", GRN: "GD",
  SKN: "KN", LCA: "LC", VIN: "VC", ATG: "AG", DMA: "DM", GUY: "GY",
  ALG: "DZ", ANG: "AO", BEN: "BJ", BOT: "BW", BFA: "BF", BDI: "BI", CMR: "CM",
  CPV: "CV", CTA: "CF", CHA: "TD", COM: "KM", CGO: "CG", COD: "CD", DJI: "DJ",
  EGY: "EG", EQG: "GQ", ERI: "ER", SWZ: "SZ", ETH: "ET", GAB: "GA", GAM: "GM",
  GHA: "GH", GUI: "GN", GNB: "GW", CIV: "CI", KEN: "KE", LES: "LS", LBR: "LR",
  LBY: "LY", MAD: "MG", MWI: "MW", MLI: "ML", MTN: "MR", MRI: "MU", MAR: "MA",
  MOZ: "MZ", NAM: "NA", NIG: "NE", NGA: "NG", NGR: "NG", RWA: "RW", SEY: "SC", SLE: "SL",
  SOM: "SO", RSA: "ZA", SSD: "SS", SDN: "SD", TAN: "TZ", TOG: "TG", TUN: "TN",
  UGA: "UG", ZAM: "ZM", ZIM: "ZW", STP: "ST",
  AFG: "AF", AUS: "AU", BHR: "BH", BAN: "BD", BHU: "BT", BRU: "BN", CAM: "KH",
  CHN: "CN", TPE: "TW", GUM: "GU", HKG: "HK", IND: "IN", IDN: "ID", IRN: "IR",
  IRQ: "IQ", JPN: "JP", JOR: "JO", KUW: "KW", KGZ: "KG", LAO: "LA", LIB: "LB",
  MAC: "MO", MAS: "MY", MDV: "MV", MNG: "MN", MYA: "MM", NEP: "NP", PRK: "KP",
  OMA: "OM", PAK: "PK", PLE: "PS", PHI: "PH", QAT: "QA", KSA: "SA", SGP: "SG",
  KOR: "KR", SRI: "LK", SYR: "SY", TJK: "TJ", THA: "TH", TLS: "TL", TKM: "TM",
  UAE: "AE", UZB: "UZ", VIE: "VN", YEM: "YE", NZL: "NZ", FIJ: "FJ", NCL: "NC",
  PNG: "PG", TAH: "PF", VAN: "VU", SOL: "SB", SAM: "WS", TGA: "TO", COK: "CK"
};

const SPECIAL_CODES = {
  ENG: ["Inghilterra", "🇬🇧"],
  SCO: ["Scozia", "🇬🇧"],
  WAL: ["Galles", "🇬🇧"],
  NIR: ["Irlanda del Nord", "🇬🇧"]
};

const ALIASES = {
  "republic of ireland": "IE",
  ireland: "IE",
  brasil: "BR",
  "serbia and montenegro": "RS",
  "united states of america": "US",
  usa: "US",
  "u.s.": "US",
  "south korea": "KR",
  "korea republic": "KR",
  "republic of korea": "KR",
  "north korea": "KP",
  "korea dpr": "KP",
  "dpr korea": "KP",
  "ivory coast": "CI",
  "cote divoire": "CI",
  "côte d'ivoire": "CI",
  "czech republic": "CZ",
  czechia: "CZ",
  turkey: "TR",
  türkiye: "TR",
  turkiye: "TR",
  "cape verde": "CV",
  "cabo verde": "CV",
  "bosnia and herzegovina": "BA",
  "bosnia & herzegovina": "BA",
  "dr congo": "CD",
  "democratic republic of the congo": "CD",
  "congo dr": "CD",
  "republic of the congo": "CG",
  congo: "CG",
  "east timor": "TL",
  "timor-leste": "TL",
  "chinese taipei": "TW",
  taiwan: "TW",
  macedonia: "MK",
  "north macedonia": "MK",
  swaziland: "SZ",
  eswatini: "SZ",
  burma: "MM",
  myanmar: "MM",
  laos: "LA",
  brunei: "BN",
  kosovo: "XK",
  "united kingdom": "GB",
  "great britain": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  "saint kitts and nevis": "KN",
  "st kitts and nevis": "KN",
  "saint lucia": "LC",
  "st lucia": "LC",
  "saint vincent and the grenadines": "VC",
  "antigua and barbuda": "AG",
  "trinidad and tobago": "TT",
  "united arab emirates": "AE",
  uae: "AE",
  "saudi arabia": "SA",
  "south africa": "ZA",
  "new zealand": "NZ",
  "papua new guinea": "PG",
  "solomon islands": "SB",
  "american samoa": "AS",
  "cook islands": "CK",
  "french polynesia": "PF",
  "new caledonia": "NC"
};

const ITALIAN_OVERRIDES = {
  GB: "Regno Unito",
  US: "Stati Uniti",
  CZ: "Rep. Ceca",
  CI: "Costa d'Avorio",
  KR: "Corea del Sud",
  KP: "Corea del Nord",
  AE: "Emirati Arabi Uniti",
  SA: "Arabia Saudita",
  NL: "Paesi Bassi",
  CD: "RD del Congo",
  CG: "Rep. del Congo",
  BO: "Bolivia",
  VE: "Venezuela",
  TZ: "Tanzania",
  VN: "Vietnam",
  LA: "Laos",
  SY: "Siria",
  IR: "Iran",
  RU: "Russia",
  MD: "Moldavia",
  MK: "Macedonia del Nord",
  BA: "Bosnia ed Erzegovina",
  XK: "Kosovo",
  SZ: "Eswatini",
  TL: "Timor Est",
  CV: "Capo Verde",
  MU: "Mauritius"
};

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let reverseNames = null;
function getReverseNames() {
  if (reverseNames) return reverseNames;
  reverseNames = new Map();
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  for (const iso2 of new Set(Object.values(ISO3_TO_ISO2))) {
    if (!iso2 || iso2 === "XK") continue;
    try {
      const name = display.of(iso2);
      if (name) reverseNames.set(normalize(name), iso2);
    } catch (error) {
      /* Ignore invalid region codes. */
    }
  }
  reverseNames.set("czech republic", "CZ");
  reverseNames.set("ivory coast", "CI");
  reverseNames.set("cape verde", "CV");
  reverseNames.set("turkey", "TR");
  reverseNames.set("united states", "US");
  reverseNames.set("south korea", "KR");
  reverseNames.set("north korea", "KP");
  reverseNames.set("dr congo", "CD");
  reverseNames.set("democratic republic of the congo", "CD");
  return reverseNames;
}

const italianDisplay = new Intl.DisplayNames(["it"], { type: "region" });

function flagFor(iso2) {
  if (!/^[A-Z]{2}$/.test(iso2 || "")) return "🏳️";
  return iso2
    .split("")
    .map((character) => String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65))
    .join("");
}

export function italianLabelFor(iso2) {
  if (SPECIAL_CODES[iso2]) return SPECIAL_CODES[iso2][0];
  if (ITALIAN_OVERRIDES[iso2]) return ITALIAN_OVERRIDES[iso2];
  try {
    return italianDisplay.of(iso2) || iso2;
  } catch (error) {
    return iso2;
  }
}

export function resolveCountry(name, code) {
  const codeKey = String(code || "").trim().toUpperCase();
  const nameKey = normalize(name);

  if (SPECIAL_CODES[codeKey]) {
    return { label: SPECIAL_CODES[codeKey][0], flag: SPECIAL_CODES[codeKey][1], iso2: "GB" };
  }
  if (nameKey === "england") return { label: "Inghilterra", flag: "🇬🇧", iso2: "GB" };
  if (nameKey === "scotland") return { label: "Scozia", flag: "🇬🇧", iso2: "GB" };
  if (nameKey === "wales") return { label: "Galles", flag: "🇬🇧", iso2: "GB" };
  if (nameKey === "northern ireland") return { label: "Irlanda del Nord", flag: "🇬🇧", iso2: "GB" };

  let iso2 = ALIASES[nameKey] || getReverseNames().get(nameKey) || "";
  if (!iso2) iso2 = getReverseNames().get(normalize(code)) || "";
  if (!iso2 && ISO3_TO_ISO2[codeKey]) iso2 = ISO3_TO_ISO2[codeKey];
  if (!iso2 && ISO3_TO_ISO2[nameKey.toUpperCase()]) iso2 = ISO3_TO_ISO2[nameKey.toUpperCase()];

  if (!iso2) return null;
  const special = SPECIAL_CODES[iso2];
  return {
    label: special ? special[0] : italianLabelFor(iso2),
    flag: special ? special[1] : flagFor(iso2),
    iso2
  };
}

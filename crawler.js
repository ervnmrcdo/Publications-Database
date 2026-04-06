const fs = require("node:fs");
const path = require("node:path");

function extractEids(searchJson) {
  const searchResults = searchJson?.["search-results"] ?? {};
  let entries = searchResults.entry ?? [];

  if (!Array.isArray(entries) && entries && typeof entries === "object") {
    entries = [entries];
  }

  return entries.filter((entry) => entry?.eid).map((entry) => entry.eid);
}

async function fetchPublication(eid, headers) {
  const url = `https://api.elsevier.com/content/abstract/eid/${encodeURIComponent(eid)}?view=FULL`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

function ensureList(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parseAuthorName(author) {
  if (!author || typeof author !== "object") {
    return null;
  }

  const indexedName = author["ce:indexed-name"];
  if (indexedName) {
    return indexedName;
  }

  const givenName = author["ce:given-name"];
  const surname = author["ce:surname"];
  const initials = author["ce:initials"];

  if (givenName && surname) {
    return `${givenName} ${surname}`.trim();
  }
  if (surname && initials) {
    return `${surname}, ${initials}`.trim();
  }
  if (surname) {
    return surname;
  }

  return null;
}

function extractAuthors(response) {
  const authorsBlock = response?.authors ?? {};
  const authorEntries = ensureList(authorsBlock.author);

  return authorEntries.map(parseAuthorName).filter(Boolean);
}

function extractPublicationFields(pubData) {
  const response = pubData?.["abstracts-retrieval-response"] ?? {};
  const core = response.coredata ?? {};

  const allAuthors = extractAuthors(response);
  const mainAuthor = allAuthors.length > 0 ? allAuthors[0] : core["dc:creator"];
  const coAuthors = allAuthors.length > 1 ? allAuthors.slice(1) : [];

  return {
    title: core["dc:title"] ?? null,
    date_of_publication: core["prism:coverDate"] ?? null,
    publication_type: core.subtypeDescription ?? null,
    journal: core["prism:publicationName"] ?? null,
    publisher: core["dc:publisher"] ?? null,
    volume: core["prism:volume"] ?? null,
    issue: core["prism:issueIdentifier"] ?? null,
    pages: core["prism:pageRange"] ?? null,
    doi: core["prism:doi"] ?? null,
    citation_count: core["citedby-count"] ?? null,
    main_author: mainAuthor ?? null,
    co_authors: coAuthors,
  };
}

function printPublication(pub, index) {
  console.log(`\nPublication #${index}`);
  console.log("-".repeat(60));
  console.log(`Title: ${pub.title}`);
  console.log(`Date of Publication: ${pub.date_of_publication}`);
  console.log(`Type: ${pub.publication_type}`);
  console.log(`Journal: ${pub.journal}`);
  console.log(`Publisher: ${pub.publisher}`);
  console.log(`Volume: ${pub.volume}`);
  console.log(`Issue: ${pub.issue}`);
  console.log(`Pages: ${pub.pages}`);
  console.log(`DOI: ${pub.doi}`);
  console.log(`Citation Count: ${pub.citation_count}`);
  console.log(`Main Author: ${pub.main_author}`);
  console.log(`Co-Authors: ${pub.co_authors.length ? pub.co_authors.join(", ") : "None"}`);
}

function loadConfig() {
  const configPath = path.join(process.cwd(), "config.json");
  const configRaw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(configRaw);
}

async function main() {
  const config = loadConfig();
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const authorId = args.find((arg) => !arg.startsWith("--"));

  const apikey = config.apikey;
  const insttoken = config.insttoken;

  if (!apikey) {
    throw new Error("Missing 'apikey' in config.json");
  }

  if (!authorId) {
    throw new Error("Missing author ID. Usage: node crawler.js <authorId> [--json]");
  }

  const url = "https://api.elsevier.com/content/search/scopus";
  const headers = {
    Accept: "application/json",
    "X-ELS-APIKey": apikey,
  };

  if (insttoken) {
    headers["X-ELS-Insttoken"] = insttoken;
  }

  const pageSize = 200;
  let allEids = [];
  let start = 0;
  let totalResults = null;
  const failedEids = [];

  if (!jsonOutput) {
    console.log(`Fetching all publications for author ID: ${authorId}`);
  }

  while (totalResults === null || start < totalResults) {
    const params = new URLSearchParams({
      view: "STANDARD",
      query: `AU-ID(${authorId})`,
      count: String(pageSize),
      start: String(start),
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search request failed: HTTP ${response.status}: ${errorText}`);
    }

    const searchResponse = await response.json();
    const pageEids = extractEids(searchResponse);

    if (totalResults === null) {
      totalResults = parseInt(searchResponse?.["search-results"]?.["opensearch:totalResults"] ?? "0", 10);
      if (!jsonOutput) {
        console.log(`Total results found: ${totalResults}`);
      }
    }

    if (!pageEids.length) {
      break;
    }

    allEids = allEids.concat(pageEids);
    if (!jsonOutput) {
      console.log(`Fetched ${pageEids.length} EIDs (total so far: ${allEids.length}/${totalResults})`);
    }

    start += pageSize;
  }

  if (!allEids.length) {
    if (!jsonOutput) {
      console.log("No EIDs found.");
    } else {
      console.log(JSON.stringify({ authorId, totalResults: 0, publications: [], failedEids: [] }));
    }
    return;
  }

  const publications = [];

  for (const eid of allEids) {
    try {
      const pubData = await fetchPublication(eid, headers);
      const limited = extractPublicationFields(pubData);
      publications.push(limited);
    } catch (error) {
      failedEids.push(eid);
      if (!jsonOutput) {
        console.error(`Failed for ${eid}: ${error.message}`);
      }
    }
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify({
        authorId,
        totalResults: totalResults ?? publications.length,
        fetchedEids: allEids.length,
        publications,
        failedEids,
      })
    );
    return;
  }

  publications.forEach((pub, index) => {
    printPublication(pub, index + 1);
  });
}

main().catch((error) => {
  console.error("Crawler failed:", error.message);
  process.exit(1);
});

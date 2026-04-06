import json
import requests


def extract_eids(search_json):
    search_results = search_json.get("search-results", {})
    entries = search_results.get("entry", [])

    if isinstance(entries, dict):
        entries = [entries]

    return [e["eid"] for e in entries if "eid" in e]


def fetch_publication(eid, headers):
    url = f"https://api.elsevier.com/content/abstract/eid/{eid}"
    r = requests.get(
        url,
        headers=headers,
        params={"view": "FULL"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def ensure_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def parse_author_name(author):
    if not isinstance(author, dict):
        return None

    indexed_name = author.get("ce:indexed-name")
    if indexed_name:
        return indexed_name

    given_name = author.get("ce:given-name")
    surname = author.get("ce:surname")
    initials = author.get("ce:initials")

    if given_name and surname:
        return f"{given_name} {surname}".strip()
    if surname and initials:
        return f"{surname}, {initials}".strip()
    if surname:
        return surname
    return None


def extract_authors(response):
    authors_block = response.get("authors", {})
    author_entries = ensure_list(authors_block.get("author"))

    authors = []
    for author in author_entries:
        name = parse_author_name(author)
        if name:
            authors.append(name)

    return authors


def extract_publication_fields(pubData):
    response = pubData.get("abstracts-retrieval-response", {})
    core = response.get("coredata", {})

    all_authors = extract_authors(response)
    main_author = all_authors[0] if all_authors else core.get("dc:creator")
    co_authors = all_authors[1:] if len(all_authors) > 1 else []

    return {
        "title": core.get("dc:title"),
        "date_of_publication": core.get("prism:coverDate"),
        "publication_type": core.get("subtypeDescription"),
        "journal": core.get("prism:publicationName"),
        "publisher": core.get("dc:publisher"),
        "volume": core.get("prism:volume"),
        "issue": core.get("prism:issueIdentifier"),
        "pages": core.get("prism:pageRange"),
        "doi": core.get("prism:doi"),
        "citation_count": core.get("citedby-count"),
        "main_author": main_author,
        "co_authors": co_authors,
    }


def print_publication(pub, index):
    print(f"\nPublication #{index}")
    print("-" * 60)
    print(f"Title: {pub.get('title')}")
    print(f"Date of Publication: {pub.get('date_of_publication')}")
    print(f"Type: {pub.get('publication_type')}")
    print(f"Journal: {pub.get('journal')}")
    print(f"Publisher: {pub.get('publisher')}")
    print(f"Volume: {pub.get('volume')}")
    print(f"Issue: {pub.get('issue')}")
    print(f"Pages: {pub.get('pages')}")
    print(f"DOI: {pub.get('doi')}")
    print(f"Citation Count: {pub.get('citation_count')}")
    print(f"Main Author: {pub.get('main_author')}")
    print(f"Co-Authors: {', '.join(pub.get('co_authors', [])) if pub.get('co_authors') else 'None'}")


with open("config.json", "r") as file:
    config = json.load(file)

apikey = config["apikey"]
insttoken = config.get("insttoken")

author_id = "55615806100"

url = "https://api.elsevier.com/content/search/scopus"

headers = {
    "Accept": "application/json",
    "X-ELS-APIKey": apikey,
}

if insttoken:
    headers["X-ELS-Insttoken"] = insttoken

resp = requests.get(
    url,
    headers=headers,
    params={
        "view": "STANDARD",
        "query": f"AU-ID({author_id})",
        "count": 5,
        "start": 0,
    },
    timeout=30,
)
resp.raise_for_status()

search_response = resp.json()
eids = extract_eids(search_response)

if not eids:
    print("No EIDs found.")
    exit()

publications = []

for eid in eids:
    try:
        pubData = fetch_publication(eid, headers)
        limited = extract_publication_fields(pubData)
        publications.append(limited)
    except requests.HTTPError as e:
        print(f"Failed for {eid}: {e}")
    except Exception as e:
        print(f"Unexpected error for {eid}: {e}")

for i, pub in enumerate(publications, start=1):
    print_publication(pub, i)
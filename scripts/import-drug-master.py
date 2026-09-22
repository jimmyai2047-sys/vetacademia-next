"""One-time importer: Veterinary_Drug_Master_Data.xlsx -> src/lib/drug-master-data.ts
Run: python3 scripts/import-drug-master.py
Source of truth stays in D:\\Preparation for Competitive Examinations\\...
Re-run after every verified Excel update.
"""
import json
import io
import re
import openpyxl

XLSX = r"D:\Preparation for Competitive Examinations\Proforma for Veterinarians\Veterinary_Drug_Master_Data.xlsx"
OUT = "src/lib/drug-master-data.ts"

CATEGORY_HI = {
    "Antibiotics": "एंटीबायोटिक",
    "Anthelmintics-Antiprotozoal": "कृमिनाशक",
    "Ectoparasiticides": "बाह्य परजीवीनाशक",
    "Analgesics-NSAIDs": "दर्द-निवारक (NSAID)",
    "Anticonvulsants": "आक्षेप-रोधी",
    "Anesthetics-Sedatives": "निश्चेतक",
    "Vitamins-Minerals": "विटामिन-खनिज",
    "Fluids-Electrolytes": "फ्लूइड-इलेक्ट्रोलाइट",
    "Diuretics-Cardiac": "मूत्रल-हृदय",
    "Hormones-Reproductive": "हार्मोन-प्रजनन",
    "GI-Drugs": "पाचन तंत्र",
    "Respiratory-Antihistamines": "श्वसन-एंटीहिस्टामिन",
    "Antiseptics-Topical": "एंटीसेप्टिक-स्थानिक",
    "Antidotes-Toxicology": "विषहर-औषधि",
    "Antifungals-Hemostatics": "एंटीफंगल-रक्तस्तंभक",
}

DRUG_SHEETS = list(CATEGORY_HI.keys())


def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def split_list(s):
    # Comma/semicolon split that respects parentheses (e.g. "Horse (GI ulceration, reflux)").
    parts, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(":
            depth += 1
            cur += ch
        elif ch == ")":
            depth = max(0, depth - 1)
            cur += ch
        elif ch in ",;" and depth == 0:
            if clean(cur):
                parts.append(clean(cur))
            cur = ""
        else:
            cur += ch
    if clean(cur):
        parts.append(clean(cur))
    out = []
    for p in parts:
        for q in re.split(r"\s+and\s+|\s+or\s+", p):
            if clean(q):
                out.append(clean(q))
    return out


def parse_withdrawal(s):
    meat, milk = "", ""
    m = re.search(r"[Mm]eat\s*:\s*([^;]+)", s)
    if m:
        meat = clean(m.group(1))
    m = re.search(r"[Mm]ilk\s*:\s*([^;]+)", s)
    if m:
        milk = clean(m.group(1))
    return meat, milk


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    drugs = []
    seen = set()
    did = 0
    for sheet in DRUG_SHEETS:
        ws = wb[sheet]
        rows = [[(str(c).strip() if c is not None else "") for c in r] for r in ws.iter_rows(values_only=True)]
        hdr = next((i for i, r in enumerate(rows) if r and r[0].lower().startswith("s.no")), None)
        if hdr is None:
            continue
        for r in rows[hdr + 1:]:
            if len(r) < 8 or not r[0] or not r[0][0].isdigit():
                continue
            name = clean(r[1])
            key = (sheet + "|" + re.sub(r"\s*\(.*?\)\s*", "", name).strip().lower())
            if key in seen:
                continue
            seen.add(key)
            did += 1
            full = " ".join(r)
            meat, milk = parse_withdrawal(r[5])
            drugs.append({
                "id": f"D{did:03d}",
                "name": name,
                "category": sheet,
                "categoryHi": CATEGORY_HI[sheet],
                "species": split_list(r[2]),
                "dose": clean(r[3]),
                "routes": split_list(r[4]),
                "withdrawalMeat": meat,
                "withdrawalMilk": milk,
                "withdrawalRaw": clean(r[5]),
                "contraindications": clean(r[6]),
                "precautions": clean(r[7]),
                "banned": "BANNED" in full.upper(),
            })
    # Drugs of choice
    ws = wb["Drugs-of-Choice"]
    rows = [[(str(c).strip() if c is not None else "") for c in r] for r in ws.iter_rows(values_only=True)]
    hdr = next((i for i, r in enumerate(rows) if r and r[0].lower().startswith("s.no")), None)
    choices = []
    for r in rows[hdr + 1:]:
        if len(r) < 5 or not r[0] or not r[0][0].isdigit():
            continue
        choices.append({"condition": clean(r[1]), "species": clean(r[2]), "drugs": clean(r[3]), "notes": clean(r[4])})
    # Banned
    ws = wb["Banned-Restricted-Drugs-India"]
    rows = [[(str(c).strip() if c is not None else "") for c in r] for r in ws.iter_rows(values_only=True)]
    hdr = next((i for i, r in enumerate(rows) if r and r[0].lower().startswith("s.no")), None)
    banned = []
    for r in rows[hdr + 1:]:
        if len(r) < 3 or not r[0] or not r[0][0].isdigit():
            continue
        banned.append({"drug": clean(r[1]), "status": clean(r[2]),
                       "reason": clean(r[3]) if len(r) > 3 else "",
                       "alternative": clean(r[4]) if len(r) > 4 else ""})
    # Notes: keep only real glossary rows (short term + non-empty meaning).
    ws = wb["Notes-Abbreviations"]
    rows = [[(str(c).strip() if c is not None else "") for c in r] for r in ws.iter_rows(values_only=True)]
    notes = [{"term": clean(r[0]), "meaning": clean(r[1]) if len(r) > 1 else ""}
             for r in rows
             if clean(r[0]) and len(r) > 1 and clean(r[1]) and len(clean(r[0])) <= 15]

    def ts_str(s):
        return json.dumps(s, ensure_ascii=False)

    parts = []
    parts.append("// AUTO-GENERATED by scripts/import-drug-master.py — DO NOT EDIT.")
    parts.append("// Source: Veterinary_Drug_Master_Data.xlsx (teaching reference ranges; verify labels before clinical use).")
    parts.append("export interface DrugEntry { id: string; name: string; category: string; categoryHi: string; species: string[]; dose: string; routes: string[]; withdrawalMeat: string; withdrawalMilk: string; withdrawalRaw: string; contraindications: string; precautions: string; banned: boolean; }")
    parts.append(f"export const DRUG_COUNT = {len(drugs)};")
    parts.append("export const DRUG_MASTER: DrugEntry[] = " + ts_str(drugs) + ";")
    parts.append("export interface DrugOfChoice { condition: string; species: string; drugs: string; notes: string; }")
    parts.append("export const DRUGS_OF_CHOICE: DrugOfChoice[] = " + ts_str(choices) + ";")
    parts.append("export interface BannedDrug { drug: string; status: string; reason: string; alternative: string; }")
    parts.append("export const BANNED_DRUGS: BannedDrug[] = " + ts_str(banned) + ";")
    parts.append("export interface DrugNote { term: string; meaning: string; }")
    parts.append("export const DRUG_NOTES: DrugNote[] = " + ts_str(notes) + ";")
    cats = sorted(set(d["category"] for d in drugs))
    parts.append("export const DRUG_CATEGORIES: string[] = " + ts_str(cats) + ";")
    io.open(OUT, "w", encoding="utf-8").write("\n".join(parts) + "\n")
    print(f"WROTE {OUT}: {len(drugs)} drugs, {len(choices)} choices, {len(banned)} banned, {len(notes)} notes")


if __name__ == "__main__":
    main()

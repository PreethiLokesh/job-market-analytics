#!/usr/bin/env python3
"""
Import a REAL job-postings CSV into the project's MongoDB (db: jobmarket).

Default column names match the Kaggle dataset "LinkedIn Job Postings (2023 - 2024)" -> postings.csv.
Other datasets work too: override the column names with the --*-col options.

What it does for every row
  * skills  : found by matching the title + description against a vocabulary of ~70 tech skills
  * role    : derived from the job title (Java Developer, Data Engineer, ...)
  * salary  : converted to INR lakhs per annum (LPA)  (see --rate)
  * level   : Entry / Mid / Senior (from the experience-level column, else from the title)
  * city    : first part of the location ("Chicago, IL" -> "Chicago")
Rows that cannot be turned into a useful job (no salary, no tech role, fewer than --min-skills skills)
are skipped, and a summary shows how many were skipped and why.

Examples
  python import_kaggle.py postings.csv --dry-run          # preview only, nothing is written
  python import_kaggle.py postings.csv                    # replace the generated data in MongoDB
  python import_kaggle.py postings.csv --append           # add to the existing data instead
"""
import argparse
import random
import re
import sys
from collections import Counter
from datetime import datetime, timezone

import pandas as pd

# ---------------------------------------------------------------- skills vocabulary
SKILLS = ["Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Next.js", "HTML", "CSS",
          "Redux", "Tailwind", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Snowflake", "AWS", "Azure", "GCP",
          "Docker", "Kubernetes", "Git", "Linux", "Jenkins", "Terraform", "Ansible", "Prometheus", "Spark", "Hadoop",
          "Kafka", "Airflow", "Hive", "ETL", "Tableau", "Power BI", "TensorFlow", "PyTorch", "Pandas", "NumPy",
          "Scikit-learn", "Machine Learning", "Deep Learning", "NLP", "MLOps", "Statistics", "Spring Boot",
          "Microservices", "REST API", "GraphQL", "Django", "Flask", "C++", "C#", ".NET", "Kotlin", "Swift",
          "Android SDK", "Firebase", "Selenium", "Postman", "Jira", "Agile", "Scala", "PHP", "Ruby", "Rust"]
ALIASES = {"reactjs": "React", "react.js": "React", "nodejs": "Node.js", "node js": "Node.js", "nextjs": "Next.js",
           "vuejs": "Vue", "vue.js": "Vue", "k8s": "Kubernetes", "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
           "amazon web services": "AWS", "google cloud": "GCP", "apache spark": "Spark", "pyspark": "Spark",
           "apache kafka": "Kafka", "apache airflow": "Airflow", "apache hive": "Hive", "powerbi": "Power BI",
           "scikit learn": "Scikit-learn", "sklearn": "Scikit-learn", "spring": "Spring Boot", "springboot": "Spring Boot",
           "asp.net": ".NET", "dotnet": ".NET", "rest apis": "REST API", "restful": "REST API", "rest": "REST API",
           "natural language processing": "NLP", "ml": "Machine Learning", "golang": "Go"}
TERMS = {s.lower(): s for s in SKILLS}
TERMS.update({k: v for k, v in ALIASES.items() if v in SKILLS})
SKILL_RE = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(re.escape(t) for t in sorted(TERMS, key=len, reverse=True))
                      + r")(?![A-Za-z0-9+#])", re.I)

ROLES = [  # first match wins
    (r"machine learning|\bml\b|\bai\b engineer|ai/ml", "Machine Learning Engineer"),
    (r"data scien", "Data Scientist"),
    (r"data engineer|\betl\b|big data", "Data Engineer"),
    (r"data analyst|business intelligence|\bbi\b", "Data Analyst"),
    (r"business analyst", "Business Analyst"),
    (r"devops|site reliability|\bsre\b|cloud engineer|platform engineer|infrastructure engineer", "DevOps Engineer"),
    (r"full[- ]?stack", "Full Stack Developer"),
    (r"front[- ]?end|\bui\b developer|react|angular", "Frontend Developer"),
    (r"android|\bios\b|mobile", "Mobile Developer"),
    (r"\bqa\b|quality assurance|test engineer|sdet|tester|automation engineer", "QA Engineer"),
    (r"\bjava\b(?!\s*script)", "Java Developer"),
    (r"\.net|c#|python developer|backend|back[- ]end|software (engineer|developer)|developer|programmer", "Software Engineer"),
]
ROLES = [(re.compile(p, re.I), r) for p, r in ROLES]
PERIOD = {"HOURLY": 2080, "WEEKLY": 52, "BIWEEKLY": 26, "MONTHLY": 12, "YEARLY": 1, "ANNUAL": 1}


def find_skills(text, limit=10):
    seen = []
    for m in SKILL_RE.finditer(text):
        s = TERMS[m.group(1).lower()]
        if s not in seen:
            seen.append(s)
    return seen[:limit]


def find_role(title, keep_all):
    for rx, role in ROLES:
        if rx.search(title):
            return role
    return "Other" if keep_all else None


def find_level(raw, title):
    raw = (raw or "").lower()
    t = title.lower()
    if "intern" in raw or "entry" in raw or re.search(r"\b(junior|jr|intern|trainee|graduate|entry)\b", t): return "Entry"
    if "director" in raw or "executive" in raw or "senior" in raw or re.search(r"\b(senior|sr|lead|principal|staff|head|architect)\b", t): return "Senior"
    return "Mid"


def find_type(raw):
    raw = (raw or "").lower()
    return "Internship" if "intern" in raw else "Contract" if "contract" in raw or "temp" in raw else "Full-time"


def annual_salary(row, salary_col):
    """Yearly salary in the dataset's own currency, or None."""
    if salary_col:
        v = pd.to_numeric(row.get(salary_col), errors="coerce")
        return float(v) if pd.notna(v) and v > 0 else None
    v = pd.to_numeric(row.get("normalized_salary"), errors="coerce")
    if pd.notna(v) and v > 0:
        return float(v)
    lo, hi, med = (pd.to_numeric(row.get(c), errors="coerce") for c in ("min_salary", "max_salary", "med_salary"))
    vals = [x for x in (lo, hi) if pd.notna(x)]
    base = sum(vals) / len(vals) if vals else (med if pd.notna(med) else None)
    if base is None or base <= 0:
        return None
    return float(base) * PERIOD.get(str(row.get("pay_period")).upper(), 1)


def parse_date(v):
    if pd.isna(v):
        return datetime.now(timezone.utc)
    try:
        f = float(v)
        return datetime.fromtimestamp(f / 1000 if f > 1e11 else f, tz=timezone.utc)
    except (TypeError, ValueError):
        d = pd.to_datetime(v, errors="coerce", utc=True)
        return datetime.now(timezone.utc) if pd.isna(d) else d.to_pydatetime()


def clean_city(loc):
    city = str(loc).split(",")[0].strip() if pd.notna(loc) else ""
    if city.lower() in ("", "nan", "united states", "india", "remote", "worldwide", "anywhere"):
        return None
    return city.title()


def main():
    ap = argparse.ArgumentParser(description="Import a real job-postings CSV into MongoDB")
    ap.add_argument("csv")
    ap.add_argument("--mongo-uri", default="mongodb://localhost:27017")
    ap.add_argument("--db", default="jobmarket")
    ap.add_argument("--rate", type=float, default=83.0, help="currency -> INR rate (83 for USD data, 1 if salaries are already INR)")
    ap.add_argument("--salary-col", help="column that already holds a YEARLY salary (skips the LinkedIn min/max/period logic)")
    ap.add_argument("--min-skills", type=int, default=2, help="skip jobs with fewer detected skills (default 2)")
    ap.add_argument("--top-cities", type=int, default=30, help="keep only the N cities with most jobs (default 30)")
    ap.add_argument("--keep-all", action="store_true", help="keep non-tech titles too (role = 'Other')")
    ap.add_argument("--limit", type=int, help="read only the first N rows (for quick tests)")
    ap.add_argument("--append", action="store_true", help="add to existing jobs instead of replacing them")
    ap.add_argument("--dry-run", action="store_true", help="show what would be imported, write nothing")
    for name, default in [("title", "title"), ("desc", "description"), ("company", "company_name"), ("city", "location"),
                          ("date", "listed_time"), ("level", "formatted_experience_level"),
                          ("type", "formatted_work_type"), ("skills", "skills_desc")]:
        ap.add_argument(f"--{name}-col", default=default, help=f"column for {name} (default {default})")
    a = ap.parse_args()

    wanted = {a.title_col, a.desc_col, a.company_col, a.city_col, a.date_col, a.level_col, a.type_col, a.skills_col,
              a.salary_col, "normalized_salary", "min_salary", "max_salary", "med_salary", "pay_period"}
    skipped, docs = Counter(), []
    rows_read = 0
    reader = pd.read_csv(a.csv, chunksize=20000, usecols=lambda c: c in wanted, low_memory=False, nrows=a.limit)
    first = True
    for chunk in reader:
        if first:
            missing = [c for c in (a.title_col, a.city_col) if c not in chunk.columns]
            if missing:
                sys.exit(f"Column(s) not found in the CSV: {missing}. Found: {list(chunk.columns)}\n"
                         f"Use --title-col / --city-col etc. to point to the right columns.")
            first = False
        for row in chunk.to_dict("records"):
            rows_read += 1
            title = str(row.get(a.title_col) or "").strip()
            if not title or title == "nan":
                skipped["no title"] += 1; continue
            role = find_role(title, a.keep_all)
            if not role:
                skipped["not a tech role"] += 1; continue
            salary = annual_salary(row, a.salary_col)
            if salary is None:
                skipped["no salary"] += 1; continue
            lpa = round(salary * a.rate / 100000, 1)
            if not 1 <= lpa <= 300:
                skipped["salary out of range"] += 1; continue
            city = clean_city(row.get(a.city_col))
            if not city:
                skipped["no city"] += 1; continue
            text = " ".join(str(row.get(c) or "") for c in (a.title_col, a.desc_col, a.skills_col))
            skills = find_skills(text)
            if len(skills) < a.min_skills:
                skipped["too few skills found"] += 1; continue
            company = str(row.get(a.company_col) or "").strip()
            if not company or company == "nan":
                company = "Confidential"
            desc = str(row.get(a.desc_col) or "")
            docs.append({"title": title[:120], "role": role, "company": company, "city": city, "skills": skills,
                         "salaryLpa": lpa, "level": find_level(str(row.get(a.level_col) or ""), title),
                         "type": find_type(str(row.get(a.type_col) or "")), "postedAt": parse_date(row.get(a.date_col)),
                         "description": (desc[:400] if desc != "nan" else "")})

    top = {c for c, _ in Counter(d["city"] for d in docs).most_common(a.top_cities)}
    outside = len(docs)
    docs = [d for d in docs if d["city"] in top]
    if outside - len(docs):
        skipped[f"city outside top {a.top_cities}"] += outside - len(docs)

    # ---- summary
    print(f"\nRows read: {rows_read:,}   Jobs ready to import: {len(docs):,}")
    for reason, n in skipped.most_common():
        print(f"  skipped {n:>7,}  {reason}")
    if not docs:
        sys.exit("\nNothing to import. Try --min-skills 1, --keep-all, or check the column names / salary options.")
    print("Top skills:", ", ".join(f"{s} ({n})" for s, n in Counter(s for d in docs for s in d["skills"]).most_common(8)))
    print("Top roles :", ", ".join(f"{s} ({n})" for s, n in Counter(d["role"] for d in docs).most_common(5)))
    print("Cities    :", len(top), "   Salary (LPA) min/max:", min(d["salaryLpa"] for d in docs), "/", max(d["salaryLpa"] for d in docs))
    if a.dry_run:
        print("\nSample job:", {k: v for k, v in docs[0].items() if k != "description"})
        print("\nDry run only - nothing was written.")
        return

    # ---- write to MongoDB
    from pymongo import ASCENDING, DESCENDING, MongoClient
    db = MongoClient(a.mongo_uri, serverSelectionTimeoutMS=5000)[a.db]
    db.command("ping")
    if not a.append:
        db.jobs.delete_many({}); db.companies.delete_many({})
    ids = {}
    for name in sorted({d["company"] for d in docs}):
        ids[name] = f"c{len(ids)}"
    base = db.companies.count_documents({}) if a.append else 0
    if a.append:
        ids = {n: f"c{base + i}" for i, n in enumerate(ids)}
    db.companies.insert_many([{"_id": cid, "name": n, "industry": "General"} for n, cid in ids.items()])
    random.shuffle(docs)
    for d in docs:
        d["companyId"] = ids[d["company"]]
    for i in range(0, len(docs), 5000):
        db.jobs.insert_many(docs[i:i + 5000])
    for field, order in (("skills", ASCENDING), ("city", ASCENDING), ("role", ASCENDING), ("postedAt", DESCENDING)):
        db.jobs.create_index([(field, order)])
    print(f"\nImported {len(docs):,} jobs and {len(ids):,} companies into '{a.db}'.")
    print("Now RESTART the Spring Boot backend so it reloads the skill list.")


if __name__ == "__main__":
    main()

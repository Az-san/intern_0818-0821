import os
import sqlite3
import csv
import json
from typing import List, Optional
from urllib.request import urlopen
from urllib.parse import urlencode

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

APP_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.dirname(APP_DIR)
DB_PATH = os.path.join(APP_DIR, "app.db")

app = FastAPI(title="Itinerary Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_catalog_columns(conn: sqlite3.Connection) -> None:
    cols = {row[1] for row in conn.execute("PRAGMA table_info(catalog_items)")}
    def add(col: str, ddl: str):
        if col not in cols:
            conn.execute(f"ALTER TABLE catalog_items ADD COLUMN {ddl}")
    add("lat", "lat REAL")
    add("lng", "lng REAL")
    add("category", "category TEXT")
    add("staff_pick", "staff_pick INTEGER NOT NULL DEFAULT 0")
    add("indoor", "indoor INTEGER NOT NULL DEFAULT 0")


def init_db() -> None:
    os.makedirs(APP_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS catalog_items (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              duration_min INTEGER NOT NULL,
              price_min INTEGER NOT NULL,
              age_limit INTEGER,
              booking_required INTEGER NOT NULL DEFAULT 0,
              rain_alt_id TEXT
            );
            """
        )
        ensure_catalog_columns(conn)
        # seed if empty
        cur = conn.execute("SELECT COUNT(*) FROM catalog_items")
        (count,) = cur.fetchone()
        if count == 0:
            items = [
                ("r001", "沖縄そば処", "restaurant", 60, 1200, None, 0, None, 26.212, 127.679, "restaurant", 0, 1),
                ("a001", "首里城散策", "activity", 90, 0, None, 0, None, 26.217, 127.719, "sightseeing", 0, 0),
                ("a002", "美ら海水族館", "activity", 120, 2180, None, 1, None, 26.694, 127.877, "aquarium", 1, 1),
                ("r002", "海辺のカフェ", "restaurant", 45, 900, None, 0, None, 26.300, 127.800, "cafe", 0, 1),
            ]
            conn.executemany(
                "INSERT INTO catalog_items (id,name,type,duration_min,price_min,age_limit,booking_required,rain_alt_id,lat,lng,category,staff_pick,indoor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                items,
            )
            conn.commit()

        # customers
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS customers (
              id TEXT PRIMARY KEY,
              adults INTEGER,
              children INTEGER,
              seniors INTEGER,
              stroller INTEGER,
              wheelchair INTEGER
            )
            """
        )
        # try seed from data/customer.csv if empty
        (ccount,) = conn.execute("SELECT COUNT(*) FROM customers").fetchone()
        if ccount == 0:
            csv_path = os.path.join(ROOT_DIR, "data", "customer.csv")
            if os.path.exists(csv_path):
                with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
                    reader = csv.DictReader(f)
                    rows = []
                    for row in reader:
                        cid = row.get("顧客ID") or row.get("GUEST_ID")
                        if not cid:
                            continue
                        age = int(row.get("年齢") or 0)
                        seniors = 1 if age >= 65 else 0
                        # parse 同行者情報 JSON string
                        children = 0
                        try:
                            comp = row.get("同行者情報") or ""
                            if comp:
                                data = json.loads(comp)
                                children = sum(1 for c in data if (c.get("relationship") == "child"))
                                # partner counts as adult
                                adults = 1 + sum(1 for c in data if (c.get("relationship") == "partner"))
                            else:
                                adults = 1
                        except Exception:
                            adults = 1
                        # stroller/wheelchair flags (heuristic)
                        notes = row.get("特記事項") or ""
                        stroller = 1 if ("ベビーカー" in notes) else 0
                        wheelchair = 1 if ("車椅子" in notes or "車いす" in notes) else 0
                        rows.append((cid, adults, children, seniors, stroller, wheelchair))
                    if rows:
                        conn.executemany("INSERT OR REPLACE INTO customers (id,adults,children,seniors,stroller,wheelchair) VALUES (?,?,?,?,?,?)", rows)
                        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
async def on_startup():
    init_db()


@app.get("/healthz")
async def healthz():
    return {"ok": True}


@app.get("/catalog/items")
async def get_catalog_items(
    type: Optional[str] = Query(None, description="restaurant|activity|hotel"),
    q: Optional[str] = Query(None, description="keyword"),
):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        sql = "SELECT * FROM catalog_items"
        params: List[object] = []
        conds: List[str] = []
        if type:
            conds.append("type = ?")
            params.append(type)
        if q:
            conds.append("(name LIKE ?)")
            params.append(f"%{q}%")
        if conds:
            sql += " WHERE " + " AND ".join(conds)
        sql += " ORDER BY id"
        rows = conn.execute(sql, params).fetchall()
        def to_camel(r: sqlite3.Row):
            return {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "durationMin": r["duration_min"],
                "priceMin": r["price_min"],
                "ageLimit": r["age_limit"],
                "bookingRequired": bool(r["booking_required"]),
                "rainAltId": r["rain_alt_id"],
                "lat": r["lat"],
                "lng": r["lng"],
                "category": r["category"],
                "staffPick": bool(r["staff_pick"]),
                "indoor": bool(r["indoor"]),
            }
        return [to_camel(r) for r in rows]
    finally:
        conn.close()


@app.get("/customers/{customer_id}")
async def get_customer(customer_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
        if not row:
            return {"id": customer_id, "adults": 2, "children": 0, "seniors": 0, "stroller": False, "wheelchair": False}
        return {
            "id": row["id"],
            "adults": row["adults"],
            "children": row["children"],
            "seniors": row["seniors"],
            "stroller": bool(row["stroller"]),
            "wheelchair": bool(row["wheelchair"]),
        }
    finally:
        conn.close()


@app.get("/weather/current")
async def weather_current(lat: float = 26.212, lon: float = 127.679):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation"
    }
    url = "https://api.open-meteo.com/v1/forecast?" + urlencode(params)
    with urlopen(url) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    cur = data.get("current", {})
    temp = cur.get("temperature_2m")
    humidity = cur.get("relative_humidity_2m")
    precip = cur.get("precipitation")
    raining = (precip or 0) > 0.0
    if temp is None:
        feel = "unknown"
    else:
        t = float(temp)
        feel = "😞" if t <= 10 else "🙁" if t <= 15 else "😐" if t <= 22 else "🙂" if t <= 28 else "😄"
    return {"temperatureC": temp, "humidity": humidity, "raining": raining, "feelsIcon": feel}


@app.get("/media/photo")
async def media_photo(query: str):
    # 1) Try Openverse (no key)
    try:
        oparams = {"q": query, "page_size": 1}
        ourl = "https://api.openverse.engineering/v1/images/?" + urlencode(oparams)
        with urlopen(ourl) as resp:
            odata = json.loads(resp.read().decode("utf-8"))
        results = odata.get("results") or []
        if results:
            first = results[0]
            url = first.get("thumbnail") or first.get("url")
            if url:
                return {"url": url}
    except Exception:
        pass

    # 2) Fallback to Wikipedia (ja -> en)
    def search(lang: str) -> Optional[str]:
        api = f"https://{lang}.wikipedia.org/w/api.php"
        q = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": 1,
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": 160,
            "format": "json",
            "origin": "*",
        }
        url = api + "?" + urlencode(q)
        with urlopen(url) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        pages = (data.get("query", {}) or {}).get("pages", {})
        for _, p in pages.items():
            thumb = (p.get("thumbnail") or {}).get("source")
            if thumb:
                return thumb
        return None

    wurl = search("ja") or search("en")
    return {"url": wurl}

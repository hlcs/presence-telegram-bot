import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

let db;

export function get_db() {
  if (db == undefined) {
    db = new DB("./db/presencebot.db");
    db.execute(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status bool
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    UNIQUE(telegram_id)
    );`);
  }
  return db;
}

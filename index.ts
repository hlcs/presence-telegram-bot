import "https://deno.land/std@0.180.0/dotenv/load.ts";

import {
  BotCommand,
  TelegramBot,
  UpdateType,
} from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";


const TOKEN_TELEGRAM = Deno.env.get("TOKEN_TELEGRAM");
let POLLING_INTERVAL = Deno.env.get("POLLING_INTERVAL");
const GET_LAB_STATE_ENDPOINT = Deno.env.get("GET_LAB_STATE_ENDPOINT");
const GET_LAB_HISTORY_ENDPOINT = Deno.env.get("GET_LAB_HISTORY_ENDPOINT");
let HISTORY_INTERVAL = Deno.env.get("HISTORY_INTERVAL");
console.log("keys", TOKEN_TELEGRAM, POLLING_INTERVAL, GET_LAB_STATE_ENDPOINT, GET_LAB_HISTORY_ENDPOINT);
if (!TOKEN_TELEGRAM) throw new Error("Bot token is not provided");
if (!POLLING_INTERVAL) throw new Error("Polling interval is not provided");
if (!GET_LAB_STATE_ENDPOINT) throw new Error("Get lab state endpoint is not provided");
if (!GET_LAB_HISTORY_ENDPOINT) throw new Error("Get lab history endpoint is not provided");
if (!HISTORY_INTERVAL) throw new Error("History interval is not provided");
POLLING_INTERVAL = parseInt(POLLING_INTERVAL);
HISTORY_INTERVAL = parseInt(HISTORY_INTERVAL);
interface ResponseLab {
  description: "open"| "closed";
  id: 0 | 1;
}

const db = new DB("./db/presencebot.db");
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
    );
`);

let contatore = 0;
function generataRisposta(id: number, nome?:string): string {
    
  const date = new Date().toLocaleString("it", { timeZone: "Europe/Rome" });
  const formattedDate = date;
  if(id == 1 && nome != undefined)
    return  "Il laboratorio è stato aperto alle " + formattedDate + " da " + nome;
  
  else if (id === 1) 
    return  "Il laboratorio è stato aperto alle " + formattedDate + " con la chiave";
   else 
    return "Il laboratorio è stato chiuso alle " + formattedDate;
  
}

const getCurrentLabState = async () => {
    contatore++;
    console.log("Contatore",contatore)
    console.log("Polling jj", new Date())

  const raw = await fetch(GET_LAB_STATE_ENDPOINT);
  const json: ResponseLab = await raw.json();
  const rispostaValoreAPI = json.id;
  console.log(json);
  const lastState = await db.query(
    "SELECT status FROM logs ORDER BY id DESC LIMIT 1"
  );


  if (lastState.length === 0 || lastState[0][0] !== rispostaValoreAPI) {
    await db.query("INSERT INTO logs (status) VALUES (?)", [rispostaValoreAPI]);
    const users = await db.query("SELECT telegram_id FROM users");
    //console.log(users);
    const rawFetchApetureOnline = await fetch(GET_LAB_HISTORY_ENDPOINT);
    const jsonFetchApetureOnline = await rawFetchApetureOnline.json();
    //console.log(jsonFetchApetureOnline)
    let nome = undefined;
    const dataAttuale = new Date();
    dataAttuale.setHours(dataAttuale.getHours()+2)
    const dataApetura =new Date(jsonFetchApetureOnline[0].time);
    //console.log(dataAttuale-dataApetura)
    //console.log("data attuale",dataAttuale)
    //console.log("data apertura",dataApetura)
    //console.log("Risultato calcolo",dataAttuale-dataApetura < HISTORY_INTERVAL)
    if(dataAttuale-dataApetura < HISTORY_INTERVAL){
        nome = jsonFetchApetureOnline[0].user;
    }
    //console.log(nome);
    for (const user of users) {
      bot.sendMessage({
        chat_id: user[0],
        text: generataRisposta(rispostaValoreAPI,nome),
      });
    }
  }
};

const bot = new TelegramBot(TOKEN_TELEGRAM);

bot.run({
    polling: true,
})
bot.on(
    UpdateType.Error,
    ({ error }) => console.error("Glitch in the Matrix", error.stack),
  );
  
bot.on(UpdateType.Message, async ({ message }) => {
  console.log(message);
  if (message?.text === "/start") {
    let lastState;
    
    try {
    let lastState = await db.query(
      "SELECT status FROM logs ORDER BY id DESC LIMIT 1"
    )[0][0];
    }
    catch(e){
    }
    const stringaStato =
      lastState === 1
        ? "Il laboratorio è aperto attualmente"
        : "Il laboratorio è chiuso attualmente";
    console.log("start");
    console.log(message.from.id);
    try {
      db.query("INSERT INTO users (telegram_id) VALUES (?)", [message.from.id]);
      bot.sendMessage({
        chat_id: message.chat.id,
        text: "Ciao, sono il bot HLCS. Ti avviserò quando il laboratorio sarà aperto o chiuso. \n"+stringaStato,
      });
    
    } catch (e) {
      bot.sendMessage({
        chat_id: message.chat.id,
        text: "Ciao, sono il bot HLCS. Ti avviserò quando il laboratorio sarà aperto o chiuso, ti notifico che eri già iscritto \n"+stringaStato,
      });
     
    }
  }
});

setTimeout(() => {
    console.log("Bot Avviato")

    setInterval(getCurrentLabState, POLLING_INTERVAL);
    //getCurrentLabState();

}, 7000);


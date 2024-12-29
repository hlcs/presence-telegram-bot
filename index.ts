import "https://deno.land/std@0.180.0/dotenv/load.ts";

import {
  TelegramBot,
  UpdateType,
} from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";

import { get_db } from "./src/db.ts";
import { get_env } from "./src/env.ts";
import { ResponseLab } from "./src/interface.ts";







const env = get_env();
const db = get_db();
function generataRisposta(id: number, nome?: string): string {
  const date = new Date().toLocaleString("it", { timeZone: "Europe/Rome" });
  const formattedDate = date;
  if (id == 1 && nome != undefined)
    return (
      "Il laboratorio è stato aperto " + formattedDate + " da " + nome
    );
  else if (id === 1)
    return (
      "Il laboratorio è stato aperto " + formattedDate + " con la chiave"
    );
  else return "Il laboratorio è stato chiuso " + formattedDate;
}

const getCurrentLabState = async () => {
  try {
    const raw = await fetch(env.GET_LAB_STATE_ENDPOINT);
    const json: ResponseLab = await raw.json();
    const rispostaValoreAPI = json.id;
    console.log(json);
    const lastState = await db.query(
      "SELECT status FROM logs ORDER BY id DESC LIMIT 1"
    );

    if (lastState.length === 0 || lastState[0][0] !== rispostaValoreAPI) {
      await db.query("INSERT INTO logs (status) VALUES (?)", [
        rispostaValoreAPI,
      ]);
      const users = await db.query("SELECT telegram_id FROM users");
      const rawFetchApetureOnline = await fetch(env.GET_LAB_HISTORY_ENDPOINT);
      const jsonFetchApetureOnline = await rawFetchApetureOnline.json();
      let nome = undefined;
      const dataAttuale = new Date() as any;
      const dataApetura = new Date(jsonFetchApetureOnline[0].time+env.TIMEZONE_OFFSET) as any;
      if ((dataAttuale - dataApetura) < env.HISTORY_INTERVAL) {
        nome = jsonFetchApetureOnline[0].user;
      }
      //console.log(nome);
      for (const user of users) {
        bot.sendMessage({
          chat_id: user[0],
          text: generataRisposta(rispostaValoreAPI, nome),
        });
      }
    }
  } catch (_) {}
};

const bot = new TelegramBot(env.TOKEN_TELEGRAM);

bot.run({
  polling: true,
});
bot.on(UpdateType.Error, ({ error }) =>
  console.error("Glitch in the Matrix", error.stack)
);

bot.on(UpdateType.Message, async ({ message }) => {
  console.log(message);
  if (message?.text === "/start") {
    let lastState;

    try {
      if(env.DEBUG){console.log("Inizio recupero logs nel db");}
      lastState = await db.query(
        "SELECT status FROM logs ORDER BY id DESC LIMIT 1"
      )[0][0];
      if(env.DEBUG){console.log("Fine recupero logs nel db");}

    } catch (_) {}
    const stringaStato =
      lastState === 1
        ? "Il laboratorio è aperto attualmente"
        : "Il laboratorio è chiuso attualmente";
    console.log("start");
    console.log(message!.from!.id);
    try {
      if(env.DEBUG){console.log("Inizio insert utente nel db");}
      db.query("INSERT INTO users (telegram_id) VALUES (?)", [
        message!.from!.id,
      ]);
      if(env.DEBUG){console.log("Fine insert utente nel db");}

      if(env.DEBUG){console.log("Inizio invio messaggio");}
      bot.sendMessage({
        chat_id: message.chat.id,
        text:
          "Ciao, sono il bot HLCS. Ti avviserò quando il laboratorio sarà aperto o chiuso. \n" +
          stringaStato,
      });
      if(env.DEBUG){
        console.log("Fine invio messaggio");
      }
    } catch (_) {
      if(env.DEBUG){
        console.log("Inizio invio messaggio");
      }
      bot.sendMessage({
        chat_id: message.chat.id,
        text:
          "Ciao, sono il bot HLCS. Ti avviserò quando il laboratorio sarà aperto o chiuso, ti notifico che eri già iscritto \n" +
          stringaStato,
      });
      if(env.DEBUG){
        console.log("Fine invio messaggio");
      }
    }
  }
});

setTimeout(() => {
  console.log("Bot Avviato");

  setInterval(getCurrentLabState, env.POLLING_INTERVAL);
  //getCurrentLabState();
}, 7000);

export function get_env() {
  const TOKEN_TELEGRAM = Deno.env.get("TOKEN_TELEGRAM");
  const POLLING_INTERVAL = Deno.env.get("POLLING_INTERVAL");
  const GET_LAB_STATE_ENDPOINT = Deno.env.get("GET_LAB_STATE_ENDPOINT");
  const GET_LAB_HISTORY_ENDPOINT = Deno.env.get("GET_LAB_HISTORY_ENDPOINT");
  const HISTORY_INTERVAL = Deno.env.get("HISTORY_INTERVAL");
  const TIMEZONE_OFFSET = Deno.env.get("TIMEZONE_OFFSET");
  const DEBUG = Deno.env.get("DEBUG");
  console.log(
    "keys",
    TOKEN_TELEGRAM,
    POLLING_INTERVAL,
    GET_LAB_STATE_ENDPOINT,
    GET_LAB_HISTORY_ENDPOINT,
    TIMEZONE_OFFSET
  );
  if (!TOKEN_TELEGRAM) throw new Error("Bot token is not provided");
  if (!POLLING_INTERVAL) throw new Error("Polling interval is not provided");
  if (!GET_LAB_STATE_ENDPOINT)
    throw new Error("Get lab state endpoint is not provided");
  if (!GET_LAB_HISTORY_ENDPOINT)
    throw new Error("Get lab history endpoint is not provided");
  if (!HISTORY_INTERVAL) throw new Error("History interval is not provided");

  return {
    TOKEN_TELEGRAM,
    POLLING_INTERVAL:parseInt(POLLING_INTERVAL),
    GET_LAB_STATE_ENDPOINT,
    GET_LAB_HISTORY_ENDPOINT,
    HISTORY_INTERVAL:parseInt(HISTORY_INTERVAL),
    TIMEZONE_OFFSET,
    DEBUG
  };
}

import { encodeToBase64 } from "./utils";

const INGESTOR_URL = "https://events.userlens.io";

export const track = (teamUuid, body) => {
  const encodedTeamUuid = encodeToBase64(`${teamUuid}:`);

  return fetch(`${INGESTOR_URL}/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedTeamUuid}`,
    },
    body: JSON.stringify(body),
  });
};

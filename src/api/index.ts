import type { eventWithTime } from "rrweb";

const MAIN_BASE_URL = "https://events.userlens.io";
const RAW_BASE_URL = "https://raw.userlens.io";
const SESSIONS_BASE_URL = "https://sessions.userlens.io";

import { PushedEvent, PageViewEvent, RawEvent } from "../types";

const getWriteCode = () => {
  const code = window.localStorage.getItem("$ul_WRITE_CODE");
  return code;
};

export const identify = async (user: {
  userId: string;
  traits: Record<string, any>;
}) => {
  if (!user?.userId) return;

  const userId = user.userId;
  const traits = user?.traits;

  const body = {
    type: "identify",
    userId: userId,
    source: "userlens-js-analytics-sdk",
    traits,
  };
  const res = await fetch(`${MAIN_BASE_URL}/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${getWriteCode()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to identify");

  return "ok";
};

export const track = async (
  events: (PushedEvent | PageViewEvent | RawEvent)[]
) => {
  const body = {
    events,
  };

  const res = await fetch(`${RAW_BASE_URL}/raw/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${getWriteCode()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to track");

  return "ok";
};

export const uploadSessionEvents = async (
  userId: string,
  sessionUuid: string,
  events: eventWithTime[],
  chunkTimestamp: number
) => {
  const body = {
    userId: userId,
    chunk_timestamp: chunkTimestamp,
    payload: events,
  };

  const res = await fetch(`${SESSIONS_BASE_URL}/session/${sessionUuid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${getWriteCode()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to track");

  return "ok";
};

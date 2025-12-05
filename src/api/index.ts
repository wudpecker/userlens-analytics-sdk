const MAIN_BASE_URL = "https://events.userlens.io";
const RAW_BASE_URL = "https://raw.userlens.io";

import { PushedEvent, PageViewEvent, RawEvent } from "../types";

const getWriteCode = (): string | null => {
  try {
    const raw = window.localStorage.getItem("$ul_WRITE_CODE");
    if (raw == null) return null;

    const val = raw.trim();
    if (!val) return null;

    const lower = val.toLowerCase();
    if (lower === "null" || lower === "undefined") return null;

    return val;
  } catch {
    return null;
  }
};

export const identify = async (
  user: {
    userId: string | number;
    traits: Record<string, any>;
  },
  debug: boolean = false
) => {
  if (!user?.userId) return;

  const writeCode = getWriteCode();
  if (!writeCode) {
    if (debug) {
      console.error(
        "Failed to identify user: Userlens SDK error: WRITE_CODE is not set"
      );
    }
    return;
  }

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
      Authorization: `Basic ${writeCode}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to identify");

  return "ok";
};

export const group = async (
  group: {
    groupId: string | number;
    traits: Record<string, any> | undefined;
    userId?: string;
  },
  debug: boolean = false
) => {
  if (!group?.groupId) return;
  const writeCode = getWriteCode();
  if (!writeCode) {
    if (debug) {
      console.error(
        "Failed to group identify: Userlens SDK error: WRITE_CODE is not set"
      );
    }
    return;
  }

  const { groupId, userId, traits: groupTraits } = group;

  const body = {
    type: "group",
    groupId,
    source: "userlens-js-analytics-sdk",
    ...(userId && { userId }),
    ...(groupTraits && { traits: groupTraits }),
  };

  const res = await fetch(`${MAIN_BASE_URL}/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${writeCode}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to identify");

  return "ok";
};

export const track = async (
  events: (PushedEvent | PageViewEvent | RawEvent)[],
  debug: boolean = false
) => {
  const writeCode = getWriteCode();
  if (!writeCode) {
    if (debug) {
      console.error(
        "Failed to group identify: Userlens SDK error: WRITE_CODE is not set"
      );
    }
    return;
  }

  const body = {
    events,
  };

  const res = await fetch(`${RAW_BASE_URL}/raw/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${writeCode}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Userlens HTTP error: failed to track");

  return "ok";
};

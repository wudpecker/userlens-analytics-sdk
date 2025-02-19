const encodeToBase64 = (str) => {
  return btoa(str);
};

const INGESTOR_URL = "https://events.userlens.io";

const track = (teamUuid, body) => {
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

class EventTracker {
  constructor(writeCode = "", userId = "") {
    if (!writeCode || !userId) {
      console.error(
        "Userlens EventTracker error: missing writeCode or userId."
      );
    }

    this.writeCode = writeCode;
    this.userId = userId;
  }

  // private method to validate traits object
  #validateTraits(traits = {}) {
    if (typeof traits !== "object") {
      console.error(
        "Userlens identifyUser error: Invalid traits object:",
        traits
      );
      return false;
    }
  }

  identifyUser(traits = {}) {
    if (!this.#validateTraits(traits)) return;

    return track(this.writeCode, {
      type: "identify",
      userId: this.userId,
      traits,
    });
  }

  // method to track an event
  trackEvent(eventName = "", traits = {}) {
    if (!eventName) {
      console.error("Userlens trackEvent error: Event name is required");
      return;
    }

    if (!this.userId) {
      console.error("Userlens trackEvent error: User ID is required");
      return;
    }

    return Promise.all([
      track(this.writeCode, {
        type: "track",
        userId: this.userId,
        event: eventName,
        timestamp: new Date().toISOString(),
        source: "userlens-analytics-sdk",
      }),
      this.identifyUser(traits).catch((err) => {
        console.error("Userlens trackEvent error:", err);
      }),
    ]);
  }
}

export { EventTracker as default };

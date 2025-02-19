'use strict';

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
  constructor(writeCode) {
    if (!writeCode) {
      console.error(
        "Userlens EventTracker error: missing writeCode or userId."
      );
    }

    this.writeCode = writeCode;
  }

  #validateTraits(traits) {
    return typeof traits === "object";
  }

  identifyUser(userId, traits = {}) {
    if (!userId) {
      try {
        console.error(
          "Userlens identifyUser error: User ID is required. Received:",
          userId
        );
      } catch (err) {
        console.error("Userlens identifyUser error:", err);
      }
      return Promise.resolve(); // Avoid returning undefined
    }

    if (!this.#validateTraits(traits)) {
      console.error(
        "Userlens identifyUser error: Invalid traits object:",
        traits
      );
      return Promise.resolve();
    }

    return track(this.writeCode, {
      type: "identify",
      userId,
      traits,
    }).catch((err) => {
      console.error("Userlens identifyUser error:", err);
    });
  }

  trackEvent(userId, eventName = "", traits = {}) {
    if (!eventName) {
      console.error("Userlens trackEvent error: Event name is required");
      return Promise.resolve();
    }

    if (!userId) {
      console.error("Userlens trackEvent error: User ID is required");
      return Promise.resolve();
    }

    return Promise.all([
      track(this.writeCode, {
        type: "track",
        userId,
        event: eventName,
        timestamp: new Date().toISOString(),
        source: "userlens-analytics-sdk-node",
      }).catch((err) => {
        console.error("Userlens trackEvent error:", err);
      }),

      this.identifyUser(userId, traits).catch((err) => {
        console.error("Userlens trackEvent error:", err);
      }),
    ]);
  }
}

module.exports = EventTracker;
//# sourceMappingURL=index.cjs.map

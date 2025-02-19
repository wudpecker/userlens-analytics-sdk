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
  constructor(writeCode, userId = "", identifyOnTrack = false) {
    if (!writeCode || !userId) {
      console.error(
        "Userlens EventTracker error: missing writeCode or userId."
      );
    }

    this.writeCode = writeCode;
    this.userId = userId;
    this.identifyOnTrack = identifyOnTrack;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  setWriteCode(writeCode) {
    this.writeCode = writeCode;
  }

  // private method to validate traits object
  #validateTraits(traits) {
    if (!traits || typeof traits !== "object" || Array.isArray(traits)) {
      console.error("Userlens SDK error: Invalid traits object:", traits);
      return false;
    }

    return Object.keys(traits).length > 0; // Return true if traits is not empty
  }

  identifyUser(traits = {}) {
    if (this.#validateTraits(traits)) {
      track(this.writeCode, {
        type: "identify",
        userId: this.userId,
        traits,
      });
    }
  }

  // method to track an event
  trackEvent(eventName = "", traits = {}) {
    if (!eventName) {
      console.error("Userlens trackEvent error: Event name is required");
      return;
    }

    track(this.writeCode, {
      type: "track",
      userId: this.userId,
      event: eventName,
      timestamp: new Date().toISOString(),
      source: "userlens-analytics-sdk",
    });

    if (this.identifyOnTrack) {
      this.identifyUser(traits);
    }
  }
}

export { EventTracker as default };

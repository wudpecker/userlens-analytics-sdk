import { track } from "./api";

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
    if (typeof userId !== "string" && typeof userId !== "number") {
      console.error(
        "Userlens identifyUser error: User ID must be a string or a number"
      );
      return Promise.resolve();
    }

    if (typeof userId === "string" && userId.trim() === "") {
      console.error(
        "Userlens identifyUser error: User ID cannot be an empty string."
      );
      return Promise.resolve();
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

    if (typeof userId !== "string" && typeof userId !== "number") {
      console.error(
        "Userlens identifyUser error: User ID must be a string or a number"
      );
      return Promise.resolve();
    }

    if (typeof userId === "string" && userId.trim() === "") {
      console.error(
        "Userlens identifyUser error: User ID cannot be an empty string."
      );
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

export default EventTracker;

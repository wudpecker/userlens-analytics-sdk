import { track } from "./api";

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

    if (typeof this.userId !== "string" && typeof this.userId !== "number") {
      console.error(
        "Userlens identifyUser error: User ID must be a string or a number"
      );
      return Promise.resolve();
    }

    if (typeof this.userId === "string" && this.userId.trim() === "") {
      console.error(
        "Userlens identifyUser error: User ID cannot be an empty string."
      );
      return Promise.resolve();
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

export default EventTracker;

// import { track } from "./api";

// class EventTracker {
//   constructor(writeCode) {
//     if (!writeCode) {
//       console.error(
//         "Userlens EventTracker error: missing writeCode or userId."
//       );
//     }

//     this.writeCode = writeCode;
//   }

//   // private method to validate traits object
//   #validateTraits(traits) {
//     if (!traits || typeof traits !== "object" || Array.isArray(traits)) {
//       console.error("Userlens SDK error: Invalid traits object:", traits);
//       return false;
//     }

//     return Object.keys(traits).length > 0; // Return true if traits is not empty
//   }

//   identifyUser(userId, traits = {}) {
//     if (!userId) {
//       console.error("Userlens identifyUser error: User ID is required");
//       return;
//     }

//     if (!this.#validateTraits(traits)) {
//       return;
//     }

//     track(this.writeCode, {
//       type: "identify",
//       userId: userId,
//       traits,
//     });
//   }

//   // method to track an event
//   trackEvent(userId, eventName = "", traits = {}) {
//     if (!eventName) {
//       console.error("Userlens trackEvent error: Event name is required");
//       return;
//     }

//     if (!userId) {
//       console.error("Userlens trackEvent error: User ID is required");
//       return;
//     }

//     track(this.writeCode, {
//       type: "track",
//       userId: userId,
//       event: eventName,
//       timestamp: new Date().toISOString(),
//       source: "userlens-analytics-sdk-node",
//     });

//     this.identifyUser(userId, traits);
//   }
// }

// export default EventTracker;
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

export default EventTracker;

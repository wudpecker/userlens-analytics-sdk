import { record as rrwebRecord } from "rrweb";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

export default class SessionRecorder {
  #trackEventsThrottled;

  constructor({ WRITE_CODE, userId, recordingOptions = {} }) {
    if (typeof window === "undefined") {
      console.error(
        "Userlens SDK error: unavailable outside of browser environment."
      );
    }

    if (!WRITE_CODE?.trim() || typeof WRITE_CODE !== "string") {
      throw new Error(
        "Userlens SDK Error: WRITE_CODE is required and must be a string"
      );
    }

    if (!userId?.trim() || typeof userId !== "string") {
      console.error(
        "Userlens SDK Error: userId is required to identify session user."
      );
    }

    const {
      TIMEOUT = 30 * 60 * 1000,
      BUFFER_SIZE = 10,
      maskingOptions = ["passwords"],
    } = recordingOptions;

    this.WRITE_CODE = btoa(`${WRITE_CODE}:`);
    this.userId = userId;
    this.TIMEOUT = TIMEOUT;
    this.BUFFER_SIZE = BUFFER_SIZE;
    this.maskingOptions = maskingOptions;

    this.sessionEvents = [];

    this.#trackEventsThrottled = this.#throttle(() => {
      this.#trackEvents();
    }, 5000);

    this.#initRecorder();
  }

  #initRecorder() {
    if (this.rrwebControl) return;

    this.#createSession();

    this.rrwebControl = rrwebRecord({
      emit: (event) => {
        this.#handleEvent(event);
      },
      maskAllInputs: this.maskingOptions.includes("all"),
      maskInputOptions: { password: this.maskingOptions.includes("passwords") },
      plugins: [getRecordConsolePlugin()],
    });

    this.#initFocusListener();
  }

  #initFocusListener() {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState) {
        takeFullSnapshot();
      }
    });
  }

  #throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  #handleEvent(event) {
    const now = Date.now();
    const lastActive = Number(
      localStorage.getItem("userlensSessionLastActive")
    );

    // check inactivity timeout
    if (lastActive && now - lastActive > this.TIMEOUT) {
      this.#resetSession();
    }

    localStorage.setItem("userlensSessionLastActive", now);

    this.sessionEvents.push(event);

    if (this.sessionEvents.length >= this.BUFFER_SIZE) {
      this.#trackEventsThrottled();
    }
  }

  #resetSession() {
    localStorage.removeItem("userlensSessionUuid");
    localStorage.removeItem("userlensSessionLastActive");

    this.#createSession();
  }

  #createSession() {
    const lastActive = Number(
      localStorage.getItem("userlensSessionLastActive")
    );
    const storedUuid = localStorage.getItem("userlensSessionUuid");

    const now = Date.now();
    const isExpired = !lastActive || now - lastActive > this.TIMEOUT;

    if (!storedUuid || isExpired) {
      this.sessionUuid = this.#generateSessionUuid();
      localStorage.setItem("userlensSessionUuid", this.sessionUuid);
    } else {
      this.sessionUuid = storedUuid;
    }

    localStorage.setItem("userlensSessionLastActive", now);
  }

  #generateSessionUuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }

  async #trackEvents() {
    const chunkTimestamp =
      this.sessionEvents[this.sessionEvents.length - 1]?.timestamp;

    const payload = [...this.sessionEvents];
    this.#clearEvents();

    try {
      await fetch(`https://sessions.userlens.io/session/${this.sessionUuid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${this.WRITE_CODE}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          chunk_timestamp: chunkTimestamp,
          payload,
        }),
      });
    } catch (err) {
      console.error("Userlens SDK: Failed to send session events:", err);
    }
  }

  #clearEvents() {
    this.sessionEvents = [];
  }
}

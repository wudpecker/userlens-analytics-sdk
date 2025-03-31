import { record as rrwebRecord } from "rrweb";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

export default class SessionRecorder {
  constructor({
    WRITE_CODE,
    userId,
    TIMEOUT = 30 * 60 * 1000,
    BUFFER_SIZE = 50,
    maskingOptions = ["passwords"], // "passwords", "all"
  }) {
    if (typeof window === "undefined") {
      console.error(
        "Userlens EventCollector error: unavailable outside of browser environment."
      );
    }

    if (!WRITE_CODE?.trim() || typeof WRITE_CODE !== "string") {
      throw new Error(
        "Userlens SDK Error: WRITE_CODE is required and must be a string"
      );
    }

    this.WRITE_CODE = btoa(`${WRITE_CODE}:`);

    if (!userId?.trim() || typeof userId !== "string") {
      console.error(
        "Userlens SDK Error: userId is required to identify session user."
      );
    }

    this.TIMEOUT = TIMEOUT; // default 30 minutes
    this.BUFFER_SIZE = BUFFER_SIZE; // default 30 events

    if (Array.isArray(maskingOptions)) {
      this.maskingOptions = maskingOptions;
    } else {
      this.maskingOptions = ["passwords"];
    }

    this.userId = userId;
    this.sessionEvents = [];

    const lastActive = window.localStorage.getItem("userlensSessionLastActive");

    // make sure lastActive is a timestamp number
    if (!isNaN(Number(lastActive))) {
      // get difference in time
      const differenceInTime = Date.now() - lastActive;
      // get sessionUuid from storage
      const sessionUuidInStorage = window.localStorage.getItem(
        "userlensSessionUuid"
      );

      // if sessionUuid is not present in storage OR session expired => create new session
      if (!sessionUuidInStorage || differenceInTime > this.TIMEOUT) {
        // create new session (generate uuid + save in local storage)
        this.#createSession();
      } else {
        // else use session uuid from local storage
        this.sessionUuid = sessionUuidInStorage;
      }
    }

    this.#initRecorder();
    this.#initUnloadListener();
  }

  // init rrweb recorder
  #initRecorder() {
    if (this.stopRecording) {
      this.stopRecording();
    }

    this.stopRecording = rrwebRecord({
      emit: (event) => {
        this.#handleEvent(event);
      },
      maskAllInputs: this.maskingOptions.includes("all"),
      maskInputOptions: { password: this.maskingOptions.includes("passwords") },
      plugins: [getRecordConsolePlugin()],
    });
  }

  #handleEvent(event) {
    const lastActive = Number(
      window.localStorage.getItem("userlensSessionLastActive")
    );

    if (lastActive) {
      const now = Date.now();

      if (now - lastActive > this.TIMEOUT) {
        this.#handleInactivity();
      }
    }

    this.sessionEvents.push(event);
    window.localStorage.setItem("userlensSessionLastActive", event.timestamp);

    if (this.sessionEvents.length >= this.BUFFER_SIZE) {
      this.#trackEvents();
    }
  }

  #handleInactivity() {
    if (this.sessionEvents.length > 0) {
      this.#trackEvents();
    }

    if (this.stopRecording) {
      this.stopRecording();
    }

    localStorage.removeItem("userlensSessionUuid");
    localStorage.removeItem("userlensSessionLastActive");

    this.#createSession();
    this.#initRecorder();
  }

  #initUnloadListener() {
    window.addEventListener("beforeunload", () => {
      // save events on session.userlens.io service
      this.#trackEvents();
    });
  }

  // save events on session.userlens.io service
  async #trackEvents() {
    const chunkTimestamp =
      this.sessionEvents[this.sessionEvents?.length - 1]?.timestamp;
    const payload = this.sessionEvents;

    this.#clearEvents();

    await fetch(`https://sessions.userlens.io/session/${this.sessionUuid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.WRITE_CODE}`,
      },
      body: JSON.stringify({
        userId: this.userId,
        chunk_timestamp: chunkTimestamp,
        payload: payload,
      }),
    });
  }

  #clearEvents() {
    this.sessionEvents = [];
  }

  // create sessionUuid, save to local storage
  #createSession() {
    this.sessionUuid = this.#generateSessionUuid();
    window.localStorage.setItem("userlensSessionUuid", this.sessionUuid);
  }

  #generateSessionUuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }
}

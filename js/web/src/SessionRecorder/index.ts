import { record as rrwebRecord, takeFullSnapshot } from "rrweb";
import type { eventWithTime } from "rrweb";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

import { generateUuid } from "../utils";

import { MaskingOption, SessionRecorderConfig } from "../types";

export default class SessionRecorder {
  private WRITE_CODE!: string;
  private userId!: string;
  private TIMEOUT!: number;
  private BUFFER_SIZE!: number;
  private maskingOptions!: MaskingOption[];
  private sessionUuid!: string;
  private sessionEvents: eventWithTime[] = [];
  private rrwebControl: ReturnType<typeof rrwebRecord> | null = null;

  #trackEventsThrottled;

  constructor({
    WRITE_CODE,
    userId,
    recordingOptions = {},
  }: SessionRecorderConfig) {
    if (typeof window === "undefined") {
      console.error(
        "Userlens SDK error: unavailable outside of browser environment."
      );
    }
    if (!WRITE_CODE?.trim()) {
      throw new Error(
        "Userlens SDK Error: WRITE_CODE is required and must be a string"
      );
    }
    if (!userId?.trim()) {
      console.error(
        "Userlens SDK Error: userId is required to identify session user."
      );
    }

    const {
      TIMEOUT = 30 * 60 * 1000,
      BUFFER_SIZE = 10,
      maskingOptions = ["passwords"],
    } = recordingOptions;

    if (typeof WRITE_CODE === "string") {
      this.WRITE_CODE = btoa(`${WRITE_CODE}:`);
    } else {
      throw new Error("WRITE_CODE must be a string to base64 encode it");
    }

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

  #handleEvent(event: eventWithTime) {
    const now = Date.now();
    const lastActive = Number(
      localStorage.getItem("userlensSessionLastActive")
    );

    // check inactivity timeout
    if (lastActive && now - lastActive > this.TIMEOUT) {
      this.#resetSession();
    }

    localStorage.setItem("userlensSessionLastActive", now.toString());

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
      this.sessionUuid = generateUuid();
      localStorage.setItem("userlensSessionUuid", this.sessionUuid);
    } else {
      this.sessionUuid = storedUuid;
    }

    localStorage.setItem("userlensSessionLastActive", now.toString());
  }

  #initFocusListener() {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState) {
        takeFullSnapshot();
      }
    });
  }

  #throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
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

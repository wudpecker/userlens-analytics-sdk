import Bowser from "bowser";
import DOMPath from "chrome-dompath";

import {
  PageViewEvent,
  DOMSnapshotNode,
  RawEvent,
  PushedEvent,
  UserContext,
} from "../types";
import { getUserlensVersion } from "../utils";

export default class EventCollector {
  private callback!: (
    events: (PageViewEvent | RawEvent | PushedEvent)[]
  ) => void;
  private intervalTime!: number;
  private events!: (PageViewEvent | RawEvent | PushedEvent)[];
  private userContext: UserContext | null = null;
  #senderIntervalId: ReturnType<typeof setInterval> | undefined;

  #originalPushState!: (
    data: any,
    unused: string,
    url?: string | URL | null
  ) => void;
  #originalReplaceState!: (
    data: any,
    unused: string,
    url?: string | URL | null
  ) => void;

  #boundClickHandler = this.#handleClick.bind(this);
  #boundTrackPageview = this.#trackPageview.bind(this);

  constructor(callback: (events: any[]) => void, intervalTime = 5000) {
    if (typeof window === "undefined") {
      console.error(
        "Userlens EventCollector error: unavailable outside of browser environment."
      );
    }

    if (typeof callback !== "function") {
      console.error(
        "Userlens EventCollector error: callback is not a function."
      );
      return;
    }

    this.callback = callback;
    this.intervalTime = intervalTime;

    const eventsFromStorage = window.localStorage.getItem("userlensEvents");
    this.events = eventsFromStorage ? JSON.parse(eventsFromStorage) : [];

    this.#initializeCollector();
    this.#initializeSender();
    this.#setupSPAListener();

    this.userContext = this.#getUserContext();
  }

  public pushEvent(event: PushedEvent) {
    const eventToPush = {
      ...event,
      is_raw: false,
      properties: {
        ...event.properties,
        ...this.#getUserContext(),
      },
    };

    this.events.push(eventToPush);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  public stop() {
    this.#destroyCollector();
    this.#destroySender();
    this.#destroySPAListener();
  }

  #getUserContext(): UserContext {
    if (this.userContext) {
      return this.userContext;
    }

    const browser = Bowser.getParser(window.navigator.userAgent);
    const info = browser.getBrowser();
    const os = browser.getOS();

    const userContext: UserContext = {
      $ul_browser: info.name ?? "Unknown",
      $ul_browser_version: info.version ?? "Unknown",
      $ul_os: os.name ?? "Unknown",
      $ul_os_version: os.versionName ?? "Unknown",
      $ul_browser_language: navigator.language ?? "en-US",
      $ul_browser_language_prefix: navigator.language?.split("-")[0] ?? "en",
      $ul_screen_width: window.screen.width,
      $ul_screen_height: window.screen.height,
      $ul_viewport_width: window.innerWidth,
      $ul_viewport_height: window.innerHeight,
      $ul_current_url: window.location.href,
      $ul_pathname: window.location.pathname,
      $ul_host: window.location.host,
      $ul_referrer: document.referrer || "$direct",
      $ul_referring_domain: document.referrer
        ? new URL(document.referrer).hostname
        : "$direct",
      $ul_lib: "userlens.js",
      $ul_lib_version: getUserlensVersion(),
      $ul_device_type: /Mobi|Android/i.test(navigator.userAgent)
        ? "Mobile"
        : "Desktop",
      $ul_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.userContext = userContext;
    return userContext;
  }

  #initializeCollector() {
    document.body.addEventListener("click", this.#boundClickHandler);
  }

  #handleClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const selector = DOMPath.xPath(target, true);
    const snapshot = this.#collectDOMSnapshot(target);
    const current_url = window.location.href;

    const rawEvent: RawEvent = {
      event: selector,
      is_raw: true,
      snapshot,
      current_url,
      properties: {
        ...this.#getUserContext(),
      },
    };

    this.events.push(rawEvent);

    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  #collectDOMSnapshot(target: Element): DOMSnapshotNode[] {
    const snapshot: DOMSnapshotNode[] = [];
    let current: Element | null = target;

    while (current && current !== document.documentElement) {
      if (!(current instanceof HTMLElement)) {
        current = current.parentElement;
        continue;
      }

      // get tagName and inner text if present
      const tagName = current.tagName.toLowerCase();
      // get element classList and element id
      const classList = current.classList.length
        ? [...current.classList]
        : null;

      const attr_id = current.id || null;
      // get current element nth-child and ntf-of-type
      const nth_child =
        Array.from(current.parentNode?.children || []).indexOf(current) + 1;
      const nth_of_type =
        Array.from(current.parentNode?.children || [])
          .filter((c) => c.tagName === current?.tagName)
          .indexOf(current) + 1;
      // get current element element attributes
      const attributes: Record<string, string> = {};
      for (let attr of current.attributes) {
        attributes[`attr__${attr.name}`] = attr.value;
      }

      // only allow text if this is one of the last 3 nodes (closest to the target)
      const i = snapshot.length;
      const includeText = i < 3;

      const isClickable =
        ["a", "button", "span", "label"].includes(tagName) ||
        current.getAttribute("role") === "button" ||
        current.getAttribute("tabindex") !== null ||
        typeof current.onclick === "function" ||
        (current.className &&
          /btn|button|clickable|cta/.test(current.className));

      const text =
        includeText && isClickable ? current.innerText?.trim() || null : null;

      // push to the beginning of the array
      snapshot.unshift({
        text,
        tag_name: tagName,
        attr_class: classList,
        href: current.getAttribute("href"),
        attr_id,
        nth_child,
        nth_of_type,
        attributes,
      });

      // move on to the next element in dom tree
      current = current.parentElement;
    }

    return snapshot;
  }

  #initializeSender() {
    this.#senderIntervalId = setInterval(() => {
      this.#sendEvents();
    }, this.intervalTime);
  }

  #setupSPAListener() {
    this.#originalPushState = history.pushState;
    this.#originalReplaceState = history.replaceState;

    // hook into pushState & replaceState
    history.pushState = (...args) => {
      this.#originalPushState.apply(history, args);
      this.#trackPageview();
    };

    history.replaceState = (...args) => {
      this.#originalReplaceState.apply(history, args);
      this.#trackPageview();
    };

    // handle back/forward navigation
    window.addEventListener("popstate", this.#boundTrackPageview);
  }

  #trackPageview() {
    try {
      const url = new URL(window.location.href);

      if (
        url?.hostname === "localhost" ||
        url?.hostname === "127.0.0.1" ||
        url?.hostname === "::1"
      )
        return;

      let referrer = "";
      try {
        if (document.referrer && /^https?:\/\//.test(document.referrer)) {
          referrer =
            new URL(document.referrer).origin +
            new URL(document.referrer).pathname;
        }
      } catch (e) {
        referrer = "";
      }

      // Convert query params to object
      const queryParams = Object.fromEntries(url.searchParams.entries());

      const pageview = {
        event: "$ul_pageview",
        properties: {
          $ul_page: url?.origin + url?.pathname || null,
          $ul_referrer: referrer || null,
          $ul_query: queryParams,
        },
      };

      this.events.push(pageview);
      window.localStorage.setItem(
        "userlensEvents",
        JSON.stringify(this.events)
      );
    } catch (err) {
      console.warn("Userlens EventCollector error: tracking page view failed");
    }
  }

  #sendEvents() {
    if (this.events.length > 0) {
      const eventsToSend = [...this.events];
      this.callback(eventsToSend);
      this.#clearEvents();
    }
  }

  #clearEvents() {
    this.events = [];
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  #destroyCollector() {
    document.body.removeEventListener("click", this.#boundClickHandler);
  }

  #destroySender() {
    this.#sendEvents();
    clearInterval(this.#senderIntervalId);
    this.#clearEvents();
  }

  #destroySPAListener() {
    history.pushState = this.#originalPushState;
    history.replaceState = this.#originalReplaceState;
    window.removeEventListener("popstate", this.#boundTrackPageview);
  }
}

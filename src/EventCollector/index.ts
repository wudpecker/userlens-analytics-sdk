import Bowser from "bowser";
import DOMPath from "chrome-dompath";

import { identify, track } from "../api";

import {
  EventCollectorConfig,
  AutoUploadConfig,
  PageViewEvent,
  SnapshotNode,
  SnapshotOptions,
  RawEvent,
  PushedEvent,
  UserContext,
} from "../types";
import { getUserlensVersion, saveWriteCode } from "../utils";

export default class EventCollector {
  private userId?: string;
  private userTraits?: Record<string, any>;
  private autoUploadModeEnabled!: Boolean;
  private callback?: (
    events: (PageViewEvent | RawEvent | PushedEvent)[]
  ) => void;
  private intervalTime!: number;
  private events!: (PageViewEvent | RawEvent | PushedEvent)[];
  private userContext: UserContext | null = null;
  private debug!: boolean;
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

  constructor(config: EventCollectorConfig) {
    if (typeof window === "undefined") {
      console.error(
        "Userlens EventCollector error: unavailable outside of browser environment."
      );
      return;
    }

    const { userId, WRITE_CODE, callback, intervalTime = 5000 } = config;
    const userTraits = (config as AutoUploadConfig).userTraits;

    if (callback) {
      this.autoUploadModeEnabled = false;
    } else {
      this.autoUploadModeEnabled = true;
    }

    if (this.autoUploadModeEnabled && !userId?.length) {
      console.error("Userlens EventCollector error: userId is missing.");
      return;
    }

    if (this.autoUploadModeEnabled && !WRITE_CODE?.length) {
      console.error("Userlens EventCollector error: WRITE_CODE is missing.");
      return;
    }

    if (this.autoUploadModeEnabled) {
      saveWriteCode(WRITE_CODE as string);
    }

    if (!this.autoUploadModeEnabled && typeof callback !== "function") {
      console.error(
        "Userlens EventCollector error: callback is not a function."
      );
      return;
    }

    this.userId = userId;
    this.userTraits =
      typeof userTraits === "object" && userTraits !== null ? userTraits : {};
    this.callback = callback;
    this.intervalTime = intervalTime;

    const eventsFromStorage = window.localStorage.getItem("userlensEvents");
    this.events = eventsFromStorage ? JSON.parse(eventsFromStorage) : [];

    this.#initializeCollector();
    this.#initializeSender();
    this.#setupSPAListener();

    this.userContext = this.getUserContext();
  }

  public pushEvent(event: { event: string; properties?: Record<string, any> }) {
    const eventToPush: PushedEvent = {
      is_raw: false,
      ...event,
      properties: {
        ...event?.properties,
        ...this.getUserContext(),
      },
    };

    if (this.userId) {
      eventToPush.userId = this.userId;
    }

    this.events.push(eventToPush);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  public updateUserTraits(newUserTraits: Record<string, any>) {
    this.userTraits = newUserTraits;
  }

  public stop() {
    this.#destroyCollector();
    this.#destroySender();
    this.#destroySPAListener();
  }

  private getUserContext(): UserContext {
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
      $ul_page: window.location.href,
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
    if (!(target instanceof HTMLElement)) return;

    const selector = DOMPath.xPath(target, true);
    const snapshot = this.#collectDOMSnapshot(target);
    const snapshotArray = snapshot ? [snapshot] : [];

    const rawEvent: RawEvent = {
      event: selector,
      is_raw: true,
      snapshot: snapshotArray,
      properties: {
        ...this.getUserContext(),
      },
    };

    if (this.userId) {
      rawEvent.userId = this.userId;
    }

    this.events.push(rawEvent);

    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  #collectDOMSnapshot(targetEl: HTMLElement): SnapshotNode | null {
    if (!(targetEl instanceof HTMLElement)) return null;

    const path: HTMLElement[] = [];
    let el: HTMLElement | null = targetEl;
    while (el && el.nodeType === 1) {
      path.unshift(el);
      el = el.parentElement;
    }

    let root: SnapshotNode | null = null;
    let currentParent: SnapshotNode | null = null;

    for (let i = 0; i < path.length; i++) {
      const el = path[i];
      const isBottomThree = i >= path.length - 3;
      const isTarget = i === path.length - 1;

      const node = this.#snapshotElementNode(el, {
        isTarget,
        leadsToTarget: true,
      });

      let groupedChildren: SnapshotNode[] = [node];

      if (isBottomThree && el.parentElement) {
        const siblings = Array.from(el.parentElement.children).filter(
          (child): child is HTMLElement =>
            child !== el && child instanceof HTMLElement
        );

        const siblingNodes = siblings
          .map((sibling) =>
            this.#snapshotElementNode(sibling, {
              includeChildren: true,
            })
          )
          .filter(Boolean);

        groupedChildren = [node, ...siblingNodes];
      }

      if (!root) root = node;
      if (currentParent) {
        if (!currentParent.children) currentParent.children = [];
        currentParent.children.push(...groupedChildren);
      }

      currentParent = node;
    }

    return root;
  }

  #snapshotElementNode(
    el: HTMLElement,
    {
      isTarget = false,
      includeChildren = false,
      leadsToTarget = false,
    }: SnapshotOptions = {}
  ): SnapshotNode {
    const tag_name = el.tagName.toLowerCase();
    const attr_class = el.classList.length ? Array.from(el.classList) : null;
    const attr_id = el.id || null;
    const href = el.getAttribute("href") || null;

    const nth_child = Array.from(el.parentNode?.children || []).indexOf(el) + 1;
    const nth_of_type =
      Array.from(el.parentNode?.children || [])
        .filter((c) => c instanceof HTMLElement && c.tagName === el.tagName)
        .indexOf(el) + 1;

    const attributes: Record<string, string> = {};
    for (let attr of Array.from(el.attributes)) {
      attributes[`attr__${attr.name}`] = attr.value;
    }

    const textNodes = Array.from(el.childNodes).filter(
      (n) => n.nodeType === Node.TEXT_NODE
    );
    const text =
      textNodes
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(" ") || null;

    const node: SnapshotNode = {
      tag_name,
      attr_class,
      attr_id,
      href,
      nth_child,
      nth_of_type,
      attributes,
      text,
      ...(isTarget && { is_target: true }),
      ...(leadsToTarget && !isTarget && { leads_to_target: true }),
    };

    if ((includeChildren && el.children.length > 0) || isTarget) {
      node.children = Array.from(el.children)
        .filter((c): c is HTMLElement => c instanceof HTMLElement)
        .map((child) =>
          this.#snapshotElementNode(child, {
            includeChildren: true,
          })
        )
        .filter(Boolean);
    }

    return node;
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

      const pageview: PageViewEvent = {
        event: "$ul_pageview",
        properties: {
          $ul_page: url?.origin + url?.pathname || null,
          $ul_referrer: referrer || null,
          $ul_query: queryParams,
        },
      };

      if (this.userId) {
        pageview.userId = this.userId;
      }

      this.events.push(pageview);
      window.localStorage.setItem(
        "userlensEvents",
        JSON.stringify(this.events)
      );
    } catch (err) {
      console.warn("Userlens EventCollector error: tracking page view failed");
    }
  }

  #sendEvents = () => {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];

    if (this.callback) {
      try {
        this.callback(eventsToSend);
      } catch (err) {
        console.error("Userlens callback error:", err);
      }
      this.#clearEvents();
      return;
    }

    Promise.allSettled([
      this.userId && this.userTraits
        ? identify({ userId: this.userId, traits: this.userTraits })
        : null,
      track(eventsToSend),
    ]);

    this.#clearEvents();
  };

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

import Bowser from "bowser";
import DOMPath from "chrome-dompath";

import { identify, track, group } from "../api";

import {
  EventCollectorConfig,
  AutoUploadConfig,
  PageViewEvent,
  SnapshotNode,
  SnapshotOptions,
  RawEvent,
  PushedEvent,
  UserContext,
  PageMetadata,
} from "../types";
import { getUserlensVersion, saveWriteCode, getIsLocalhost } from "../utils";

export default class EventCollector {
  private userId?: string;
  private userTraits?: Record<string, any>;
  private groupId?: string;
  private groupTraits?: Record<string, any>;
  private autoUploadModeEnabled!: Boolean;
  private useLighterSnapshot: boolean = false;
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

    const {
      userId,
      WRITE_CODE,
      callback,
      intervalTime = 5000,
      skipRawEvents = false,
      useLighterSnapshot = false,
      debug = false,
    } = config;
    const userTraits = (config as AutoUploadConfig).userTraits;

    const groupId = (config as AutoUploadConfig).groupId;
    const groupTraits = (config as AutoUploadConfig).groupTraits;

    if (callback) {
      this.autoUploadModeEnabled = false;
    } else {
      this.autoUploadModeEnabled = true;
    }

    if (this.autoUploadModeEnabled && !userId?.length) {
      if (this.debug) {
        console.error("Userlens EventCollector error: userId is missing.");
      }
      return;
    }

    if (this.autoUploadModeEnabled && !WRITE_CODE?.length) {
      if (this.debug) {
        console.error("Userlens EventCollector error: WRITE_CODE is missing.");
      }
      return;
    }

    if (this.autoUploadModeEnabled) {
      saveWriteCode(WRITE_CODE as string);
    }

    if (!this.autoUploadModeEnabled && typeof callback !== "function") {
      if (this.debug) {
        console.error(
          "Userlens EventCollector error: callback is not a function."
        );
      }
      return;
    }

    this.userId = userId;
    this.userTraits =
      typeof userTraits === "object" && userTraits !== null ? userTraits : {};
    this.callback = callback;
    this.intervalTime = intervalTime;
    this.events = [];
    this.debug = debug;

    if (groupId) {
      this.groupId = groupId;
      this.groupTraits =
        typeof groupTraits === "object" && groupTraits !== null
          ? groupTraits
          : {};
    }

    if (!skipRawEvents) {
      this.useLighterSnapshot = useLighterSnapshot;
      this.#initializeCollector();
      this.#setupSPAListener();
    }

    this.#initializeSender();

    this.userContext = this.getUserContext();
  }

  public pushEvent(event: { event: string; properties?: Record<string, any> }) {
    const eventToPush: PushedEvent = {
      is_raw: false,
      ...event,
      properties: {
        ...event?.properties,
        ...this.getUserContext(),
        ...this.getPageMetadata(),
      },
    };

    if (this.userId) {
      eventToPush.userId = this.userId;
    }

    this.events.push(eventToPush);
  }

  public identify(userId: string | number, userTraits: Record<string, any>) {
    return identify({ userId, traits: userTraits });
  }

  public group(groupId: string | number, groupTraits: Record<string, any>) {
    return group({ groupId, traits: groupTraits, userId: this.userId });
  }

  public updateUserTraits(newUserTraits: Record<string, any>) {
    this.userTraits = newUserTraits;
  }

  public updateGroupTraits(newGroupTraits: Record<string, any>) {
    this.groupTraits = newGroupTraits;
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

  private getPageMetadata(): PageMetadata {
    try {
      const url = new URL(window.location.href);

      let referrer = document.referrer || "$direct";
      let referringDomain = "$direct";

      try {
        if (referrer && /^https?:\/\//.test(referrer)) {
          referringDomain = new URL(referrer).hostname;
        }
      } catch (_) {}

      const queryParams = url.search.slice(1);

      return {
        $ul_page: url.origin + url.pathname,
        $ul_pathname: url.pathname,
        $ul_host: url.host,
        $ul_referrer: referrer,
        $ul_referring_domain: referringDomain,
        $ul_query: queryParams,
      };
    } catch (_) {
      return {
        $ul_page: "",
        $ul_pathname: "",
        $ul_host: "",
        $ul_referrer: "",
        $ul_referring_domain: "",
        $ul_query: "",
      };
    }
  }

  #initializeCollector() {
    if (this.debug) {
      console.log("Userlens EventCollector: adding click event listener");
    }

    document.addEventListener("click", this.#boundClickHandler, true);

    if (this.debug) {
      console.log("Userlens EventCollector: click event listener added");
    }
  }

  #handleClick(event: MouseEvent) {
    try {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const selector = DOMPath.xPath(target, true);
      const snapshot = this.useLighterSnapshot
        ? this.#collectLightDOMSnapshot(target)
        : this.#collectDOMSnapshot(target);
      const snapshotArray = snapshot ? [snapshot] : [];

      const rawEvent: RawEvent = {
        event: selector,
        is_raw: true,
        snapshot: snapshotArray,
        properties: {
          ...this.getUserContext(),
          ...this.getPageMetadata(),
        },
      };

      if (this.userId) {
        rawEvent.userId = this.userId;
      }

      this.events.push(rawEvent);

      if (this.events.length > 100) {
        this.events = this.events.slice(-100);
      }
    } catch (err) {
      console.warn(
        "Userlens EventCollector error: click event handling failed",
        err
      );
    }
  }

  #collectLightDOMSnapshot(targetEl: HTMLElement): SnapshotNode | null {
    if (!(targetEl instanceof HTMLElement)) return null;

    const body = document.body as HTMLElement;
    if (!body) return null;

    const path: HTMLElement[] = [];
    let el: HTMLElement | null = targetEl;
    while (el && el.nodeType === 1 && el !== body) {
      path.unshift(el);
      el = el.parentElement;
    }

    const fullPath = [body, ...path.filter((p) => p !== body)];

    let root: SnapshotNode | null = null;
    let parentNode: SnapshotNode | null = null;

    for (let i = 0; i < fullPath.length; i++) {
      const el = fullPath[i];
      const isTarget = i === fullPath.length - 1;

      const node = this.#snapshotElementNode(el, {
        isTarget,
        leadsToTarget: !isTarget,
      });

      if (!root) root = node;
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(node);
      }
      parentNode = node;
    }

    const targetNode = parentNode;
    if (targetNode && targetEl.children.length > 0) {
      targetNode.children = Array.from(targetEl.children)
        .filter((c): c is HTMLElement => c instanceof HTMLElement)
        .map((child) =>
          this.#snapshotElementNode(child, {
            includeChildren: true,
          })
        )
        .filter(Boolean) as SnapshotNode[];
    }

    return root;
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
      nth_child,
      nth_of_type,
      attributes,
      ...(attr_class ? { attr_class } : {}),
      ...(attr_id ? { attr_id } : {}),
      ...(href ? { href } : {}),
      ...(text ? { text } : {}),
      ...(isTarget ? { is_target: true } : {}),
      ...(leadsToTarget && !isTarget ? { leads_to_target: true } : {}),
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
    const isLocalhost: boolean = getIsLocalhost();
    if (isLocalhost) return;

    const pageMetadata = this.getPageMetadata();
    const pageViewEvent: PageViewEvent = {
      event: "$ul_pageview",
      properties: pageMetadata,
    };

    if (this.userId) {
      pageViewEvent.userId = this.userId;
    }

    this.events.push(pageViewEvent);
  }

  #sendEvents = () => {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];

    if (this.callback) {
      try {
        this.callback(eventsToSend);
      } catch (err) {
        // console.error("Userlens callback error:", err);
      }
      this.#clearEvents();
      return;
    }

    Promise.allSettled([
      this.userId && this.userTraits
        ? identify({ userId: this.userId, traits: this.userTraits }, this.debug)
        : null,
      this.groupId
        ? group(
            {
              groupId: this.groupId,
              traits: this.groupTraits,
              userId: this.userId,
            },
            this.debug
          )
        : null,
      track(eventsToSend, this.debug),
    ]);

    this.#clearEvents();
  };

  #clearEvents() {
    this.events = [];
  }

  #destroyCollector() {
    document.removeEventListener("click", this.#boundClickHandler, true);
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

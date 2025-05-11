import DOMPath from "chrome-dompath";

export default class EventCollector {
  constructor(callback, intervalTime = 5000) {
    // check environment
    if (window === undefined) {
      console.error(
        "Userlens EventCollector error: unavailable outside of browser environment."
      );
    }

    // check if callback is a function
    if (typeof callback !== "function") {
      console.error(
        "Userlens EventCollector error: callback is not a function."
      );

      return;
    }

    // store passed callback function
    this.callback = callback;
    this.intervalTime = intervalTime;

    // get events from local storage
    const eventsFromStorage = window.localStorage.getItem("userlensEvents");

    // if present, initialize events with events saved in local storage
    if (eventsFromStorage) {
      this.events = JSON.parse(eventsFromStorage);
    } else {
      // else initialize empty events
      this.events = [];
    }

    this.#initializeCollector();
    this.#initializeSender();

    this.#setupSPAListener();
    this.#trackPageview();
  }

  // constructs a page view event object and pushes it to events, updates localStorage too.
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
        event: url?.origin + url?.pathname || "pageview",
        properties: {
          referrer,
          query: queryParams,
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

  // detect SPA navigations using history API
  #setupSPAListener() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // hook into pushState & replaceState
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.#trackPageview();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.#trackPageview();
    };

    // handle back/forward navigation
    window.addEventListener("popstate", () => this.#trackPageview());
  }

  // initialize click event listener
  #initializeCollector() {
    document.body.addEventListener("click", (event) => {
      this.#handleClick(event);
    });
  }

  // sends events and pageviews to callback, clears up states
  #initializeSender() {
    setInterval(() => {
      if (this.events.length > 0) {
        const eventsToSend = [...this.events];

        this.callback(eventsToSend);

        this.#clearEvents();
      }
    }, this.intervalTime);
  }

  // clears up states
  #clearEvents() {
    this.events = [];
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  // retrieves selector of event target element
  // pushes selector to the array
  #handleClick(event) {
    const selector = DOMPath.xPath(event.target, true);
    const snapshot = this.#collectDomSnapshot(event.target);
    const current_url = window.location.href;

    const clickEvent = {
      event: selector,
      is_raw: true,
      snapshot,
      current_url,
    };

    this.events.push(clickEvent);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  #collectDomSnapshot(el) {
    const snapshot = [];
    let current = el;

    while (current && current !== document.documentElement) {
      // get tagName and inner text if present
      const tagName = current.tagName.toLowerCase();
      // const text = current.innerText?.trim() || null;
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
          .filter((c) => c.tagName === current.tagName)
          .indexOf(current) + 1;

      // get current element element attributes
      const attributes = {};
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

  pushEvent(event) {
    const eventToPush = {
      ...event,
      is_raw: false,
    };

    this.events.push(eventToPush);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }
}

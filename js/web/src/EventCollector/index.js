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
      const referrer = new URL(document.referrer || "");

      // Convert query params to object
      const queryParams = Object.fromEntries(url.searchParams.entries());

      const pageview = {
        event: "pageview",
        properties: {
          url: url.origin + url.pathname,
          referrer: referrer.origin + referrer.pathname,
          query: queryParams,
        },
      };

      this.events.push(pageview);
      window.localStorage.setItem(
        "userlensEvents",
        JSON.stringify(this.events)
      );
    } catch (err) {
      console.error("Userlens EventCollector error: ", err);
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

    const clickEvent = {
      event: selector,
    };

    this.events.push(clickEvent);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }
}

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
  
  stop() {
    this.#destroyCollector();
    this.#destroySender();

    this.#teardownSPAListener();
  }

  // constructs a page view event object and pushes it to events, updates localStorage too.
  #trackPageview = () => {
    const pageview = {
      event: "pageview",
      properties: {
        url: window.location.href,
        referrer: document.referrer,
      },
    };

    this.events.push(pageview);

    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  // detect SPA navigations using history API

  #originalPushState
  #originalReplaceState

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
    window.addEventListener("popstate",  this.#trackPageview);
  }

  #teardownSPAListener() {
    history.pushState = this.#originalPushState;
    history.replaceState = this.#originalReplaceState;
    window.removeEventListener("popstate", this.#trackPageview);
  }

  // initialize click event listener
  #initializeCollector() {
    document.body.addEventListener("click", this.#handleClick);
  }

  #destroyCollector() {
    document.body.removeEventListener("click", this.#handleClick);
  }

  // sends events and pageviews to callback, clears up states

  #senderIntervalId; 

  #initializeSender() {
    this.#senderIntervalId = setInterval(() => {
      if (this.events.length > 0) {
        const eventsToSend = [...this.events];

        this.callback(eventsToSend);

        this.#clearEvents();
      }
    }, this.intervalTime);
  }

  #destroySender() {
    clearInterval(this.#senderIntervalId);
   }

  // clears up states
  #clearEvents() {
    this.events = [];
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  // retrieves selector of event target element
  // pushes selector to the array
  #handleClick = (event) => {
    const selector = DOMPath.xPath(event.target, true);

    const clickEvent = {
      event: selector,
    };

    this.events.push(clickEvent);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }
}

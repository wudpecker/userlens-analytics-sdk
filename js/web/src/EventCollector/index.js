import DOMPath from "chrome-dompath";

export default class EventCollector {
  constructor(callback, intervalTime = 5000) {
    // check environment
    if (window === undefined) {
      console.error("Userlens EventCollector error: unavailable outside of browser environment.")
    }

    // check if callback is a function
    if (typeof callback !== 'function') {
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
  }

  // initialize click event listener
  #initializeCollector() {
    document.body.addEventListener('click', (event) => {
      this.#handleClick(event);
    });
  }

  #initializeSender() {
    setInterval(() => {
      if (this.events.length > 0) {
        const eventsToSend = [...this.events];

        this.callback(eventsToSend);

        this.#clearEvents();
      }
    }, this.intervalTime);
  }

  #clearEvents() {
    this.events = [];
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  // retrieves selector of event target element
  // pushes selector to the array
  #handleClick(event) {
    const selector = DOMPath.xPath(event.target, true);

    const clickEvent = {
      event: selector
    };

    this.events.push(clickEvent);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }
}
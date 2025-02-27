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
    const clickEvent = {
      event: this.#getCssSelector(event.target)
    };

    this.events.push(clickEvent);
    window.localStorage.setItem("userlensEvents", JSON.stringify(this.events));
  }

  // gets a css selector of a target element passed as parameter
  #getCssSelector(element) {
    const paths = [];
    let currentElement = element;

    while (currentElement !== document.body && currentElement !== document) {
      let selector = currentElement.tagName.toLowerCase();

      if (currentElement.id) {
        selector += `#${currentElement.id}`;
        paths.unshift(selector);

        break;
      } else {
        if (currentElement.className && typeof currentElement.className === 'string') {
          const classes = currentElement.className.trim().split(/\s+/);
          if (classes.length) {
            selector += `.${classes.join('.')}`;
          }
        }

        const siblings = Array.from(currentElement.parentNode.children);
        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          selector += `:nth-child(${index})`;
        }
        paths.unshift(selector);
      }
      currentElement = currentElement.parentElement;
    }

    return paths.join(' > ');
  }
}
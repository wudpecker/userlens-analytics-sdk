# Table of Contents

- [Introduction](#introduction)
- [Userlens.js - Node.js SDK](#userlensjs---nodejs-sdk)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Importing the SDK](#importing-the-sdk)
    - [Initializing the Tracker](#initializing-the-tracker)
    - [Identify](#identify)
    - [Track](#track)
    - [Example: Express.js Analytics Endpoint](#example-expressjs-analytics-endpoint)
  - [Error Handling](#error-handling)
- [Python SDK](#python-sdk)
  - [Overview](#overview)
  - [Installation](#installation-1)
  - [Getting Started](#getting-started)
    - [Importing the SDK](#importing-the-sdk)
    - [Initialize the Tracker](#initialize-the-tracker)
    - [Identify Users](#identify-users)
    - [Track Events](#track-events)
    - [Advanced Usage](#advanced-usage)
      - [Custom Timeout](#custom-timeout)
- [Userlens.js - Web SDK](#userlensjs---web-sdk)
  - [Installation](#installation-2)
  - [Usage](#usage-1)
    - [Importing the SDK](#importing-the-sdk-1)
    - [Initializing the Tracker](#initializing-the-tracker-1)
    - [Tracking Events](#tracking-events)
    - [Identifying Users](#identifying-users)
  - [Using in a React App with Context](#using-in-a-react-app-with-context)
    - [Example with React Router DOM](#example-with-react-router-dom)
  - [Error Handling](#error-handling-1)
- [License](#license)


# Introduction
We offer a lightweight and flexible event tracking SDK designed to give you full control over how you collect and forward user events. Whether you prefer a fire-and-forget approach or need granular control over each event, we've got you covered. The package is framework agnostic and can be used within any frontend project as well as in pure JavaScript.

If you need more control, you can manually track events by adding event handlers wherever necessary. These events are sent to your own tracking endpoint, where you process them before forwarding them to our backend. This approach ensures you only track exactly what you need, when you need it.

In this file we'll guide you through the setup required to start tracking events in your app.

# Userlens.js - Node.js SDK

The best way to implement analytics with Userlens.js is on the server side. We strongly recommend keeping analytics logic on the backend to ensure accuracy, security, and better control over user data. Our Node.js package, userlens-analytics-sdk-node, can be integrated with any JavaScript backend framework or library. 

## Installation

```sh
npm install userlens-analytics-sdk-node
```

## Usage

### Importing the SDK

```javascript
import EventTracker from "userlens-analytics-sdk-node";
```

### Initializing the Tracker

```javascript
const tracker = new EventTracker("your-write-code");
```
- **writeCode** (*str*): Write code that can be retrieved from your profile settings on app.userlens.io

### Identify
Identify is used to save/update user data and is triggered automatically on every trackEvent call.
```javascript
tracker.identifyUser("john@doe.com", { plan: "Pro", firstName: "John", secondName: "Doe" });
```
- **userId** (*str*): Unique user identifier.
- **traits** (*obj*): User attributes (e.g., name, plan, etc.).

### Track
```javascript
tracker.trackEvent("john@doe.com", "button_clicked", { plan: "Pro", firstName: "John", secondName: "Doe" });
```
- **userId** (*str*): Unique user identifier.
- **eventName** (*str*): A name given to an event, some action performed by a user
- **traits** (*obj*, optional): We recommend passing user properties on every trackEvent to keep user data up to date.

### Example: Express.js Analytics Endpoint

For centralized tracking, create an analytics endpoint that receives API requests and handles tracking/identification.

```javascript
import express from "express";
import jwt from "jsonwebtoken";
import EventTracker from "userlens-analytics-sdk-node";

const app = express();
// initialize tracker
const tracker = new EventTracker("your-write-code");

app.use(express.json());

app.post("/analytics", (req, res) => {
  try {
    // retrieve jwt
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // decode jwt
    const decoded = jwt.verify(token, "your-secret-key");
    // retrieve user email from decoded object
    const { email, fullName, plan } = decoded;

    // retrieve event name from request body
    const { event } = req.body;
    if (!event) return res.status(400).json({ error: "Event name is required" });

    // record an event
    tracker.trackEvent(email, event, {
      email,
      fullName,
      plan
    });

    return res.status(200).json({ message: "Success" })
  } catch (error) {
    console.error("Error processing analytics request", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

## Error Handling

- If `writeCode` is missing, an error is logged.
- If `userId` is missing when calling `identifyUser` or `trackEvent`, an error is logged.
- If `trackEvent` is called without an event name, an error is logged.

# Python SDK

## Overview

The **Userlens Analytics SDK for Python** provides a way to track user events and identify users via the Userlens event tracking system.

## Installation

To install the SDK, use `pip`:

```sh
pip install userlens-analytics-sdk
```

## Getting Started

### **Importing the SDK**

```python
from userlens.event_tracker import EventTracker
```

### **Initialize the Tracker**

```python
tracker = EventTracker("YOUR_WRITE_CODE")
```

- `write_code`: Write code that can be retrieved from your profile settings on app.userlens.io
- `requests_timeout`: Timeout for requests (default: `5` seconds).

---

## **Identify Users**
Identify is used to save/update user data and is triggered automatically on every track call.
```python
tracker.identify("john@doe.com", {"name": "John", "surname": "Doe", "plan": "Pro"})
```

- **user\_id** (*str*): Unique user identifier.
- **traits** (*dict*): User attributes (e.g., name, email, etc.).

## **Track Events**

### **Event Tracking**

```python
tracker.track("john@doe.com", "button_clicked", {"plan": "Pro", "name": "John", "surname": "Doe"})
```
- **user\_id** (*str*): Unique user identifier.
- **event\_name** (*str*): Event name (e.g., `"Button Clicked"`).
- **traits** (*dict*, optional): We recommend passing user properties on every trackEvent to keep user data up to date.
  
---

## **Advanced Usage**
### **Custom Timeout**
It is possible to pass custom requests timeout time.
```python
tracker = EventTracker("YOUR_WRITE_CODE", requests_timeout=10)
```

# Userlens.js - Web SDK

Although we recommend implementing event trackers on server side, we provide a possibility to track events and identify users on client side too.

## Installation

Install the package using npm or yarn:

```sh
npm install userlens-analytics-sdk
```

or

```sh
yarn add userlens-analytics-sdk
```

## Usage

### Importing the SDK

```javascript
import EventTracker from "userlens-analytics-sdk";
```

### Initializing the Tracker
Create an instance of `EventTracker` with your `writeCode` and `userId`:

```javascript
const tracker = new EventTracker("your-write-code", "john@doe.com");
```

- `writeCode`: Your analytics write key.
- `userId`: User ID of logged in user.

### Tracking Events

Track an event with user traits:

```javascript
tracker.trackEvent("button_clicked", { plan: "pro", name: "John", surname: "Doe" });
```

### Identifying Users
Identify a user with additional traits at any time to update their profile:

```javascript
tracker.identifyUser({ plan: "pro" });
```

Identify will be called on every event track.

## Using in a React App with Context
For efficient usage in a React app, create a context to manage the `EventTracker` instance globally:

```javascript
import React, { createContext, useContext, useMemo } from "react";
import EventTracker from "userlens-analytics-sdk";

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const tracker = useMemo(() => new EventTracker("your-write-code", "user@example.com"), []);

  return (
    <AnalyticsContext.Provider value={tracker}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  return useContext(AnalyticsContext);
};
```

### Example with React Router DOM

Here's an example of integrating `AnalyticsProvider` with `react-router-dom`:

```javascript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnalyticsProvider } from "./AnalyticsProvider";
import MyComponent from "./MyComponent";
import AnotherPage from "./AnotherPage";

const App = () => (
  <AnalyticsProvider>
    <Router>
      <Routes>
        <Route path="/" element={<MyComponent />} />
        <Route path="/another" element={<AnotherPage />} />
      </Routes>
    </Router>
  </AnalyticsProvider>
);

export default App;
```

## Error Handling

- If `writeCode` or `userId` (email) is missing, an error is logged.
- If an invalid traits object is passed to `identifyUser`, an error is logged.
- If `trackEvent` is called without an event name, an error is logged.

## License

MIT


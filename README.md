# Userlens.js - SDK Documentation

## Contents

- [Node.js SDK](#userlensjs---nodejs-sdk)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Example: Express.js Analytics Endpoint](#example-expressjs-analytics-endpoint)
  - [Error Handling](#error-handling)
- [Python SDK](#userlensjs--python-sdk)
  - [Overview](#overview)
  - [Installation](#installation-1)
  - [Getting Started](#getting-started)
  - [Identify Users](#identify-users)
  - [Track Events](#track-events)
  - [Advanced Usage](#advanced-usage)
- [Web SDK](#userlensjs---web-sdk)
  - [Installation](#installation-2)
  - [Usage](#usage-2)
  - [Using in a React App with Context](#using-in-a-react-app-with-context)
  - [Example with React Router DOM](#example-with-react-router-dom)
  - [Error Handling](#error-handling-1)

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

    // record an event on server side
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
- If `userId` (email) is missing when calling `identifyUser` or `trackEvent`, an error is logged.
- If `trackEvent` is called without an event name, an error is logged.

# Python SDK

## Overview

The **Userlens Analytics SDK for Python** provides a way to track user events and identify users via the Userlens event tracking system. This package supports both **synchronous** and **asynchronous** tracking using `requests` and `httpx`.

## Installation

To install the SDK, use `pip`:

```sh
pip install userlens-analytics-sdk
```

For **async support**, install with:

```sh
pip install userlens-analytics-sdk[async]
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

- `write_code`: The authentication token (required).
- `requests_timeout`: Timeout for requests (default: `5` seconds).

---

## **Identify Users**

### **Synchronous Identify**

```python
tracker.identify("user_123", {"name": "Andrei", "email": "andrei@example.com"})
```

- **user\_id** (*str*): Unique user identifier.
- **traits** (*dict*): User attributes (e.g., name, email, etc.).

### **Asynchronous Identify**

```python
import asyncio

async def main():
    await tracker.async_identify("user_123", {"name": "Andrei", "email": "andrei@example.com"})

asyncio.run(main())
```

---

## **Track Events**

### **Synchronous Event Tracking**

```python
tracker.track("user_123", "Button Clicked")
```

- **user\_id** (*str*): Unique user identifier.
- **event\_name** (*str*): Event name (e.g., `"Button Clicked"`).
- **traits** (*dict*, optional): **User traits** (not event metadata). It is recommended to pass user traits to keep user information updated in the system.

#### **Correct Example:**

```python
tracker.track("user_123", "Purchase Made", {"name": "Andrei", "email": "andrei@example.com", "subscription": "premium"})
```

### **Asynchronous Event Tracking**

```python
import asyncio

async def main():
    await tracker.async_track("user_123", "Button Clicked", {"name": "Andrei", "email": "andrei@example.com"})

asyncio.run(main())
```

---

## **Advanced Usage**

### **Handling Errors**

If an API request fails, an exception is raised:

```python
try:
    tracker.track("user_123", "Purchase", {"name": "Andrei", "email": "andrei@example.com"})
except ValueError as e:
    print("Tracking failed:", e)
```

### **Custom Timeout**

```python
tracker = EventTracker("YOUR_WRITE_CODE", requests_timeout=10)
```

# Userlens.js - Web SDK

Userlens.js is a lightweight analytics SDK designed for web applications. It helps track user events and identify users, providing insights into product usage.

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

Create an instance of `EventTracker` with your `writeCode`, `userId` (email), and an optional `identifyOnTrack` flag:

```javascript
const tracker = new EventTracker("your-write-code", "user@example.com", true);
```

- `writeCode`: Your analytics write key.
- `userId`: The email of the current user.
- `identifyOnTrack` (optional, default: `false`): If set to `true`, the tracker ensures that user traits are updated automatically whenever an event is tracked.

### Tracking Events

Track an event with user traits:

```javascript
tracker.trackEvent("button_clicked", { plan: "pro" });
```

If `identifyOnTrack` was set to `true` at the time of initialization and user traits are passed, the SDK ensures that the profile traits remain up to date.

### Identifying Users

Identify a user with additional traits at any time to update their profile:

```javascript
tracker.identifyUser({ plan: "pro" });
```

## Using in a React App with Context

For efficient usage in a React app, create a context to manage the `EventTracker` instance globally:

```javascript
import React, { createContext, useContext, useMemo } from "react";
import EventTracker from "userlens-analytics-sdk";

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const tracker = useMemo(() => new EventTracker("your-write-code", "user@example.com", true), []);

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


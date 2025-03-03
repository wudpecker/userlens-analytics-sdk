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

# Introduction
We offer a lightweight and flexible event tracking SDK designed to give you full control over how you collect and forward user events. Whether you prefer a fire-and-forget approach or need granular control over each event, we've got you covered. The package is framework agnostic and can be used within any frontend project as well as in pure JavaScript.

## Two Ways to Track Events
### Automatic Event Collection (Set Up Once & Watch)
Use the `EventCollector` class to automatically capture and collect events. Simply initialize it with a callback and it will continiously collect events for you. You'll receive events in the callback, allowing you to process and forward them to your own API endpoint.

### Manual Event Tracking (Track Every Event Explicitly)
If you need more control, you can manually track events by adding event handlers wherever necessary. These events are sent to your own tracking endpoint, where you process them before forwarding them to our backend. This approach ensures you only track exactly what you need, when you need it.

# Automatic approach with EventCollector
The EventCollector class makes event tracking effortless by automatically capturing user interactions and batching them for processing. Simply initialize it with a callback function, and it will handle the rest.

## How It Works
- Captures Click Events: Tracks clicks on elements and stores the event data.
- Uses Local Storage for Persistence: Ensures events are not lost between page reloads.
- Batches Events: Periodically sends collected events to the provided callback.
- Send Events to Your Backend: The callback passed to `EventCollector` must send captured events to your API endpoint.
- Process Payload on Your Backend: Receive events and append `userId` from decoded JWT (if applicable) and `traits` to keep user object fresh.

## Installation
First, make sure to install the package.

```sh
npm i userlens-analytics-sdk
```

## Client Side Usage
### Import
Import and initialize `EventCollector`:

```javascript
import EventCollector from "userlens.js";
```

### Create API call function
Create a function that is going to receive a payload with events and send it to your API endpoint.

```javascript
export const trackEvents = (payload) => {
  return new Promise((resolve, reject) => {
    axios
      .post(`https://your.backend.io/events`, payload, {
        headers: {
          Authorization: `JWT ${get().token}`,
        }
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.log("error", error);
        reject(error);
      });
  })
}
```

### Initialize 
The best way to initialize `EventCollector` will vary depending on your frontend set up. In a React/NextJS project you would initialize it on client side in your project layout. In this example we present how we are implementing `EventCollector` on our frontend.

```javascript
"use client";

import React, { useEffect } from "react";

import Sidebar from "@/components/Sidebar";

// import function that makes API call
import { trackEvents } from "@/services/events";
// import EventCollector class
import EventCollector from "userlens-analytics-sdk/src/EventCollector";

export default function layout({ children }) {
  // wrap init EventCollector in useEffect to avoid init on every rerender
  useEffect(() => {
    // init EventCollector
    new EventCollector((events) => { // receive events in callback
      // call events tracking function
      trackEvents({
        payload: {
          events: events
        },
      })
        // optionally handle success
        .then((response) => {
          console.log(response);
        })
        // optionally handle error
        .catch((err) => {
          console.log(err);
        })
    })
  }, []);

  return (
    <div
      id="top-layout-div"
      className="w-[100vw] h-[100vh] flex bg-orange-50 text-neutral-700"
    >
      <Sidebar />
      <main
        id="main-container"
        className="bg-white flex-1 my-3 mr-3 relative rounded-xl border shadow-light border-neutral-100 overflow-y-auto p-8"
      >
        {children}
      </main>
    </div>
  );
}
```

### EventCollector Constructor Parameters

| Parameter     | Type      | Default  | Description |
|--------------|----------|----------|-------------|
| `callback`   | Function | Required | Function that receives batched events for processing. |
| `intervalTime` | Number   | `5000` (5s) | How often (in milliseconds) events should be sent. |

### Important note
Our SDK records click events and takes an XPath of target element. We strongly recommend adding static IDs to all important for event tracking elements. This will ensure that events are mapped correctly and not a single event is ever missed.

## Server Side
Next, you need to create an endpoint on your backend that is going to receive events from your frontend, append user object and forward events to Userlens raw events service.

The implementation will depend on your backend framework and authentication used. In this section we provide two examples with Django Rest Framework and ExpressJS JWT authentication.

### Django Rest Framework
In this example we receive user from request, prepare API key, send identify request, append userId to each event in events list received from frontend and record events in batch.

```python
@api_view(['POST'])
def track_events(request):
    payload = request.data.get("payload", None)
    if not payload:
        return Response("No payload", status=status.HTTP_400_BAD_REQUEST)
    profile = request.user.profile
    userId = profile.user.email
    profile_serialized = ProfileModelSerializer(profile, many=False).data
    api_key = "<your_api_key" # Can be retrieved from your Userlens settings page

    api_key = api_key + ":" # append colon to your api_key
    header = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {base64.b64encode(api_key.encode()).decode()}" # base64 encode your api_key
    }
    # send 'identify' request to keep user profile updated
    identify_url = "https://events.userlens.io/event"
    identify_payload = {
        "type": "identify",
        "userId": userId, 
        "source": "python-sdk",
        "traits": profile_serialized
    }
    requests.post(identify_url, headers=header, json=identify_payload)

    # append userId to each event in received list of events.
    for event in payload.get("events", []):
        event["userId"] = userId
    track_url = "https://raw.userlens.io/raw/event"
    requests.post(track_url, headers=header, json=payload)

    return Response("OK")
```

### Express.js
In this example, we extract the JWT token from the Authorization header, verify it using a secret key, and decode the user's email from the token. If the token is missing or invalid, we return an unauthorized response. Normally, you’d handle this in middleware to keep things cleaner, but here, we’ve done it directly inside the endpoint for clarity—how you structure it is up to your setup. After extracting the user, we prepare the API key and send an identify request to update the user profile in Userlens. We then append the userId to each event in the received list before sending the batched events to Userlens for tracking.

```javascript
const express = require("express");
const axios = require("axios");
const base64 = require("base-64");
const jwt = require("jsonwebtoken"); // JWT decoding
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "<your_secret_key>"; // Replace or use env var

app.post("/track-events", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1];

  let user;
  try {
    const decodedUser = jwt.verify(token, JWT_SECRET); // Decode JWT
    user = decodedUser; // Assuming email is stored in JWT
  } catch (error) {
    return res.status(401).send("Unauthorized: Invalid token");
  }

  const { payload } = req.body;

  if (!payload) {
    return res.status(400).send("No payload");
  }

  // Prepare API Key
  const apiKey = "<your_api_key>:"; // Note that there's a colon in the end of string
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${base64.encode(apiKey)}`,
  };

  // Send 'identify' request to keep user profile updated
  const identifyUrl = "https://events.userlens.io/event";
  const identifyPayload = {
    type: "identify",
    userId: user.email,
    source: "node-sdk",
    traits: { plan: user.plan, lastActive: user.lastActive, }, // append dynamic traits
  };

  try {
    await axios.post(identifyUrl, identifyPayload, { headers });

    // Append userId to each event
    payload.events.forEach((event) => {
      event.userId = userId;
    });

    // Send tracked events
    const trackUrl = "https://raw.userlens.io/raw/event";
    await axios.post(trackUrl, payload, { headers });

    res.send("OK");
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).send("Error tracking events");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

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


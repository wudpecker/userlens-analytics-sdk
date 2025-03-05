# Automatic Approach

## Table of Contents
- [Introduction](#introduction)
- [How It Works](#how-it-works)
- [Usage](#usage)
  - [Installation](#installation)
  - [Client Side](#client-side)
    - [Import](#import)
    - [Create API Call Function](#create-api-call-function)
    - [Initialize](#initialize)
    - [EventCollector Constructor Parameters](#eventcollector-constructor-parameters)
    - [Important Note](#important-note)
  - [Server Side](#server-side)
    - [Django Rest Framework](#django-rest-framework)
    - [Express.js](#expressjs)
     
# Introduction
We offer a lightweight and flexible event tracking SDK designed to give you full control over how you collect and forward user events. Whether you prefer a fire-and-forget approach or need granular control over each event, we've got you covered. The package is framework agnostic and can be used within any frontend project as well as in pure JavaScript.

Use the `EventCollector` class to automatically capture and collect events. Simply initialize it with a callback and it will continiously collect events for you. You'll receive events in the callback, allowing you to process and forward them to your own API endpoint.

## How It Works
- Captures Click Events: Tracks clicks on elements and stores the event data.
- Uses Local Storage for Persistence: Ensures events are not lost between page reloads.
- Batches Events: Periodically sends collected events to the provided callback.
- Send Events to Your Backend: The callback passed to `EventCollector` must send captured events to your API endpoint.
- Process Payload on Your Backend: Receive events and append `userId` from decoded JWT (if applicable) and `traits` to keep user object fresh.

# Usage
## Installation
First, make sure to install the package on your frontend project.

```sh
npm i userlens-analytics-sdk
```

## Client Side
### Import
Import and initialize `EventCollector`:

```javascript
import EventCollector from "userlens-analytics-sdk/src/EventCollector";
```

### Create API call function
Create a function that is going to receive a payload with events and send it to your API endpoint.

```javascript
export const trackEvents = (payload) => {
  return new Promise((resolve, reject) => {
    axios
      .post(`https://your.backend.io/events`, payload, {
        headers: {
          Authorization: `JWT <user_auth_token>`,
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
// Route Protected layout (for authenticated users)
// app/(navigation)/layout.js
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
Our SDK records click events and takes an XPath of target element to identify it. We strongly recommend adding static IDs to all important for event tracking elements. This will ensure that events are mapped correctly and not a single event is ever missed.

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

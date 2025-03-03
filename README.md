# Userlens.js - SDK Documentation
We offer a lightweight and flexible event tracking SDK designed to give you full control over how you collect and forward user events.
What's special about our SDK design is you implement it once and then you can forget it.

# How it works
We use the `EventCollector` class to auto-capture and collect events. Simply initialize it with a callback and it will continiously collect events for you. You'll receive events in the callback, allowing you to process and forward them to your own API endpoint. [Automatic Approach](./AutomaticApproach.md)

However, if you prefer more granular control over each event, you can manually track events by adding event handlers wherever necessary. These events are sent to your own tracking endpoint, where you process them before forwarding them to our backend. 

While we strongly recommend the set-it-and-forget-it approach mentioned above, here is the instruction for more granular control [Manual Approach](./ManualApproach.md)

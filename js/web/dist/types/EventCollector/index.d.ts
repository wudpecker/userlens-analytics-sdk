import { EventCollectorConfig, PushedEvent } from "../types";
export default class EventCollector {
    #private;
    private callback;
    private intervalTime;
    private events;
    private userContext;
    constructor(callback: EventCollectorConfig["callback"], intervalTime?: EventCollectorConfig["intervalTime"]);
    pushEvent(event: PushedEvent): void;
    stop(): void;
}

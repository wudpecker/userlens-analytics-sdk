import { PushedEvent } from "../types";
export default class EventCollector {
    #private;
    private callback;
    private intervalTime;
    private events;
    private userContext;
    constructor(callback: (events: any[]) => void, intervalTime?: number);
    pushEvent(event: PushedEvent): void;
    stop(): void;
}

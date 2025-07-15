import { EventCollectorConfig } from "../types";
export default class EventCollector {
    #private;
    private userId?;
    private userTraits?;
    private autoUploadModeEnabled;
    private callback?;
    private intervalTime;
    private events;
    private userContext;
    private debug;
    constructor({ userId, userTraits, WRITE_CODE, callback, intervalTime, }: EventCollectorConfig);
    pushEvent(event: {
        event: string;
        properties?: Record<string, any>;
    }): void;
    updateUserTraits(newUserTraits: Record<string, any>): void;
    stop(): void;
    private getUserContext;
}

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
    constructor(config: EventCollectorConfig);
    pushEvent(event: {
        event: string;
        properties?: Record<string, any>;
    }): void;
    updateUserTraits(newUserTraits: Record<string, any>): void;
    stop(): void;
    private getUserContext;
}

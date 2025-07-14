import type { eventWithTime } from "rrweb";
import { PushedEvent, PageViewEvent, RawEvent } from "../types";
export declare const identify: (user: {
    userId: string;
    traits: Record<string, any>;
}) => Promise<"ok" | undefined>;
export declare const track: (events: (PushedEvent | PageViewEvent | RawEvent)[]) => Promise<string>;
export declare const uploadSessionEvents: (userId: string, sessionUuid: string, events: eventWithTime[], chunkTimestamp: number) => Promise<string>;

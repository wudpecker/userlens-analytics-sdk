import { SessionRecorderConfig } from "../types";
export default class SessionRecorder {
    #private;
    private userId;
    private TIMEOUT;
    private BUFFER_SIZE;
    private maskingOptions;
    private sessionUuid;
    private sessionEvents;
    private rrwebStop;
    constructor({ WRITE_CODE, userId, recordingOptions, }: SessionRecorderConfig);
    stop(): void;
}

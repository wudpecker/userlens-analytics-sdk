import { SessionRecorderConfig } from "../types";
export default class SessionRecorder {
    #private;
    private WRITE_CODE;
    private userId;
    private TIMEOUT;
    private BUFFER_SIZE;
    private maskingOptions;
    private sessionUuid;
    private sessionEvents;
    private rrwebControl;
    constructor({ WRITE_CODE, userId, recordingOptions, }: SessionRecorderConfig);
}

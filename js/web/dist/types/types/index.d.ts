export interface UserContext {
    $ul_browser: string;
    $ul_browser_version: string;
    $ul_os: string;
    $ul_os_version: string;
    $ul_browser_language: string;
    $ul_browser_language_prefix: string;
    $ul_screen_width: number;
    $ul_screen_height: number;
    $ul_viewport_width: number;
    $ul_viewport_height: number;
    $ul_current_url: string;
    $ul_pathname: string;
    $ul_host: string;
    $ul_referrer: string;
    $ul_referring_domain: string;
    $ul_lib: string;
    $ul_lib_version: string;
    $ul_device_type: "Mobile" | "Desktop";
    $ul_timezone: string;
}
export interface DOMSnapshotNode {
    text: string | null;
    tag_name: string;
    attr_class: string[] | null;
    href: string | null;
    attr_id: string | null;
    nth_child: number;
    nth_of_type: number;
    attributes: Record<string, string>;
}
export interface RawEvent {
    event: string;
    is_raw: true;
    snapshot: DOMSnapshotNode[];
    current_url: string;
    properties: UserContext;
}
export interface PushedEvent {
    event: string;
    properties?: Record<string, any>;
}
interface PageViewEventProperties {
    page: string | null;
    referrer?: string | null;
    query: Record<string, string>;
}
export interface PageViewEvent {
    event: string;
    properties: PageViewEventProperties;
}
export type MaskingOption = "passwords" | "all";
export interface SessionRecordingOptions {
    TIMEOUT?: number;
    BUFFER_SIZE?: number;
    maskingOptions?: MaskingOption[];
}
export interface SessionRecorderConfig {
    WRITE_CODE: string;
    userId: string;
    recordingOptions?: SessionRecordingOptions;
}
export {};

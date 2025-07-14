// EventCollector
export type EventCollectorConfig = {
  userId: string;
  userTraits?: Record<string, any>;
  WRITE_CODE: string;
  callback?: (events: (PushedEvent | PageViewEvent | RawEvent)[]) => void;
  intervalTime?: number;
};

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
  userId?: string;
  event: string;
  is_raw: true;
  snapshot: DOMSnapshotNode[];
  current_url: string;
  properties: UserContext;
}

export interface PushedEvent {
  userId?: string;
  event: string;
  is_raw: false;
  properties?: Record<string, any>;
}

interface PageViewEventProperties {
  $ul_page: string | null;
  $ul_referrer?: string | null;
  $ul_query: Record<string, string>;
}

export interface PageViewEvent {
  userId?: string;
  event: string;
  properties: PageViewEventProperties;
}

// SessionRecorder
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

// react
export type UserlensProviderConfig = {
  WRITE_CODE: string;
  userId: string;
  userTraits: Record<string, any>;
  eventCollector: EventCollectorConfig;
  enableSessionReplay?: boolean;
  sessionRecorder?: SessionRecordingOptions;
};

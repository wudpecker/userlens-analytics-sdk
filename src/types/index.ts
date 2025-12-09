// EventCollector
export type AutoUploadConfig = {
  userId: string;
  skipRawEvents?: boolean;
  WRITE_CODE: string;
  userTraits?: Record<string, any>;
  groupTraits?: Record<string, any>;
  groupId?: string;
  callback?: undefined;
  intervalTime?: number;
  useLighterSnapshot?: boolean;
  debug?: boolean;
};

export type CallbackModeConfig = {
  callback: (events: (PushedEvent | PageViewEvent | RawEvent)[]) => void;
  userId?: undefined;
  WRITE_CODE?: undefined;
  intervalTime?: number;
  skipRawEvents?: boolean;
  useLighterSnapshot?: boolean;
  debug?: boolean;
};

export type EventCollectorConfig = AutoUploadConfig | CallbackModeConfig;

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
  $ul_lib: string;
  $ul_lib_version: string;
  $ul_device_type: "Mobile" | "Desktop";
  $ul_timezone: string;
}

export type PageMetadata = {
  $ul_page: string;
  $ul_pathname: string;
  $ul_host: string;
  $ul_referrer: string;
  $ul_referring_domain: string;
  $ul_query: string;
};

export type SnapshotNode = {
  tag_name: string;
  attr_class?: string[];
  attr_id?: string;
  href?: string;
  nth_child: number;
  nth_of_type: number;
  attributes: Record<string, string>;
  text?: string;
  is_target?: true;
  leads_to_target?: true;
  children?: SnapshotNode[];
};

export type SnapshotOptions = {
  isTarget?: boolean;
  includeChildren?: boolean;
  leadsToTarget?: boolean;
};

export interface RawEvent {
  userId?: string;
  event: string;
  is_raw: true;
  snapshot: SnapshotNode[];
  properties: UserContext;
}

export interface PushedEvent {
  userId?: string;
  event: string;
  is_raw: false;
  properties?: Record<string, any>;
}

export interface PageViewEvent {
  userId?: string;
  event: string;
  properties: PageMetadata;
}

// react
export type UserlensProviderConfig = {
  WRITE_CODE: string;
  userId: string;
  userTraits: Record<string, any>;
  groupTraits?: Record<string, any>;
  groupId?: string;
  eventCollector?: EventCollectorConfig;
};

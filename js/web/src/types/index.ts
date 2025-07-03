// EventCollector
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
}

export interface PushedEvent {
  event: string;
}

interface PageViewEventProperties {
  referrer: string;
  query: Record<string, string>;
}

export interface PageViewEvent {
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

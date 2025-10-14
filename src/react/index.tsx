import { createContext, useContext, useEffect, useState, useRef } from "react";

import EventCollector from "../EventCollector";
import SessionRecorder from "../SessionRecorder";
import { UserlensProviderConfig, EventCollectorConfig } from "../types";

type UserlensContextType = {
  collector: EventCollector | null;
  sessionRecorder: SessionRecorder | null;
};

const UserlensContext = createContext<UserlensContextType>({
  collector: null,
  sessionRecorder: null,
});

const UserlensProvider: React.FC<{
  children: React.ReactNode;
  config?: UserlensProviderConfig;
}> = ({ children, config }) => {
  const [eventCollector, setEventCollector] = useState<EventCollector | null>(
    null
  );
  const [sessionRecorder, setSessionRecorder] =
    useState<SessionRecorder | null>(null);

  const collectorRef = useRef<EventCollector | null>(null);
  const sessionRecorderRef = useRef<SessionRecorder | null>(null);

  const lastUserIdRefEc = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (typeof window === "undefined") {
      console.error(
        "UserlensProvider: unavailable outside of browser environment."
      );
      return;
    }

    if (!config) {
      console.error("UserlensProvider: config is required.");
      return;
    }

    if (lastUserIdRefEc?.current === config?.userId) {
      return;
    }
    lastUserIdRefEc.current = config?.userId;

    // prevent double instantiation
    if (collectorRef.current) {
      console.warn("UserlensProvider: EventCollector already initialized.");
      return;
    }

    let ecConfig: EventCollectorConfig;
    if (typeof config?.eventCollector?.callback === "function") {
      ecConfig = {
        callback: config?.eventCollector?.callback,
        intervalTime: config?.eventCollector?.intervalTime,
        skipRawEvents: config?.eventCollector?.skipRawEvents,
        useLighterSnapshot: config?.eventCollector?.useLighterSnapshot,
      };
    } else {
      ecConfig = {
        userId: config?.userId,
        WRITE_CODE: config?.WRITE_CODE,
        userTraits: config?.userTraits,
        intervalTime: config?.eventCollector?.intervalTime,
        skipRawEvents: config?.eventCollector?.skipRawEvents,
        useLighterSnapshot: config?.eventCollector?.useLighterSnapshot,
      };
    }

    const collector = new EventCollector(ecConfig);
    collectorRef.current = collector;
    setEventCollector(collector);
  }, [config?.userId]);

  useEffect(() => {
    if (!config?.userTraits) return;
    if (!eventCollector) return;

    eventCollector?.updateUserTraits(config?.userTraits);
  }, [config?.userTraits]);

  const lastUserIdRefSr = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!config) {
      console.error("UserlensProvider: config is required.");
      return;
    }

    if (config?.enableSessionReplay === false) {
      return;
    }
    if (!config?.WRITE_CODE || !config?.userId) {
      console.error(
        "UserlensProvider: WRITE_CODE and userId are required for session recording."
      );
      return;
    }
    if (lastUserIdRefSr?.current === config?.userId) {
      return;
    }
    if (sessionRecorderRef?.current) {
      console.warn("UserlensProvider: SessionRecorder already initialized.");
      return;
    }

    lastUserIdRefSr.current = config?.userId;
    const sr = new SessionRecorder({
      WRITE_CODE: config?.WRITE_CODE,
      userId: config?.userId,
      recordingOptions: config?.sessionRecorder,
    });
    sessionRecorderRef.current = sr;
    setSessionRecorder(sr);

    return () => {
      sr?.stop();
    };
  }, [config?.userId, config?.enableSessionReplay]);

  return (
    <UserlensContext.Provider
      value={{
        collector: eventCollector,
        sessionRecorder: sessionRecorder,
      }}
    >
      {children}
    </UserlensContext.Provider>
  );
};

export const useUserlens = (): UserlensContextType => {
  const ctx = useContext(UserlensContext);
  if (!ctx) {
    throw new Error("useUserlens must be used within a <UserlensProvider>");
  }
  return ctx;
};
export default UserlensProvider;

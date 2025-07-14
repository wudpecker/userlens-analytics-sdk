import { createContext, useContext, useEffect, useRef } from "react";

import EventCollector from "../EventCollector";
import SessionRecorder from "../SessionRecorder";
import { UserlensProviderConfig } from "../types";

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

    const autoUploadModeEnabled =
      typeof config?.eventCollector?.callback !== "function" ? true : false;
    const ecConfig = {
      userId: config?.userId,
      userTraits: config?.userTraits,
      WRITE_CODE: config?.WRITE_CODE,
      ...(autoUploadModeEnabled && {
        callback: config?.eventCollector?.callback,
      }),
    };

    collectorRef.current = new EventCollector(ecConfig);
  }, [config?.userId]);

  useEffect(() => {
    if (!config?.userTraits) return;
    if (!collectorRef?.current) return;

    collectorRef?.current?.updateUserTraits(config?.userTraits);
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

    return () => {
      sr?.stop();
    };
  }, [config?.userId, config?.enableSessionReplay]);

  return (
    <UserlensContext.Provider
      value={{
        collector: collectorRef?.current,
        sessionRecorder: sessionRecorderRef?.current,
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

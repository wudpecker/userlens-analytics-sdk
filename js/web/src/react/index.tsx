import { createContext, useContext, useEffect, useState, useRef } from "react";

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
  const [collector, setCollector] = useState<EventCollector | null>(null);
  const [sessionRecorder, setSessionRecorder] =
    useState<SessionRecorder | null>(null);

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

    if (!config.eventCollector.callback) {
      console.error(
        "UserlensProvider: config.eventCollector.callback is required."
      );
      return;
    }

    const ec = new EventCollector(
      config.eventCollector.callback,
      config.eventCollector.intervalTime
    );
    setCollector(ec);

    return () => {
      if (ec) {
        ec?.stop();
      }
    };
  }, []);

  const lastUserIdRef = useRef<string | undefined>(undefined);
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

    if (lastUserIdRef?.current === config?.userId) {
      return;
    }

    const sr = new SessionRecorder({
      WRITE_CODE: config?.WRITE_CODE,
      userId: config?.userId,
      recordingOptions: config?.sessionRecorder,
    });

    setSessionRecorder(sr);

    return () => {
      sr?.stop();
    };
  }, [config?.userId, config?.enableSessionReplay]);

  return (
    <UserlensContext.Provider value={{ collector, sessionRecorder }}>
      {children}
    </UserlensContext.Provider>
  );
};

export const useUserlens = () => useContext(UserlensContext);
export default UserlensProvider;

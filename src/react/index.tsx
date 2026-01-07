import { createContext, useContext, useEffect, useRef, useState } from "react";

import EventCollector from "../EventCollector";
import { UserlensProviderConfig, EventCollectorConfig } from "../types";

type UserlensContextType = {
  collector: EventCollector | null;
};

const UserlensContext = createContext<UserlensContextType>({
  collector: null,
});

const UserlensProvider: React.FC<{
  children: React.ReactNode;
  config?: UserlensProviderConfig;
}> = ({ children, config }) => {
  const [eventCollector, setEventCollector] = useState<EventCollector | null>(
    null
  );

  const collectorRef = useRef<EventCollector | null>(null);

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

    // Cleanup previous collector if userId changed
    if (collectorRef.current) {
      collectorRef.current.stop();
      collectorRef.current = null;
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
        groupId: config?.groupId,
        groupTraits: config?.groupTraits,
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

    // Cleanup on unmount or before re-running effect
    return () => {
      collectorRef.current?.stop();
      collectorRef.current = null;
    };
  }, [config?.userId]);

  useEffect(() => {
    if (!config?.userTraits) return;
    if (!eventCollector) return;

    eventCollector?.updateUserTraits(config?.userTraits);
  }, [config?.userTraits]);

  return (
    <UserlensContext.Provider
      value={{
        collector: eventCollector,
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

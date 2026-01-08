import { createContext, useContext, useEffect, useState, useRef } from "react";

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
        trackNetworkCalls: config?.eventCollector?.trackNetworkCalls,
        networkCaptureBody: config?.eventCollector?.networkCaptureBody,
        networkMaxBodySize: config?.eventCollector?.networkMaxBodySize,
        networkIgnoreUrls: config?.eventCollector?.networkIgnoreUrls,
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
        trackNetworkCalls: config?.eventCollector?.trackNetworkCalls,
        networkCaptureBody: config?.eventCollector?.networkCaptureBody,
        networkMaxBodySize: config?.eventCollector?.networkMaxBodySize,
        networkIgnoreUrls: config?.eventCollector?.networkIgnoreUrls,
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

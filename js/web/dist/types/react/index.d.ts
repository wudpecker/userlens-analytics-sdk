import EventCollector from "../EventCollector";
import SessionRecorder from "../SessionRecorder";
import { UserlensProviderConfig } from "../types";
type UserlensContextType = {
    collector: EventCollector | null;
    sessionRecorder: SessionRecorder | null;
};
declare const UserlensProvider: React.FC<{
    children: React.ReactNode;
    config?: UserlensProviderConfig;
}>;
export declare const useUserlens: () => UserlensContextType;
export default UserlensProvider;

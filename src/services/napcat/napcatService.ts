import { NCWebsocket } from "node-napcat-ts";
import { napcatConfig } from "../../config/napcat.ts";
import { syncAllMembersOnStart, watchGroupEvents } from "./groupSyncService.ts";

// ↓ 是否开启 DEBUG 模式
const napcat = new NCWebsocket(napcatConfig, false);
await napcat.connect()
syncAllMembersOnStart(napcat);
watchGroupEvents(napcat);

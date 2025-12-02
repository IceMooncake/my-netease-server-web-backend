import { NCWebsocket } from "node-napcat-ts";
import { napcatConfig } from "../../config/napcat.js";
import { syncAllMembersOnStart, watchGroupEvents } from "./groupSyncService.js";

// ↓ 是否开启 DEBUG 模式
const napcat = new NCWebsocket(napcatConfig, false);
await napcat.connect()
syncAllMembersOnStart()
watchGroupEvents()
export { napcat }
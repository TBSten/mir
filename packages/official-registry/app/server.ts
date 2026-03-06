import { createApp } from "honox/server";
import { createRegistryRoutes, createStaticProtocolRoutes } from "@mir/registry-sdk";
import { staticProvider } from "./lib/provider.js";

const app = createApp();

// API ルート (registry-sdk)
app.route("/", createRegistryRoutes(staticProvider));

// 静的プロトコルルート (CLI 用)
app.route("/registry", createStaticProtocolRoutes(staticProvider));

export default app;

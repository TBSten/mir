import { createApp } from "honox/server";
import { createRegistryRoutes } from "@mir/registry-sdk";
import { staticProvider } from "./lib/provider.js";

const app = createApp();

// API ルート (registry-sdk)
app.route("/", createRegistryRoutes(staticProvider));

export default app;

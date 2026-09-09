import { createApp } from "./app";

const port = Number(process.env.API_PORT ?? 3000);
createApp().listen({ port, hostname: "0.0.0.0" });
console.log(`ToolsDice API listening on http://localhost:${port}`);

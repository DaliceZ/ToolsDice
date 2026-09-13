import { app } from "./index";

const port = Number(process.env.API_PORT ?? 3000);
app.listen({ port, hostname: "0.0.0.0" });
console.log(`ToolsDice API listening on http://localhost:${port}`);

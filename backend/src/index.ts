import { Elysia } from "elysia";
import { createApp } from "./application";

export const app = createApp(new Elysia());

// Vercel detects this Elysia default export as a Bun Function.
export default app;

import { createApp } from "./app";

export const app = createApp();

// Vercel detects this Elysia default export as a Bun Function.
export default app;

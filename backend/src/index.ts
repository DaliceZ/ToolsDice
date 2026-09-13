import { createApp } from "./application";

export const app = createApp();

// Vercel detects this Elysia default export as a Bun Function.
export default app;

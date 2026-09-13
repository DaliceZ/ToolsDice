import { uiText } from "@/lib/ui-text";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "./App";
import { Dashboard } from "./pages/Dashboard";
import { PreferencesProvider } from "./lib/preferences";
import { LanguageProvider } from "./lib/language";
import { ThemeProvider } from "./lib/theme";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/sarabun/latin-400.css";
import "@fontsource/sarabun/latin-500.css";
import "@fontsource/sarabun/latin-600.css";
import "@fontsource/sarabun/latin-700.css";
import "@fontsource/sarabun/thai-400.css";
import "@fontsource/sarabun/thai-500.css";
import "@fontsource/sarabun/thai-600.css";
import "@fontsource/sarabun/thai-700.css";
import "./index.css";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
      {
        path: "/categories/:categorySlug",
        lazy: async () => ({
          Component: (await import("./pages/CategoryPage")).CategoryPage,
        }),
      },
      {
        path: "/tools/:toolSlug",
        lazy: async () => ({
          Component: (await import("./pages/ToolWorkspace")).ToolWorkspace,
        }),
      },
      {
        path: "*",
        element: (
          <div className="mx-auto max-w-xl py-24 text-center">
            <p className="text-7xl font-black text-primary">404</p>
            <h1 className="mt-4 text-2xl font-bold">{uiText("ไม่พบหน้าที่ต้องการ")}</h1>
            <a className="mt-5 inline-block text-primary underline" href="/">
              {uiText("กลับหน้าแรก")}</a>
          </div>
        ),
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <RouterProvider router={router} />
            </PreferencesProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
  </React.StrictMode>,
);

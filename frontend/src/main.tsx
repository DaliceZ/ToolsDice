import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "./App";
import { Dashboard } from "./pages/Dashboard";
import { PreferencesProvider } from "./lib/preferences";
import "./index.css";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
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
            <p className="text-7xl font-black text-blue-400">404</p>
            <h1 className="mt-4 text-2xl font-bold">ไม่พบหน้าที่ต้องการ</h1>
            <a className="mt-5 inline-block text-blue-500 underline" href="/">
              กลับหน้าแรก
            </a>
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
      <PreferencesProvider>
        <RouterProvider router={router} />
      </PreferencesProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

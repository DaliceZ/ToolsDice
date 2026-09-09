import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "@/lib/preferences";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("shows all tool cards without persisting editor input", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <PreferencesProvider>
          <MemoryRouter>
            <Dashboard />
          </MemoryRouter>
        </PreferencesProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("JSON Toolkit")).toBeInTheDocument();
    expect(screen.getAllByText(/เปิดเครื่องมือ/)).toHaveLength(12);
    const keys = Array.from(
      { length: localStorage.length },
      (_, index) => localStorage.key(index) ?? "",
    );
    expect(keys.some((key) => key.includes("input"))).toBe(false);
  });
});

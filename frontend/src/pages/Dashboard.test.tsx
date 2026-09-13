import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { PreferencesProvider } from "@/lib/preferences";
import { LanguageProvider } from "@/lib/language";
import { Dashboard } from "./Dashboard";

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

function renderDashboard() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LanguageProvider>
        <PreferencesProvider>
          <MemoryRouter>
            <Dashboard />
            <CurrentPath />
          </MemoryRouter>
        </PreferencesProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Dashboard", () => {
  it("shows only nine categories, keeps favorites visible, and has no recent row", () => {
    localStorage.setItem("tfd:favorites", JSON.stringify(["json-toolkit"]));
    renderDashboard();

    expect(screen.getByRole("heading", { name: "ToolsDice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Explore 9 categories/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    expect(screen.getByText("JSON Toolkit")).toBeInTheDocument();
    expect(screen.queryByText("ใช้ล่าสุด")).not.toBeInTheDocument();
    expect(document.querySelectorAll('a[href^="/categories/"]')).toHaveLength(9);
    expect(screen.queryByRole("link", { name: "เปิด JSON Toolkit" })).not.toBeInTheDocument();

    const keys = Array.from(
      { length: localStorage.length },
      (_, index) => localStorage.key(index) ?? "",
    );
    expect(keys).not.toContain("tfd:recent");
    expect(keys.some((key) => key.includes("input"))).toBe(false);
  });

  it("opens a keyboard-friendly autocomplete and navigates to the selected tool", async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Search tools" }));
    const search = screen.getByRole("combobox", { name: "Search tools" });
    fireEvent.change(search, { target: { value: "JSON" } });
    const option = await screen.findByRole("option", { name: /JSON Toolkit/ });
    expect(option).toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByLabelText("Current route")).toHaveTextContent("/tools/json-toolkit"),
    );
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

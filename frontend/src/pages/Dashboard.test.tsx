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

function renderDashboard(language: "th" | "en" | "default" = "en") {
  if (language !== "default") {
    localStorage.setItem("tfd:language", language);
    localStorage.setItem("tfd:language-selected", "true");
  }
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
  it("defaults to Thai when there is no saved language choice", () => {
    renderDashboard("default");

    expect(document.documentElement.lang).toBe("th");
    expect(document.documentElement.dataset.language).toBe("th");
    expect(screen.getByRole("heading", { name: /สำรวจ 8 หมวดหมู่/ })).toBeInTheDocument();
  });

  it("shows only eight categories, keeps favorites visible, and has no recent row", () => {
    localStorage.setItem("tfd:favorites", JSON.stringify(["api-client"]));
    renderDashboard();

    expect(screen.getByRole("heading", { name: "ToolsDice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Explore 8 categories/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    expect(screen.getByText("API Request Builder")).toBeInTheDocument();
    expect(screen.queryByText("ใช้ล่าสุด")).not.toBeInTheDocument();
    expect(document.querySelectorAll('a[href^="/categories/"]')).toHaveLength(8);
    expect(screen.queryByRole("link", { name: "Open API Request Builder" })).not.toBeInTheDocument();

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
    fireEvent.change(search, { target: { value: "API" } });
    const option = await screen.findByRole("option", { name: /API Request Builder/ });
    expect(option).toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByLabelText("Current route")).toHaveTextContent("/tools/api-client"),
    );
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

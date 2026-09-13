import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

test("overview, category navigation, autocomplete, and local tools work in English", async ({ page }) => {
  const configResponsePromise = page.waitForResponse(/\/api\/v1\/config$/);
  await page.goto("/");
  const configResponse = await configResponsePromise;
  expect(configResponse.ok()).toBe(true);
  const configEnvelope = await configResponse.json() as {
    data: { appName: string; enabledToolIds: string[] };
  };
  expect(configEnvelope.data.appName).toBe("ToolsDice");
  expect(configEnvelope.data.enabledToolIds).toContain("checklist");

  await expect(page.getByRole("heading", { name: "ToolsDice", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Explore 9 categories/ })).toBeVisible();
  await expect(page.locator(".category-overview-grid a[href^='/categories/']")).toHaveCount(9);
  await expect(page.getByText("All tools", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Recently used")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Portfolio" })).toBeVisible();
  await expect(page.locator(".topbar-actions > .portfolio-link")).toHaveCount(1);
  await expect(page.locator(".app-topbar .portfolio-link")).toHaveCSS("cursor", "pointer");

  const orbitGeometry = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>(".hero-title");
    const wrapper = document.querySelector<HTMLElement>(".hero-title-wrap");
    const orbit = wrapper?.querySelector<HTMLElement>(".orbit-field");
    if (!title || !wrapper || !orbit) return null;
    const titleRect = title.getBoundingClientRect();
    const orbitRect = orbit.getBoundingClientRect();
    return {
      selection: getComputedStyle(wrapper).userSelect,
      background: getComputedStyle(wrapper).backgroundColor,
      centerDeltaX: Math.abs((titleRect.left + titleRect.right) / 2 - (orbitRect.left + orbitRect.right) / 2),
      centerDeltaY: Math.abs((titleRect.top + titleRect.bottom) / 2 - (orbitRect.top + orbitRect.bottom) / 2),
      orbitWidth: orbitRect.width,
      titleWidth: titleRect.width,
      tracks: orbit.querySelectorAll(".orbit-track").length,
    };
  });
  expect(orbitGeometry).not.toBeNull();
  expect(orbitGeometry?.selection).toBe("none");
  expect(orbitGeometry?.background).toBe("rgba(0, 0, 0, 0)");
  expect(orbitGeometry?.centerDeltaX).toBeLessThan(2);
  expect(orbitGeometry?.centerDeltaY).toBeLessThan(2);
  expect(orbitGeometry?.orbitWidth).toBeGreaterThan(orbitGeometry?.titleWidth ?? 0);
  expect(orbitGeometry?.tracks).toBe(5);

  const sidebar = page.getByRole("complementary", { name: "Tools navigation" });
  await expect(sidebar.locator(".sidebar-heading")).toHaveCount(0);
  const overviewGutter = await page.locator(".dashboard-page").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingInlineStart),
  );
  expect(overviewGutter).toBeGreaterThanOrEqual(8);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const collapseSidebar = page.getByRole("banner").getByRole("button", { name: "Collapse sidebar" });
    await expect(collapseSidebar).toBeVisible();
    const sidebarRight = await sidebar.evaluate((element) => element.getBoundingClientRect().right);
    const toggleRight = await collapseSidebar.evaluate((element) => element.getBoundingClientRect().right);
    expect(Math.abs(toggleRight - sidebarRight)).toBeLessThan(1);
    await collapseSidebar.click();
    const expandSidebar = page.getByRole("banner").getByRole("button", { name: "Expand sidebar" });
    await expect(expandSidebar).toBeVisible();
    await expect.poll(async () => {
      return await sidebar.evaluate((element) => element.getBoundingClientRect().right);
    }).toBeLessThan(sidebarRight - 100);
    const stationaryButtonRight = await expandSidebar.evaluate((element) => element.getBoundingClientRect().right);
    expect(Math.abs(stationaryButtonRight - sidebarRight)).toBeLessThan(1);
    await expandSidebar.click();

    const textCategory = sidebar.getByRole("button", { name: /^Text\s+\d+$/ });
    await textCategory.click();
    await expect(sidebar.getByRole("link", { name: "Word Counter" })).toBeVisible();
    await expect(sidebar.locator("a[href^='/categories/']")).toHaveCount(0);
    await sidebar.getByRole("link", { name: "Word Counter" }).click();
    await expect(page).toHaveURL(/\/tools\/text-word-count$/);
    const sidebarBack = page.getByRole("link", { name: "Back to overview" });
    await expect(sidebarBack).toBeVisible();
    await sidebarBack.click();
    await expect(page).toHaveURL("/");
  } else {
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  }

  await page.locator(".category-overview-grid a[href='/categories/text']").click();
  await expect(page).toHaveURL(/\/categories\/text$/);
  await expect(page.getByRole("heading", { name: "Text", exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".category-page").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingInlineStart),
  )).toBeGreaterThanOrEqual(8);
  await expect(page.getByRole("link", { name: "Open Word Counter" })).toBeVisible();
  await page.getByRole("link", { name: "Open Word Counter" }).click();
  await expect(page).toHaveURL(/\/tools\/text-word-count$/);
  const categoryBack = page.getByRole("link", { name: "Back to Text" });
  await expect(categoryBack).toBeVisible();
  await categoryBack.click();
  await expect(page).toHaveURL(/\/categories\/text$/);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("link", { name: "Back to overview" })).toBeInViewport();

  await page.goto("/");
  await page.getByRole("button", { name: "Search tools" }).click();
  const search = page.getByRole("combobox", { name: "Search tools" });
  await search.fill("JSON");
  await expect(page.getByRole("option", { name: /JSON Toolkit/ })).toBeVisible();
  const searchTransition = await page.locator(".search-launcher").evaluate((element) => ({
    properties: getComputedStyle(element).transitionProperty,
    duration: getComputedStyle(element).transitionDuration,
  }));
  expect(searchTransition.properties).toContain("width");
  expect(searchTransition.duration).toContain("0.44s");
  await expect(search).toBeVisible();
  await page.getByRole("heading", { name: "ToolsDice", exact: true }).click();
  await expect(search).toHaveCount(0);
  await page.getByRole("button", { name: "Search tools" }).click();
  const expandedSearch = page.getByRole("combobox", { name: "Search tools" });
  await expect(expandedSearch).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Clear search" })).toBeFocused();
  for (let attempt = 0; attempt < 12 && await expandedSearch.count(); attempt++) {
    await page.keyboard.press("Tab");
  }
  await expect(expandedSearch).toHaveCount(0);
  await page.getByRole("button", { name: "Search tools" }).click();
  await page.getByRole("option", { name: /JSON Toolkit/ }).click();
  await expect(page).toHaveURL(/\/tools\/json-toolkit$/);
  await page.getByPlaceholder("Paste your data here…").fill('{"ok":true}');
  await expect(page.getByLabel("Result")).toHaveValue(/"ok": true/);
  await page.getByRole("combobox").first().selectOption("validate");
  await expect(page.getByRole("status").filter({ hasText: "Valid JSON" })).toBeVisible();
});

test("favorites, themes, and language menus keep all preferences local", async ({ page }) => {
  await page.goto("/categories/developer");
  await page.getByRole("button", { name: "Add to favorites: JSON Toolkit" }).click();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
  await expect(page.getByRole("link", { name: /JSON Toolkit/ })).toBeVisible();

  const language = page.getByRole("button", { name: "Language: English" });
  await language.click();
  await page.getByRole("menuitemradio", { name: /ไทย/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Sarabun");
  await expect(page.getByRole("heading", { name: /สำรวจ 9 หมวดหมู่/ })).toBeVisible();
  await page.getByRole("button", { name: "เปลี่ยนภาษา: ไทย" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Poppins");

  const palettes = new Set<string>([
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim()),
  ]);
  const themeChoices = [
    ["Dark", "dark"],
    ["Exclusive", "exclusive"],
    ["Matcha", "matcha"],
    ["Volcano", "volcano"],
    ["Classic", "classic"],
  ] as const;
  for (const [label, id] of themeChoices) {
    await page.getByRole("button", { name: /^Theme:/ }).click();
    await page.getByRole("menuitemradio", { name: new RegExp(`^${label}`) }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", id);
    palettes.add(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim()));
  }
  expect(palettes.size).toBe(5);
  await expect(page.locator(".choice-menu-popover")).toHaveCount(0);
});

test("Checklist stays in memory, stays English, and exports only on request", async ({ page }) => {
  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD") nonGetRequests.push(request.method());
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/tools/checklist");
  await page.getByLabel("New item").fill("Homework");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText("Homework")).toBeVisible();

  const storageValues = await page.evaluate(() =>
    Object.entries(localStorage).map(([key, value]) => [key, value]),
  );
  expect(
    storageValues.every(
      ([key, value]) =>
        ["tfd:favorites", "tfd:language", "tfd:theme"].includes(key as string) &&
        !String(value).includes("Homework"),
    ),
  ).toBe(true);
  expect(nonGetRequests).toEqual([]);
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  expect((await download).suggestedFilename()).toBe("toolsdice-checklist.json");
});

test("PDF previews, draggable page ordering, live image edits, and result hierarchy work", async ({ page }) => {
  const pdf = await PDFDocument.create();
  pdf.addPage([240, 320]);
  pdf.addPage([240, 320]);
  const pdfBuffer = Buffer.from(await pdf.save());

  await page.goto("/tools/pdf-workspace");
  await page.locator(".pdf-mode-picker select").selectOption("split-pdf");
  await page.locator('input[type="file"]').setInputFiles({
    name: "two-pages.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  await expect(page.locator(".pdf-preview-pages figure")).toHaveCount(2);
  await expect(page.locator(".pdf-preview-pages img").nth(1)).toHaveAttribute("alt", "PDF page 2");

  await page.goto("/tools/pdf-workspace");
  await page.locator(".pdf-mode-picker select").selectOption("reorder-pdf-pages");
  await page.locator('input[type="file"]').setInputFiles({
    name: "two-pages.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  const pageTiles = page.locator(".page-organizer .page-tile");
  await expect(pageTiles).toHaveCount(2);
  await pageTiles.nth(0).dragTo(pageTiles.nth(1), { targetPosition: { x: 40, y: 40 } });
  await expect(pageTiles.first().locator(".page-thumb img")).toHaveAttribute("alt", "PDF page 2");

  const pngDataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#ef8354";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  });
  const pngBuffer = Buffer.from(pngDataUrl.split(",")[1], "base64");

  await page.goto("/tools/image-resize");
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await expect(page.locator(".image-result img")).toBeVisible();
  const resize = page.getByRole("slider", { name: "Resize image" });
  await resize.press("End");
  await expect(page.locator(".image-result figcaption")).toContainText("128 × 96 px");

  await page.goto("/tools/image-crop");
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await expect(page.locator(".image-crop-stage")).toBeVisible();
  await expect(page.locator(".crop-dimensions")).toHaveText("48 × 48 px");
  const cropStage = page.locator(".image-crop-stage");
  await cropStage.scrollIntoViewIfNeeded();
  const stage = await cropStage.boundingBox();
  expect(stage).not.toBeNull();
  await page.mouse.move(stage!.x + stage!.width * 0.95, stage!.y + stage!.height * 0.9);
  await page.mouse.down();
  await page.mouse.move(stage!.x + stage!.width * 0.64, stage!.y + stage!.height * 0.6);
  await page.mouse.up();
  await expect(page.locator(".crop-dimensions")).not.toHaveText("48 × 48 px");
  await expect(page.locator(".image-result img")).toBeVisible();

  await page.goto("/tools/number-base-converter");
  await expect(page.locator(".base-results.output-panel .base-result-row")).toHaveCount(4);
  await expect(page.locator(".base-results")).toHaveCSS("border-style", "solid");

  await page.goto("/tools/date-calculator");
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2026-09-11");
  await dateInputs.nth(1).fill("2026-09-14");
  await expect(page.locator(".day-difference-values strong").nth(0)).toHaveText("3");
  await expect(page.locator(".day-difference-values strong").nth(1)).toHaveText("1");

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/tools/text-whitespace");
  const textWidths = await page.locator(".workspace-two-col").evaluate((element) =>
    Array.from(element.children, (child) => child.getBoundingClientRect().width),
  );
  expect(textWidths).toHaveLength(2);
  expect(Math.abs(textWidths[0] - textWidths[1])).toBeLessThan(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("mobile drawer, custom menus, keyboard access, reduced motion, and narrow layouts work", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "ToolsDice" })).toBeFocused();
  await page.keyboard.press("Tab");
  const menu = page.getByRole("button", { name: "Open menu" });
  await expect(menu).toBeFocused();
  const brandRight = await page.locator(".brand-name").evaluate((element) => element.getBoundingClientRect().right);
  const menuLeft = await menu.evaluate((element) => element.getBoundingClientRect().left);
  expect(menuLeft).toBeGreaterThan(brandRight);
  await page.keyboard.press("Enter");
  const closeMenu = page.getByRole("banner").getByRole("button", { name: "Close menu" });
  await expect(closeMenu).toHaveAttribute("aria-expanded", "true");
  await expect(closeMenu).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("complementary", { name: "Tools navigation" }).getByRole("link", { name: "Overview" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("banner").getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.getByRole("button", { name: "Language: English" }).click();
  await expect(page.getByRole("menuitemradio", { name: "English" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Language: English" })).toBeFocused();

  const animationName = await page.locator(".ambient-scene .ambient-cube").evaluate((element) =>
    getComputedStyle(element).animationName,
  );
  expect(animationName).toBe("none");

  for (const route of ["/", "/categories/pdf", "/categories/text", "/categories/data", "/tools/json-toolkit", "/tools/pdf-workspace", "/tools/image-resize", "/tools/csv-workspace"]) {
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }

  await page.goto("/categories/text");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("link", { name: "Back to overview" })).toBeInViewport();
});

test("all enabled tool routes use English UI and reflow at 320px", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "One full catalog pass is enough for both responsive projects.");
  test.setTimeout(120_000);

  await page.setViewportSize({ width: 320, height: 800 });
  const configResponse = await page.request.get("/api/v1/config");
  expect(configResponse.ok()).toBe(true);
  const envelope = await configResponse.json() as { data: { enabledToolIds: string[] } };
  expect(envelope.data.enabledToolIds).toHaveLength(61);

  for (const toolId of envelope.data.enabledToolIds) {
    await page.goto(`/tools/${toolId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator(".local-tool-panel input, .local-tool-panel textarea, .local-tool-panel select, .local-tool-panel button").first().waitFor({ state: "visible" });

    const audit = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll<HTMLElement>("input, textarea, select, button, [aria-label], [title]"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((element) => [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          (element as HTMLInputElement).placeholder,
        ].filter(Boolean).join(" "))
        .join(" ");
      const match = (document.body.innerText + " " + controls).match(/[\u0E00-\u0E7F]+/u);
      return {
        thai: match?.[0] ?? null,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        mainGutter: Number.parseFloat(getComputedStyle(document.querySelector<HTMLElement>("#main-content")!).paddingInlineStart),
        gutter: document.querySelector(".local-tool-panel")?.getBoundingClientRect().left ?? 0,
      };
    });
    expect(audit.thai, `Thai UI copy on /tools/${toolId}`).toBeNull();
    expect(audit.pageWidth, `Horizontal overflow on /tools/${toolId}`).toBeLessThanOrEqual(320);
    expect(audit.mainGutter, `Missing page gutter on /tools/${toolId}`).toBeGreaterThanOrEqual(24);
    expect(audit.gutter, `Missing mobile gutter on /tools/${toolId}`).toBeGreaterThanOrEqual(12);
  }

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/categories/pdf", "/categories/text", "/tools/pdf-workspace", "/tools/csv-workspace", "/tools/split-bill"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(dimensions.pageWidth, `Horizontal overflow on ${route} at ${width}px`).toBeLessThanOrEqual(width);
    }
  }
});

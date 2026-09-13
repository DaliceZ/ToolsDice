import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tfd:language", "en");
    localStorage.setItem("tfd:language-selected", "true");
  });
});

async function goToPdfTool(page: Page, mode: string) {
  const routeId = mode === "merge-pdf" ? "pdf-workspace" : mode;
  await page.goto("/tools/" + routeId);
}

test("PDF tasks open directly without a task selector", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/manage-pdf-pages");
  await expect(page.getByRole("heading", { level: 1, name: "Manage PDF Pages" })).toBeVisible();
  await expect(page.locator(".pdf-mode-picker")).toHaveCount(0);
});

test("PDF tools appear as individual entries in the category and sidebar", async ({ page }) => {
  await page.goto("/categories/pdf");
  const expected = [
    "pdf-workspace",
    "pdf-text",
    "manage-pdf-pages",
    "split-pdf",
    "pdf-metadata",
    "compress-pdf",
    "page-number-pdf",
    "add-watermark",
    "images-to-pdf",
    "pdf-to-images",
  ];
  const cards = page.locator(".category-page .tool-card");
  await expect(cards).toHaveCount(expected.length);
  const categoryRoutes = await cards.evaluateAll((items) =>
    items.map((item) => item.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href")?.replace("/tools/", "")),
  );
  expect(categoryRoutes).toEqual(expected);
  for (const routeId of expected) {
    await expect(page.locator(`#tools-sidebar a[href='/tools/${routeId}']`)).toHaveCount(1);
  }
});

test("PDF text extraction reads every page when the page range is left blank", async ({ page }) => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const text of ["first-page-unique", "second-page-unique"]) {
    const pdfPage = pdf.addPage([240, 320]);
    pdfPage.drawText(text, { x: 24, y: 280, font, size: 12 });
  }

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "pdf-text");
  const pageRange = page.getByLabel("Pages to read");
  await expect(pageRange).toHaveValue("");
  await expect(pageRange).toHaveAttribute(
    "placeholder",
    "Leave blank to read all pages, e.g. 1-3,5",
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "text-pages.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  });

  await page.getByRole("button", { name: "Extract text", exact: true }).click();
  const output = page.locator(".output-editor textarea");
  await expect(output).toHaveValue(/first-page-unique[\s\S]*second-page-unique/, { timeout: 15_000 });
});

test("PDF merge appends files chosen in separate selections", async ({ page }) => {
  const firstPdf = await PDFDocument.create();
  firstPdf.addPage([240, 320]);
  const secondPdf = await PDFDocument.create();
  secondPdf.addPage([320, 240]);

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "merge-pdf");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "first.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await firstPdf.save()),
  });
  await expect(page.locator(".sortable-file-list .sortable-item")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Add PDFs" })).toBeVisible();

  await fileInput.setInputFiles({
    name: "second.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await secondPdf.save()),
  });
  const selectedFiles = page.locator(".sortable-file-list .sortable-item");
  await expect(selectedFiles).toHaveCount(2);
  await expect(selectedFiles.nth(0)).toContainText("first.pdf");
  await expect(selectedFiles.nth(1)).toContainText("second.pdf");

  await page.getByRole("button", { name: "Remove file: first.pdf" }).click();
  await expect(selectedFiles).toHaveCount(1);
  await expect(selectedFiles.first()).toContainText("second.pdf");
});

test("PDF merge can reorder pages across source files", async ({ page }) => {
  const firstPdf = await PDFDocument.create();
  firstPdf.addPage([240, 320]);
  firstPdf.addPage([180, 280]);
  const secondPdf = await PDFDocument.create();
  secondPdf.addPage([320, 240]);

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "merge-pdf");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "first-layout.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await firstPdf.save()),
  });
  await expect(page.locator(".sortable-file-list .sortable-item")).toHaveCount(1);
  await fileInput.setInputFiles({
    name: "second-layout.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await secondPdf.save()),
  });
  await expect(page.locator(".sortable-file-list .sortable-item")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "Arrange pages before merging" }).check();

  const cards = page.locator(".merge-page-tile");
  await expect(cards).toHaveCount(3, { timeout: 15_000 });
  await expect(cards.nth(0)).toContainText("first-layout.pdf");
  await expect(cards.nth(2)).toContainText("second-layout.pdf");
  if ((page.viewportSize()?.width ?? 1280) < 600) {
    await cards.nth(2).getByRole("button", { name: /Move up/ }).click();
    await cards.nth(1).getByRole("button", { name: /Move up/ }).click();
  } else {
    await cards.nth(2).dragTo(cards.nth(0), {
      sourcePosition: { x: 45, y: 55 },
      targetPosition: { x: 45, y: 55 },
    });
  }
  await expect(cards.first()).toContainText("second-layout.pdf");
  await cards.first().getByRole("button", { name: /Move down/ }).click();
  await cards.nth(1).getByRole("button", { name: /Move up/ }).click();
  await expect(cards.first()).toContainText("second-layout.pdf");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Merge and download PDF" }).click();
  const download = await downloadPromise;
  const outputPath = await download.path();
  expect(outputPath).toBeTruthy();
  const mergedPdf = await PDFDocument.load(await readFile(outputPath!));
  expect(mergedPdf.getPages().map((pdfPage) => pdfPage.getSize())).toEqual([
    { width: 320, height: 240 },
    { width: 240, height: 320 },
    { width: 180, height: 280 },
  ]);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});

test("Thai is the default until a visitor chooses another language", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(page.getByRole("button", { name: "เปลี่ยนภาษา: ไทย" })).toBeVisible();

    await page.getByRole("button", { name: "เปลี่ยนภาษา: ไทย" }).click();
    await page.getByRole("menuitemradio", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  } finally {
    await context.close();
  }

  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(() => localStorage.setItem("tfd:language", "en"));
  const legacyPage = await legacyContext.newPage();
  try {
    await legacyPage.goto("/");
    await expect(legacyPage.locator("html")).toHaveAttribute("lang", "th");
  } finally {
    await legacyContext.close();
  }
});

test("overview, category navigation, autocomplete, and local tools work in English", async ({ page }) => {
  const configResponsePromise = page.waitForResponse(/\/api\/v1\/config$/);
  await page.goto("/");
  const configResponse = await configResponsePromise;
  expect(configResponse.ok()).toBe(true);
  const configEnvelope = await configResponse.json() as {
    data: { appName: string; enabledToolIds: string[] };
  };
  expect(configEnvelope.data.appName).toBe("ToolsDice");
  expect(configEnvelope.data.enabledToolIds).toContain("api-client");

  await expect(page.getByRole("heading", { name: "ToolsDice", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Explore 8 categories/ })).toBeVisible();
  await expect(page.locator(".category-overview-grid a[href^='/categories/']")).toHaveCount(8);
  await expect(page.getByText("All tools", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Recently used")).toHaveCount(0);
  await expect(page.locator(".app-topbar .portfolio-link")).toBeVisible();
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
  const sidebarLabelStyles = await page.locator("#tools-sidebar").evaluate((element) => {
    const readStyle = (selector: string) => {
      const label = element.querySelector<HTMLElement>(selector);
      if (!label) return null;
      const style = getComputedStyle(label);
      return { fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight };
    };
    return {
      overview: readStyle(".sidebar-home .sidebar-primary-label"),
      category: readStyle(".sidebar-category-main .sidebar-primary-label"),
    };
  });
  expect(sidebarLabelStyles.overview).not.toBeNull();
  expect(sidebarLabelStyles.category).not.toBeNull();
  expect(sidebarLabelStyles.category).toEqual(sidebarLabelStyles.overview);
  const overviewGutter = await page.locator(".dashboard-page").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingInlineStart),
  );
  expect(overviewGutter).toBeGreaterThanOrEqual(8);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const collapseSidebar = page.getByRole("banner").getByRole("button", { name: "Collapse sidebar" });
    await expect(collapseSidebar).toBeVisible();
    const sidebarRight = await sidebar.evaluate((element) => element.getBoundingClientRect().right);
    const toggleRight = await collapseSidebar.evaluate((element) => element.getBoundingClientRect().right);
    const brandLeft = await page.locator(".app-topbar .brand-die").evaluate((element) => element.getBoundingClientRect().left);
    expect(toggleRight).toBeLessThan(brandLeft);
    await collapseSidebar.click();
    const expandSidebar = page.getByRole("banner").getByRole("button", { name: "Expand sidebar" });
    await expect(expandSidebar).toBeVisible();
    await expect.poll(async () => {
      return await sidebar.evaluate((element) => element.getBoundingClientRect().right);
    }).toBeLessThan(sidebarRight - 100);
    const stationaryButtonRight = await expandSidebar.evaluate((element) => element.getBoundingClientRect().right);
    const stationaryBrandLeft = await page.locator(".app-topbar .brand-die").evaluate((element) => element.getBoundingClientRect().left);
    expect(Math.abs(stationaryButtonRight - toggleRight)).toBeLessThan(1);
    expect(stationaryButtonRight).toBeLessThan(stationaryBrandLeft);
    await expandSidebar.click();

    const textCategory = sidebar.getByRole("button", { name: /^Text\s+\d+$/ });
    await textCategory.click();
    await expect(sidebar.getByRole("link", { name: "Word & Character Counter" })).toBeVisible();
    await expect(sidebar.locator("a[href^='/categories/']")).toHaveCount(0);
    await sidebar.getByRole("link", { name: "Word & Character Counter" }).click();
    await expect(page).toHaveURL(/\/tools\/text-word-count$/);
    const sidebarBack = page.getByRole("link", { name: "Back to overview" });
    await expect(sidebarBack).toBeVisible();
    await sidebarBack.click();
    await expect(page).toHaveURL("/");
  } else {
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  }

  const overviewCanScroll = await page.evaluate(() => {
    const scroller = document.scrollingElement;
    return Boolean(scroller && scroller.scrollHeight > window.innerHeight);
  });
  if (overviewCanScroll) {
    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  }
  await page.locator(".category-overview-grid a[href='/categories/text']").click();
  await expect(page).toHaveURL(/\/categories\/text$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "Text", exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".category-page").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingInlineStart),
  )).toBeGreaterThanOrEqual(8);
  const textCards = page.locator(".category-page .tool-card");
  await expect(textCards).toHaveCount(7);
  const textRoutes = await textCards.evaluateAll((items) =>
    items.map((item) => item.querySelector<HTMLAnchorElement>("a[href]")?.getAttribute("href")?.replace("/tools/", "")),
  );
  expect(textRoutes).toEqual([
    "text-keyboard",
    "text-find-replace",
    "text-diff",
    "text-money",
    "text-reverse",
    "text-word-count",
    "text-remove-duplicates",
  ]);
  await expect(page.getByRole("link", { name: "Open Word & Character Counter" })).toBeVisible();
  await page.getByRole("link", { name: "Open Word & Character Counter" }).click();
  await expect(page).toHaveURL(/\/tools\/text-word-count$/);
  const categoryBack = page.getByRole("link", { name: "Back to Text" });
  await expect(categoryBack).toBeVisible();
  await categoryBack.click();
  await expect(page).toHaveURL(/\/categories\/text$/);
  await page.goto("/tools/text-character-count");
  await expect(page).toHaveURL(/\/tools\/text-word-count$/);
  await page.goto("/tools/text-whitespace");
  await expect(page).toHaveURL(/\/categories\/text$/);
  await expect(page.locator(".category-page .tool-card")).toHaveCount(7);
  await page.goto("/tools/text-remove-duplicates");
  await page.getByPlaceholder("Paste one item per line…").fill("apple\nbanana\napple");
  await expect(page.getByLabel("Text without duplicate lines")).toHaveValue("apple\nbanana");
  await expect(page.getByText("1 duplicate line removed; original order is preserved.")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("link", { name: "Back to overview" })).toBeInViewport();

  await page.goto("/");
  await page.getByRole("button", { name: "Search tools" }).click();
  const search = page.getByRole("combobox", { name: "Search tools" });
  await search.fill("API");
  await expect(page.getByRole("option", { name: /API Request Builder/ })).toBeVisible();
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
  await page.getByRole("option", { name: /API Request Builder/ }).click();
  await expect(page).toHaveURL(/\/tools\/api-client$/);
  await expect(page.getByRole("heading", { name: "Build an API request" })).toBeVisible();
});

test("mobile category cards keep space between icons and labels, with the menu before the brand", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/categories/text");

  const firstCard = page.locator(".tool-card").first();
  const iconToLabelGap = await firstCard.evaluate((element) => {
    const icon = element.querySelector<HTMLElement>(".size-10");
    const label = element.querySelector<HTMLElement>("h2");
    if (!icon || !label) return Number.NEGATIVE_INFINITY;
    return label.getBoundingClientRect().left - icon.getBoundingClientRect().right;
  });
  expect(iconToLabelGap).toBeGreaterThanOrEqual(10);

  const menuRight = await page.getByRole("button", { name: "Open menu" }).evaluate((element) => element.getBoundingClientRect().right);
  const brandLeft = await page.locator(".app-topbar .brand-die").evaluate((element) => element.getBoundingClientRect().left);
  expect(menuRight).toBeLessThan(brandLeft);
});

test("favorites, themes, and language menus keep all preferences local", async ({ page }) => {
  await page.goto("/categories/developer");
  await page.getByRole("button", { name: "Add to favorites: API Request Builder" }).click();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
  await expect(page.getByRole("link", { name: /API Request Builder/ })).toBeVisible();

  const language = page.getByRole("button", { name: "Language: English" });
  await language.click();
  await expect(page.getByRole("menuitemradio").nth(0)).toHaveAccessibleName("ไทย");
  await expect(page.getByRole("menuitemradio").nth(1)).toHaveAccessibleName("English");
  await page.getByRole("menuitemradio").nth(0).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Sarabun");
  await expect(page.getByRole("heading", { name: /สำรวจ 8 หมวดหมู่/ })).toBeVisible();
  await page.getByRole("button", { name: "เปลี่ยนภาษา: ไทย" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Poppins");

  const classicOrbitColor = await page.locator(".orbit-track-one").evaluate((element) => getComputedStyle(element).borderTopColor);
  const classicOrbitAlpha = classicOrbitColor.match(/\/\s*([\d.]+)\s*\)$/)?.[1] ?? classicOrbitColor.match(/,\s*([\d.]+)\s*\)$/)?.[1];
  expect(Number(classicOrbitAlpha)).toBeCloseTo(0.42);

  await language.click();
  const themeButton = page.getByRole("button", { name: /^Theme:/ });
  await themeButton.click();
  await expect(language).toHaveAttribute("aria-expanded", "false");
  await expect(themeButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".choice-menu-popover")).toHaveCount(1);
  await page.getByRole("menuitemradio", { name: /^Dark/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const palettes = new Set<string>([
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim()),
  ]);
  const primaryOrbitAlpha = async () => {
    const color = await page.locator(".orbit-track-one").evaluate((element) => getComputedStyle(element).borderTopColor);
    const alpha = color.match(/\/\s*([\d.]+)\s*\)$/)?.[1] ?? color.match(/,\s*([\d.]+)\)$/)?.[1];
    return Number(alpha);
  };
  expect(await primaryOrbitAlpha()).toBeCloseTo(0.2);
  const themeChoices = [
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
    if (id === "matcha") expect(await primaryOrbitAlpha()).toBeCloseTo(0.46);
  }
  expect(palettes.size).toBe(5);
  await expect(page.locator(".choice-menu-popover")).toHaveCount(0);
});

test("API request builder waits for an explicit send and keeps credentials in page memory", async ({ page }) => {
  const sent: Array<{ method: string; url: string; body: string | null; headers: Record<string, string> }> = [];
  await page.route("https://api.example.test/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
      return;
    }
    sent.push({
      method: route.request().method(),
      url: route.request().url(),
      body: route.request().postData(),
      headers: await route.request().allHeaders(),
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ saved: true }),
    });
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/tools/api-client");
  await page.getByLabel("URL", { exact: true }).fill("https://api.example.test/items");
  await page.getByLabel("Parameter name 1").fill("tag");
  await page.getByRole("region", { name: "Query Params" }).getByPlaceholder("Value").fill("local only until send");
  await page.getByRole("button", { name: "HTTP method: GET" }).click();
  await page.getByRole("menuitemradio", { name: "POST" }).click();
  await page.getByRole("button", { name: "Body type: No body" }).click();
  await page.getByRole("menuitemradio", { name: "JSON" }).click();
  await page.getByPlaceholder('{\n  "name": "ToolsDice"\n}').fill('{"hello":"world"}');

  expect(sent).toEqual([]);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("201 Created")).toBeVisible();
  expect(sent).toHaveLength(1);
  expect(sent[0].method).toBe("POST");
  expect(new URL(sent[0].url).searchParams.get("tag")).toBe("local only until send");
  expect(sent[0].body).toBe('{"hello":"world"}');
  expect(sent[0].headers.cookie).toBeUndefined();

  await page.reload();
  await expect(page.getByLabel("URL", { exact: true })).toHaveValue("");
  expect(sent).toHaveLength(1);
});

test("PDF previews, draggable page ordering, live image edits, and result hierarchy work", async ({ page }) => {
  const pdf = await PDFDocument.create();
  pdf.addPage([240, 320]);
  pdf.addPage([240, 320]);
  const pdfBuffer = Buffer.from(await pdf.save());

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "split-pdf");
  await page.locator('input[type="file"]').setInputFiles({
    name: "two-pages.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  await expect(page.locator(".pdf-preview-pages figure")).toHaveCount(2);
  await expect(page.locator(".pdf-preview-pages img").nth(1)).toHaveAttribute("alt", "PDF page 2");
  const quickSplitDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await quickSplitDownload).suggestedFilename()).toBe("split-two-pages.pdf");
  await page.getByRole("button", { name: "Enlarge PDF page preview 2" }).click();
  const pdfViewer = page.getByRole("dialog");
  await expect(pdfViewer).toBeVisible();
  await expect(pdfViewer.getByRole("img", { name: "PDF page 2" })).toBeVisible();
  await pdfViewer.getByRole("button", { name: "Close preview" }).click();
  await expect(pdfViewer).toHaveCount(0);

  const pageRanges = page.locator(".page-range-row");
  await expect(pageRanges).toHaveCount(1);
  await page.getByRole("button", { name: "Add range" }).click();
  await expect(pageRanges).toHaveCount(2);
  await pageRanges.nth(0).locator('input[type="number"]').nth(1).fill("2");
  await pageRanges.nth(1).locator('input[type="number"]').first().fill("2");
  await pageRanges.nth(1).locator('input[type="number"]').nth(1).fill("2");
  await page.getByRole("button", { name: "Split and download" }).click();
  await expect(page.locator(".inline-status.error")).toContainText("Page ranges overlap");
  await page.getByRole("button", { name: "Remove range 2" }).click();
  await expect(pageRanges).toHaveCount(1);
  await page.getByRole("button", { name: "Remove file: two-pages.pdf" }).click();
  await expect(page.locator(".pdf-preview-card")).toHaveCount(0);

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "manage-pdf-pages");
  await page.locator('input[type="file"]').setInputFiles({
    name: "two-pages.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  const pageTiles = page.locator(".page-organizer .page-tile");
  await expect(pageTiles).toHaveCount(2);
  const pageControls = pageTiles.first().locator(".page-control-toolbar");
  const iconActions = pageControls.locator("button");
  await expect(iconActions).toHaveCount(5);
  await expect(pageControls.locator("button span")).toHaveCount(0);
  const actionRows = await iconActions.evaluateAll((buttons) =>
    buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
  );
  expect(new Set(actionRows).size).toBe(1);
  await page.getByRole("button", { name: "Enlarge PDF page preview 1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close preview" }).click();
  if ((page.viewportSize()?.width ?? 1280) < 600) {
    await pageTiles.nth(1).getByRole("button", { name: "Move up" }).click();
  } else {
    await pageTiles.nth(0).dragTo(pageTiles.nth(1), { targetPosition: { x: 40, y: 40 } });
  }
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

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "images-to-pdf");
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await expect(page.locator(".image-to-pdf-preview-card img")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage images" })).toBeVisible();
  const quickPdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await quickPdfDownload).suggestedFilename()).toBe("images-to-pdf.pdf");

  const fourPagePdf = await PDFDocument.create();
  for (let index = 0; index < 4; index += 1) fourPagePdf.addPage([240, 320]);
  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "page-number-pdf");
  await page.locator('input[type="file"]').setInputFiles({
    name: "four-pages.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await fourPagePdf.save()),
  });
  await expect(page.locator(".pdf-adjustment-preview-page")).toHaveCount(1);
  await expect(page.locator(".pdf-preview-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Add numbering range" }).click();
  const numberingRules = page.locator(".numbering-rule");
  await expect(numberingRules).toHaveCount(2);
  await expect(numberingRules.nth(0).locator('input[type="number"]').nth(1)).toHaveValue("3");
  await expect(numberingRules.nth(1).locator('input[type="number"]').first()).toHaveValue("4");
  await numberingRules.nth(0).getByRole("button", { name: /Numbering style:/ }).click();
  await page.locator('[data-choice-value="thai"]').click();
  await numberingRules.nth(1).getByRole("button", { name: /Numbering style:/ }).click();
  await page.locator('[data-choice-value="numeric"]').click();
  await expect(page.locator(".numbering-preview")).toContainText("ก");
  const quickNumberedDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await quickNumberedDownload).suggestedFilename()).toBe("numbered-four-pages.pdf");
  const numberedDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add page numbers and download" }).click();
  expect((await numberedDownload).suggestedFilename()).toBe("numbered-four-pages.pdf");

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
  const quickImageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await quickImageDownload).suggestedFilename()).toMatch(/\.png$/);

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
  await page.goto("/tools/text-reverse");
  const textWidths = await page.locator(".workspace-two-col").evaluate((element) =>
    Array.from(element.children, (child) => child.getBoundingClientRect().width),
  );
  expect(textWidths).toHaveLength(2);
  expect(Math.abs(textWidths[0] - textWidths[1])).toBeLessThan(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("hidden PDF previews resume and workspace controls remain interactive", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "setDocumentHidden", {
      value: (hidden: boolean) => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });
  const pdf = await PDFDocument.create();
  pdf.addPage([240, 320]);
  pdf.addPage([240, 320]);
  const pdfBuffer = Buffer.from(await pdf.save());

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "split-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "tab-switch.pdf", mimeType: "application/pdf", buffer: pdfBuffer });
  await expect(page.locator(".pdf-preview-page-button")).toHaveCount(2);

  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(true));
  await expect(page.locator(".pdf-preview-card .helper-text")).toContainText("The preview will resume when you return to this tab.");
  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(false));
  await expect(page.locator(".pdf-preview-page-button")).toHaveCount(2);
  await page.getByRole("button", { name: "Enlarge PDF page preview 1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(false));

  await goToPdfTool(page, "manage-pdf-pages");
  await page.locator('input[type="file"]').setInputFiles({ name: "tab-switch.pdf", mimeType: "application/pdf", buffer: pdfBuffer });
  const tiles = page.locator(".page-organizer .page-tile");
  await expect(tiles).toHaveCount(2);
  await page.getByRole("button", { name: "Rotate right" }).first().click();
  await expect(tiles.first()).toBeVisible();
});

test("watermark and page-number previews show one live PDF page", async ({ page }) => {
  const pdf = await PDFDocument.create();
  pdf.addPage([240, 320]);
  pdf.addPage([240, 320]);
  const pdfBuffer = Buffer.from(await pdf.save());

  await page.goto("/tools/pdf-workspace");
  await goToPdfTool(page, "add-watermark");
  await page.locator('input[type="file"]').setInputFiles({
    name: "watermark-preview.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  await expect(page.locator(".pdf-adjustment-preview-page")).toHaveCount(1);
  await expect(page.locator(".pdf-preview-card")).toHaveCount(0);
  const watermark = page.locator(".pdf-watermark-stamp");
  await expect(watermark).toHaveAttribute("alt", "CONFIDENTIAL");
  const placement = page.getByRole("group", { name: "Watermark placement" });
  const initialLeft = await watermark.evaluate((image) => image.style.left);
  await placement.press("ArrowRight");
  await expect.poll(() => watermark.evaluate((image) => image.style.left)).not.toBe(initialLeft);
  await placement.scrollIntoViewIfNeeded();
  const frameBox = await placement.boundingBox();
  expect(frameBox).not.toBeNull();
  const beforeDragLeft = await watermark.evaluate((image) => image.style.left);
  await page.mouse.move(frameBox!.x + frameBox!.width * 0.15, frameBox!.y + frameBox!.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(frameBox!.x + frameBox!.width * 0.75, frameBox!.y + frameBox!.height * 0.72);
  await page.mouse.up();
  await expect.poll(() => watermark.evaluate((image) => image.style.left)).not.toBe(beforeDragLeft);
  await page.getByLabel("Watermark text").fill("APPROVED");
  await expect(watermark).toHaveAttribute("alt", "APPROVED");
  const watermarkedDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  expect((await watermarkedDownload).suggestedFilename()).toBe("watermarked-watermark-preview.pdf");

  await goToPdfTool(page, "page-number-pdf");
  await page.locator('input[type="file"]').setInputFiles({
    name: "number-preview.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  await expect(page.locator(".pdf-adjustment-preview-page")).toHaveCount(1);
  await expect(page.locator(".pdf-preview-card")).toHaveCount(0);
  const previewPage = page.getByLabel("Preview page");
  await previewPage.fill("2");
  await expect(page.locator(".pdf-adjustment-page-image")).toHaveAttribute("alt", "PDF page 2");
  await page.getByRole("button", { name: /Numbering style:/ }).click();
  await page.locator('[data-choice-value="upper"]').click();
  await page.getByLabel("Starting value").fill("3");
  const pageNumberStamp = page.locator(".pdf-adjustment-stamp");
  await expect(pageNumberStamp).toHaveAttribute("alt", "D");
  const initialTop = await pageNumberStamp.evaluate((image) => image.style.top);
  await page.getByRole("button", { name: /Position:/ }).click();
  await page.locator('[data-choice-value="top-right"]').click();
  await expect.poll(() => pageNumberStamp.evaluate((image) => image.style.top)).not.toBe(initialTop);
});

test("copy only runs from the copy button, never from the output header", async ({ page }) => {
  await page.addInitScript(() => {
    let writes = 0;
    Object.defineProperty(window, "getCopyWriteCount", { value: () => writes });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { writes += 1; } },
    });
  });
  const count = () => page.evaluate(() => (window as unknown as { getCopyWriteCount: () => number }).getCopyWriteCount());
  await page.goto("/tools/code-formatter");
  const output = page.locator(".output-editor").first();
  await expect(output).toBeVisible();
  const heading = output.locator(".editor-heading");
  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + Math.min(box!.width * .55, box!.width - 80), box!.y + box!.height / 2);
  await expect.poll(count).toBe(0);
  await output.getByRole("button", { name: "Copy" }).click();
  await expect.poll(count).toBe(1);

});

test("mobile drawer, custom menus, keyboard access, reduced motion, and narrow layouts work", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  const menu = page.getByRole("button", { name: "Open menu" });
  await expect(menu).toBeFocused();
  const brand = page.getByRole("link", { name: "ToolsDice" });
  const brandLeft = await page.locator(".brand-die").evaluate((element) => element.getBoundingClientRect().left);
  const menuRight = await menu.evaluate((element) => element.getBoundingClientRect().right);
  expect(menuRight).toBeLessThan(brandLeft);
  await page.keyboard.press("Tab");
  await expect(brand).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  const closeMenu = page.getByRole("banner").getByRole("button", { name: "Close menu" });
  await expect(closeMenu).toHaveAttribute("aria-expanded", "true");
  await expect(closeMenu).toBeFocused();
  const sidebar = page.getByRole("complementary", { name: "Tools navigation" });
  const sidebarWidth = await sidebar.evaluate((element) => element.getBoundingClientRect().width);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(sidebarWidth).toBeGreaterThanOrEqual(viewportWidth * 0.64);
  expect(sidebarWidth).toBeLessThanOrEqual(viewportWidth * 0.66);
  await page.keyboard.press("Tab");
  await expect(brand).toBeFocused();
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

  for (const route of ["/", "/categories/pdf", "/categories/text", "/categories/developer", "/tools/api-client", "/tools/code-formatter", "/tools/pdf-workspace", "/tools/image-resize", "/tools/loan-calculator"]) {
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }

  await page.goto("/categories/text");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("link", { name: "Back to overview" })).toBeInViewport();
});

test("mobile drawer releases the page after repeated clicks, tab switches, and desktop resize", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    Object.defineProperty(window, "setDocumentHidden", {
      value: (hidden: boolean) => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });
  await page.goto("/");

  const main = page.locator("#main-content");
  const menu = page.locator('.app-topbar button[aria-controls="tools-sidebar"]');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await menu.click();
    await expect(main).toHaveAttribute("inert", "");
    await menu.click();
    await expect(main).not.toHaveAttribute("inert", "");
  }

  await menu.click();
  await expect(main).toHaveAttribute("inert", "");
  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(true));
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(main).not.toHaveAttribute("inert", "");
  await expect(page.locator(".nav-scrim")).toHaveCount(0);
  await page.locator(".category-overview-grid a[href='/categories/text']").click();
  await expect(page).toHaveURL(/\/categories\/text$/);

  await page.goto("/");
  await page.evaluate(() => (window as unknown as { setDocumentHidden: (hidden: boolean) => void }).setDocumentHidden(false));
  await menu.click();
  await expect(main).toHaveAttribute("inert", "");
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(main).not.toHaveAttribute("inert", "");
  await expect(page.locator(".nav-scrim")).toHaveCount(0);
  await page.locator(".category-overview-grid a[href='/categories/text']").click();
  await expect(page).toHaveURL(/\/categories\/text$/);
});

test("all enabled tool routes use English UI and reflow at 320px", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "One full catalog pass is enough for both responsive projects.");
  test.setTimeout(120_000);

  await page.setViewportSize({ width: 320, height: 800 });
  const configResponse = await page.request.get("/api/v1/config");
  expect(configResponse.ok()).toBe(true);
  const envelope = await configResponse.json() as { data: { enabledToolIds: string[] } };
  expect(envelope.data.enabledToolIds).toHaveLength(52);

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
    for (const route of ["/", "/categories/pdf", "/categories/text", "/categories/developer", "/tools/api-client", "/tools/pdf-workspace", "/tools/split-bill", "/tools/savings-calculator"]) {
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

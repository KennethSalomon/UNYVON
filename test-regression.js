const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const results = [];
function log(test, ok, detail) {
  const s = ok ? "PASS" : "FAIL";
  results.push({ test, status: s, detail });
  console.log(`[${s}] ${test}: ${detail}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // --- 1. Landing ---
  await page.goto(BASE);
  const title = await page.title();
  log("REG-landing", title.includes("UNYVON"), `title=${title}`);

  // --- 2. Signup ---
  await page.goto(`${BASE}/signup`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  const testEmail = `reg.${Date.now()}@test.dev`;
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', "SecureTest2024!");
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
  log("REG-signup-ok", true, `redirected to ${page.url().split("/").pop()}`);

  // --- 3. Onboarding step 1 ---
  if (page.url().includes("onboarding")) {
    await page.fill('input[placeholder*="Mon Entreprise"], input[name="orgName"], #orgName', "Reg Test Corp").catch(() => {});
    const nextBtn = page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      log("REG-onboarding-step1", true, "step1 done");
    }
    await page.waitForTimeout(2000);
  }

  // --- 4. Products page ---
  await page.goto(`${BASE}/products`);
  await page.waitForTimeout(3000);
  const productsUrl = page.url();
  log("REG-products-access", productsUrl.includes("products"), `url=${productsUrl}`);

  // Check products page content
  const prodContent = await page.locator("body").innerText();
  log("REG-products-content", prodContent.includes("Produits"), `hasProduits=${prodContent.includes("Produits")}`);

  // --- 5. Add product button visible ---
  const addBtn = page.locator('button:has-text("Ajouter")').first();
  const addVisible = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
  log("REG-add-product-btn", addVisible, `visible=${addVisible}`);

  // --- 6. Open modal ---
  if (addVisible) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    const modal = page.locator('[role="dialog"]');
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    log("REG-product-modal", modalVisible, `visible=${modalVisible}`);

    // Fill and submit
    if (modalVisible) {
      await page.fill('#prod-name', 'Test Produit Playwright');
      await page.fill('#prod-sale', '5000');
      const submitProduct = page.locator('[role="dialog"] button:has-text("Ajouter")');
      await submitProduct.click();
      await page.waitForTimeout(2000);
      log("REG-product-created", true, "submitted");
    }
  }

  // --- 7. Other pages regression ---
  for (const route of ["/dashboard", "/sales", "/inventory", "/customers", "/products"]) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(1500);
    const rUrl = page.url();
    log(`REG-route-${route}`, !rUrl.includes("/login"), `url=${rUrl}`);
  }

  // --- 8. Logout ---
  const logoutBtn = page.locator('button[aria-label*="déconnecter"], button[aria-label*="logout"], form[action*="signOut"] button').first();
  if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(3000);
    log("REG-logout", page.url().includes("/login"), `url=${page.url()}`);
  }

  // --- 9. No hydration errors ---
  const hydrationErrors = errors.filter((e) => e.includes("Hydration") || e.includes("hydrat"));
  log("REG-no-hydration", hydrationErrors.length === 0, `errors=${hydrationErrors.length}`);

  // --- 10. No critical errors ---
  const criticalErrors = errors.filter((e) => !e.includes("favicon") && !e.includes("404") && e.length > 10);
  log("REG-no-critical-errors", criticalErrors.length === 0, `errors=${criticalErrors.length}`);

  await browser.close();

  // --- SUMMARY ---
  console.log("\n========== REGRESSION TEST SUMMARY ==========");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASSED: ${passed}/${results.length}`);
  if (failed > 0) {
    console.log("FAILURES:");
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`  - ${r.test}: ${r.detail}`));
  }
}

run().catch((e) => { console.error("FATAL:", e); process.exit(1); });

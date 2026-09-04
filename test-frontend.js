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
  log("FE-landing", title.includes("UNYVON") || title.includes("UNIVON"), `title=${title}`);

  // --- 2. Navigate to signup ---
  await page.goto(`${BASE}/signup`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  log("FE-signup-page", true, "email input found");

  // --- 3. Fill signup form ---
  const testEmail = `ui.test.${Date.now()}@test.dev`;
  const testPw = "SecureTest2024!";

  await page.fill('input[name="firstName"]', "UI").catch(() => {});
  await page.fill('input[name="lastName"]', "Tester").catch(() => {});
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPw);

  // Submit form
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  // Wait for redirect to onboarding or dashboard
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
  const afterSignupUrl = page.url();
  log("FE-signup-redirect", afterSignupUrl.includes("onboarding") || afterSignupUrl.includes("dashboard"), `url=${afterSignupUrl}`);

  // --- 4. Onboarding ---
  if (afterSignupUrl.includes("onboarding")) {
    // Step 1: org info
    await page.fill('input[placeholder*="Mon Entreprise"], input[name="orgName"], #orgName', "UI Test Corp").catch(() => {});
    // Look for a "Next" or "Continue" button
    const nextBtn = page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      log("FE-onboarding-step1", true, "step1 completed");
    } else {
      log("FE-onboarding-step1", false, "no next button found");
    }

    // Wait for step 2 or dashboard
    await page.waitForTimeout(2000);
    const onbUrl = page.url();
    log("FE-onboarding-navigation", onbUrl.includes("onboarding") || onbUrl.includes("dashboard"), `url=${onbUrl}`);
  }

  // --- 5. Dashboard loads ---
  await page.goto(`${BASE}/dashboard`);
  await page.waitForTimeout(2000);
  const dashUrl = page.url();
  log("FE-dashboard-access", dashUrl.includes("dashboard"), `url=${dashUrl}`);

  // --- 6. Check page content (not empty) ---
  const bodyText = await page.locator("body").innerText();
  log("FE-dashboard-content", bodyText.length > 50, `contentLen=${bodyText.length}`);

  // --- 7. Reload — session persists ---
  await page.reload();
  await page.waitForTimeout(2000);
  const reloadUrl = page.url();
  log("FE-session-persist", !reloadUrl.includes("/login"), `url=${reloadUrl}`);

  // --- 8. Navigate to other pages ---
  for (const route of ["/sales", "/products", "/inventory"]) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(1500);
    const rUrl = page.url();
    log(`FE-route-${route}`, !rUrl.includes("/login"), `url=${rUrl}`);
  }

  // --- 9. Logout ---
  const logoutBtn = page.locator('button[aria-label*="déconnecter"], button[aria-label*="logout"], form[action*="signOut"] button').first();
  if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(3000);
    const logoutUrl = page.url();
    log("FE-logout", logoutUrl.includes("/login"), `url=${logoutUrl}`);
  } else {
    log("FE-logout", false, "logout button not found");
  }

  // --- 10. Private route blocked after logout ---
  await page.goto(`${BASE}/dashboard`);
  await page.waitForTimeout(3000);
  const privateUrl = page.url();
  log("FE-private-blocked", privateUrl.includes("/login"), `url=${privateUrl}`);

  // --- 11. No hydration errors ---
  const hydrationErrors = errors.filter((e) => e.includes("Hydration") || e.includes("hydrat"));
  log("FE-no-hydration-errors", hydrationErrors.length === 0, `errors=${hydrationErrors.length}`);

  // --- 12. No console errors (critical) ---
  const criticalErrors = errors.filter(
    (e) => !e.includes("favicon") && !e.includes("404") && e.length > 10
  );
  log("FE-no-critical-errors", criticalErrors.length === 0, `errors=${criticalErrors.length}`);

  await browser.close();

  // --- SUMMARY ---
  console.log("\n========== FRONTEND TEST SUMMARY ==========");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASSED: ${passed}/${results.length}`);
  if (failed > 0) {
    console.log("FAILURES:");
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`  - ${r.test}: ${r.detail}`));
  }
  console.log("TEST_EMAIL:", testEmail);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

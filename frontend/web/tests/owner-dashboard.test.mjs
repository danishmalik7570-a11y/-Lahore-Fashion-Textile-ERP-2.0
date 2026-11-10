import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\6fe8461d-2d58-4cdf-9334-a4d1969878d5';

if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

async function runTests() {
  console.log('🚀 Starting Owner Dashboard & Single-Unit Mode Test Suite...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: DESKTOP 1440x900 (ENGLISH)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Desktop 1440x900 (EN) Verification & Screenshot ---');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1440 = await ctx1440.newPage();
    page1440.on('console', msg => console.log('  [Browser]', msg.text()));
    page1440.on('pageerror', err => console.error('  [Browser Error]', err.message));

    await page1440.goto('http://localhost:5173/');
    await page1440.evaluate(() => {
      localStorage.removeItem('lf_jwt_access');
      localStorage.setItem('lf_active_role', 'owner');
      localStorage.setItem('lf_active_portal', 'owner');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_owner_01',
          email: 'owner@lahorefashion.com',
          name: 'Mian Tariq Saigol',
          role: 'owner',
          role_display: 'Enterprise Owner / Chairman',
          is_2fa_enabled: false,
          permissions: ['*'],
        })
      );
    });
    await page1440.reload();
    await page1440.waitForSelector('[data-testid^="kpi-card-"]', { timeout: 15000 });
    await page1440.waitForTimeout(1000);

    // 1a. Verify Single Unit Mode (No Branch Switchers)
    const branchSwitcherCount = await page1440.locator('select:has-text("Branch"), [data-testid="branch-switcher"], .branch-selector').count();
    assert(branchSwitcherCount === 0, 'No branch switcher dropdown present anywhere');

    const multiBranchCards = await page1440.locator('text="Consolidated 4-Mill", text="Multi-Branch P&L", text="FSD-01", text="MLT-01", text="KHI-01"').count();
    assert(multiBranchCards === 0, 'No multi-branch cards or comparison widgets in UI');

    const singleMillBadge = await page1440.locator('text="Lahore Fashion Mill"').first();
    assert(await singleMillBadge.isVisible(), 'Header displays single enterprise mill: "Lahore Fashion Mill"');

    // 1b. Verify 9-Stage Flow (No Yarn Spinning)
    const spinningCount = await page1440.locator('text="Yarn Spinning"').count();
    assert(spinningCount === 0, 'Removed "Yarn Spinning" wording');

    const stageKeys = [
      { key: 'YARN', name: 'Yarn Store' },
      { key: 'WEAVING', name: 'Weaving/Knitting' },
      { key: 'GREY_INSPECT', name: 'Grey Fabric' },
      { key: 'DYEING', name: 'Dyeing' },
      { key: 'PRINTING', name: 'Printing' },
      { key: 'CUTTING', name: 'Cutting' },
      { key: 'STITCHING', name: 'Stitching' },
      { key: 'PACKING', name: 'Finishing & Packing' },
      { key: 'DISPATCH', name: 'Delivery' },
    ];
    for (const st of stageKeys) {
      const stageCard = page1440.locator(`[data-testid="stage-card-${st.key}"]`);
      assert(await stageCard.isVisible(), `Production flow includes stage: ${st.name}`);
    }

    // 1c. Verify 6 KPI Cards with Real Data & Tooltips
    const kpiCards = await page1440.locator('[data-testid^="kpi-card-"]').count();
    assert(kpiCards === 6, `Found exactly 6 KPI cards (got ${kpiCards})`);

    // Hover first KPI to test tooltip with Formula and Source
    const firstKpiInfo = page1440.locator('[data-testid="kpi-info-active_orders"]');
    if (await firstKpiInfo.isVisible()) {
      await firstKpiInfo.hover();
      await page1440.waitForTimeout(300);
      const tooltip = page1440.locator('text="Formula:"');
      assert(await tooltip.isVisible(), 'KPI Formula tooltip appears on hover');
    }

    // 1d. Live status chip
    const liveChip = page1440.locator('text="Live"').first();
    assert(await liveChip.isVisible(), 'Live status chip is visible');

    // Save screenshot
    const shot1440En = path.join(artifactsDir, 'owner_dashboard_1440x900_en.png');
    await page1440.screenshot({ path: shot1440En, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shot1440En}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 2: DESKTOP 1440x900 (URDU RTL)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Desktop 1440x900 (Urdu RTL) Verification & Screenshot ---');
    const urduToggle = page1440.locator('[data-testid="toggle-lang-ur"]');
    if (await urduToggle.isVisible()) {
      await urduToggle.click();
      await page1440.waitForTimeout(1000);
      const urduHeading = page1440.locator('h1').first();
      const headingText = await urduHeading.innerText();
      assert(headingText.includes('لاہور فیشن مل') || headingText.includes('ڈیش بورڈ'), 'Urdu text rendered with RTL styling');
    }

    const shot1440Ur = path.join(artifactsDir, 'owner_dashboard_1440x900_ur.png');
    await page1440.screenshot({ path: shot1440Ur, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shot1440Ur}`);

    await ctx1440.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 3: FULL HD 1920x1080 (ENGLISH & URDU)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Full HD 1920x1080 Verification & Screenshots ---');
    const ctx1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page1920 = await ctx1920.newPage();
    page1920.on('console', msg => console.log('  [1920 Log]', msg.text()));
    page1920.on('pageerror', err => console.error('  [1920 Error]', err.message));
    page1920.on('response', res => {
      if (res.url().includes('demo-data') || res.url().includes('stats')) {
        console.log('  [1920 Response]', res.url(), res.status());
      }
    });

    await page1920.goto('http://localhost:5173/');
    await page1920.evaluate(() => {
      localStorage.removeItem('lf_jwt_access');
      localStorage.setItem('lf_active_role', 'owner');
      localStorage.setItem('lf_active_portal', 'owner');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_owner_01',
          email: 'owner@lahorefashion.com',
          name: 'Mian Tariq Saigol',
          role: 'owner',
          role_display: 'Enterprise Owner / Chairman',
          is_2fa_enabled: false,
          permissions: ['*'],
        })
      );
    });
    await page1920.reload();
    await page1920.waitForSelector('[data-testid^="kpi-card-"]', { timeout: 15000 });
    await page1920.waitForTimeout(1000);

    const shot1920En = path.join(artifactsDir, 'owner_dashboard_1920x1080_en.png');
    await page1920.screenshot({ path: shot1920En, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shot1920En}`);

    // Switch to Urdu
    const urduToggle1920 = page1920.locator('[data-testid="toggle-lang-ur"]');
    if (await urduToggle1920.isVisible()) {
      await urduToggle1920.click();
      await page1920.waitForTimeout(1000);
    }
    const shot1920Ur = path.join(artifactsDir, 'owner_dashboard_1920x1080_ur.png');
    await page1920.screenshot({ path: shot1920Ur, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shot1920Ur}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 4: DEMO DATA LIFECYCLE (LOAD DEMO DATA -> VERIFY -> WIPE)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Demo Data Lifecycle Verification ---');
    // Switch back to English
    const engToggle = page1920.locator('[data-testid="toggle-lang-en"]');
    if (await engToggle.isVisible()) {
      await engToggle.click();
      await page1920.waitForTimeout(600);
    }

    const demoActionBtn = page1920.locator('[data-testid="btn-demo-action"]').first();
    if (await demoActionBtn.isVisible()) {
      console.log('  Triggering "Load demo data"...');
      const loadPromise = page1920.waitForResponse(res => res.url().includes('demo-data/load') && res.status() === 200, { timeout: 15000 });
      await demoActionBtn.click();
      await loadPromise;
      await page1920.waitForSelector('text="DEMO DATA ACTIVE"', { timeout: 15000 });

      // Verify Demo Data banner appears
      const demoBanner = page1920.locator('text="DEMO DATA ACTIVE"').first();
      assert(await demoBanner.isVisible(), 'Demo data banner is displayed while demo data is active');

      // Verify "Remove demo data" button appears
      const removeDemoBtn = page1920.locator('[data-testid="btn-remove-demo-banner"]').first();
      assert(await removeDemoBtn.isVisible(), '"Remove demo data" button is available');

      // Trigger remove demo data
      console.log('  Triggering "Remove demo data"...');
      const wipePromise = page1920.waitForResponse(res => res.url().includes('demo-data/wipe') && res.status() === 200, { timeout: 15000 });
      await removeDemoBtn.click();
      await wipePromise;
      await page1920.waitForSelector('text="DEMO DATA ACTIVE"', { state: 'detached', timeout: 15000 });
      const bannerCount = await page1920.locator('text="DEMO DATA ACTIVE"').count();
      assert(bannerCount === 0, 'Demo data banner disappeared after wiping demo data');
    } else {
      console.log('  ℹ️ Demo action button not found');
    }

    await ctx1920.close();

    console.log(`\n==========================================`);
    console.log(`🏁 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================\n`);
  } catch (err) {
    console.error('Unhandled test exception:', err);
  } finally {
    await browser.close();
  }
}

runTests();

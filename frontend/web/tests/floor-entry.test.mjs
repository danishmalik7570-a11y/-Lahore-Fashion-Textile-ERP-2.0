import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runTests() {
  console.log('🚀 Starting Floor Entry & RBAC Playwright Test Suite...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: RBAC PERMISSIONS TEST
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Suite 1: RBAC Menu Visibility (entry.create) ---');
    const rbacContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const rbacPage = await rbacContext.newPage();

    // 1a. Test Supervisor (HAS entry.create -> MUST see Floor Entry)
    await rbacPage.goto('http://localhost:5173/');
    await rbacPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'supervisor');
      localStorage.setItem('lf_active_portal', 'floor');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_supervisor_01',
          email: 'supervisor@lahorefashion.com',
          name: 'Tariq Mehmood',
          role: 'supervisor',
          role_display: 'Floor Supervisor',
          is_2fa_enabled: false,
          department: 'Stitching',
        })
      );
    });
    await rbacPage.reload();
    await rbacPage.waitForTimeout(1000);

    const supervisorHasFloorEntry = await rbacPage.locator('[data-testid="nav-floor-entry"]').count();
    assert(supervisorHasFloorEntry > 0, 'Supervisor role sees Floor Entry menu item');

    // 1b. Test Owner (HAS entry.create -> MUST see Floor Entry)
    await rbacPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'owner');
      localStorage.setItem('lf_active_portal', 'owner');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_owner_01',
          email: 'owner@lahorefashion.com',
          name: 'Mian Tariq Saigol',
          role: 'owner',
          role_display: 'Enterprise Owner',
          is_2fa_enabled: false,
        })
      );
    });
    await rbacPage.reload();
    await rbacPage.waitForTimeout(1000);

    const ownerHasFloorEntry = await rbacPage.locator('[data-testid="nav-floor-entry"]').count();
    assert(ownerHasFloorEntry > 0, 'Owner role sees Floor Entry menu item');

    // 1c. Test Production Manager (HAS entry.create -> MUST see Floor Entry)
    await rbacPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'production_manager');
      localStorage.setItem('lf_active_portal', 'dept');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_pm_01',
          email: 'pm@lahorefashion.com',
          name: 'Khurram Shahzad',
          role: 'production_manager',
          role_display: 'Production Manager',
          is_2fa_enabled: false,
          department: 'Stitching',
        })
      );
    });
    await rbacPage.reload();
    await rbacPage.waitForTimeout(1000);

    const pmHasFloorEntry = await rbacPage.locator('[data-testid="nav-floor-entry"]').count();
    assert(pmHasFloorEntry > 0, 'Production Manager role sees Floor Entry menu item in Department portal');

    // 1d. Test Accountant (DOES NOT HAVE entry.create -> MUST NOT see Floor Entry)
    await rbacPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'accountant');
      localStorage.setItem('lf_active_portal', 'finance');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_acc_01',
          email: 'accountant@lahorefashion.com',
          name: 'Farhan Ali',
          role: 'accountant',
          role_display: 'Chief Accountant',
          is_2fa_enabled: false,
        })
      );
    });
    await rbacPage.reload();
    await rbacPage.waitForTimeout(1000);

    const accountantHasFloorEntry = await rbacPage.locator('[data-testid="nav-floor-entry"]').count();
    assert(accountantHasFloorEntry === 0, 'Accountant role DOES NOT see Floor Entry menu item (RBAC enforced)');

    // 1e. Test Store Keeper (DOES NOT HAVE entry.create -> MUST NOT see Floor Entry)
    await rbacPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'store_keeper');
      localStorage.setItem('lf_active_portal', 'stores');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_store_01',
          email: 'store@lahorefashion.com',
          name: 'Zahid Khan',
          role: 'store_keeper',
          role_display: 'Store Keeper',
          is_2fa_enabled: false,
        })
      );
    });
    await rbacPage.reload();
    await rbacPage.waitForTimeout(1000);

    const storeHasFloorEntry = await rbacPage.locator('[data-testid="nav-floor-entry"]').count();
    assert(storeHasFloorEntry === 0, 'Store Keeper role DOES NOT see Floor Entry menu item (RBAC enforced)');

    await rbacContext.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 2: FLOOR ENTRY SCREEN INSIDE SHELL (DESKTOP 1366x768)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Suite 2: Floor Entry Screen at 1366x768 ---');
    const deskContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await deskContext.newPage();

    // Setup supervisor user in floor portal
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('lf_active_role', 'supervisor');
      localStorage.setItem('lf_active_portal', 'floor');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_supervisor_01',
          email: 'supervisor@lahorefashion.com',
          name: 'Muhammad Aslam',
          employee_id: 'WF-1042',
          role: 'supervisor',
          role_display: 'Floor Supervisor',
          is_2fa_enabled: false,
          department: 'Stitching',
        })
      );
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Click Floor Entry nav
    await page.click('[data-testid="nav-floor-entry"]');
    await page.waitForTimeout(600);

    // Verify Title & Breadcrumb
    const pageTitle = await page.textContent('h1');
    assert(pageTitle?.includes('Floor Entry'), 'Page title "Floor Entry" rendered');

    // Verify Worker Summary Bar
    const workerBarText = await page.textContent('body');
    assert(workerBarText?.includes('Pieces today'), 'Worker bar displays "Pieces today" stat');
    assert(workerBarText?.includes('Earnings today'), 'Worker bar displays "Earnings today" stat');
    assert(workerBarText?.includes('Target progress'), 'Worker bar displays "Target progress" bar');
    assert(workerBarText?.includes('WF-1042'), 'Worker employee ID WF-1042 displayed');

    // Verify Main Row Cards
    assert(workerBarText?.includes('Current Bundle'), 'Left card "Current Bundle" is rendered');
    assert(workerBarText?.includes('Rejects / Defects'), 'Right card "Rejects / Defects" is rendered');
    assert(workerBarText?.includes('Recent entries'), 'Bottom row "Recent entries" table is rendered');

    // Verify Defect chips
    assert(workerBarText?.includes('Needle cut'), 'Defect reason "Needle cut" chip is present');
    assert(workerBarText?.includes('Broken thread'), 'Defect reason "Broken thread" chip is present');
    assert(workerBarText?.includes('Oil stain'), 'Defect reason "Oil stain" chip is present');
    assert(workerBarText?.includes('Skipped stitch'), 'Defect reason "Skipped stitch" chip is present');
    assert(workerBarText?.includes('Fabric puckering'), 'Defect reason "Fabric puckering" chip is present');
    assert(workerBarText?.includes('Shade variance'), 'Defect reason "Shade variance" chip is present');

    // Test Quick chips interaction: click '25'
    const chip25 = page.locator('button:has-text("25")').first();
    await chip25.click();
    await page.waitForTimeout(300);

    // Check estimated earnings update: 25 * 22.5 = 562.5
    const bodyContent = await page.textContent('body');
    assert(bodyContent?.includes('562.5') || bodyContent?.includes('563'), 'Estimated earning updated with quick chip 25 pcs');

    // Take English screenshot at 1366x768
    const screenshot1366En = path.join(screenshotsDir, 'after_1366x768_en.png');
    await page.screenshot({ path: screenshot1366En, fullPage: true });
    console.log(`  📸 Saved screenshot: ${screenshot1366En}`);

    // Test Submit Entry & Inline Success Banner with Undo
    const submitBtn = page.locator('button:has-text("Submit entry")').first();
    await submitBtn.click();
    await page.waitForTimeout(600);

    const bannerText = await page.textContent('[role="status"]');
    assert(bannerText?.includes('Entry saved'), 'Inline success banner "Entry saved" is displayed');

    const undoBtn = page.locator('button:has-text("Undo")');
    assert((await undoBtn.count()) > 0, 'Undo button is displayed in success banner');

    // Click Undo
    await undoBtn.click();
    await page.waitForTimeout(500);
    const bannerAfterUndo = await page.locator('[role="status"]').count();
    assert(bannerAfterUndo === 0, 'Entry successfully undone and banner dismissed');

    // Test Urdu Language Toggle
    const urduToggleBtn = page.locator('button:has-text("اردو")').first();
    await urduToggleBtn.click();
    await page.waitForTimeout(600);

    // Verify RTL and Urdu title
    const dirAttr = await page.locator('[dir="rtl"]').count();
    assert(dirAttr > 0, 'RTL layout direction applied for Urdu mode');
    const urduTitle = await page.textContent('h1');
    assert(urduTitle?.includes('فلور ڈیٹا اندراج'), 'Urdu title "فلور ڈیٹا اندراج" rendered');

    // Take Urdu screenshot at 1366x768
    const screenshot1366Ur = path.join(screenshotsDir, 'after_1366x768_ur.png');
    await page.screenshot({ path: screenshot1366Ur, fullPage: true });
    console.log(`  📸 Saved screenshot: ${screenshot1366Ur}`);

    await deskContext.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 3: FULL HD 1920x1080 (EN & UR)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Suite 3: Screenshots at 1920x1080 ---');
    const fhdContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const fhdPage = await fhdContext.newPage();

    await fhdPage.goto('http://localhost:5173/');
    await fhdPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'supervisor');
      localStorage.setItem('lf_active_portal', 'floor');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_supervisor_01',
          email: 'supervisor@lahorefashion.com',
          name: 'Muhammad Aslam',
          employee_id: 'WF-1042',
          role: 'supervisor',
          role_display: 'Floor Supervisor',
          is_2fa_enabled: false,
          department: 'Stitching',
        })
      );
    });
    await fhdPage.reload();
    await fhdPage.waitForTimeout(800);
    await fhdPage.click('[data-testid="nav-floor-entry"]');
    await fhdPage.waitForTimeout(600);

    const screenshot1920En = path.join(screenshotsDir, 'after_1920x1080_en.png');
    await fhdPage.screenshot({ path: screenshot1920En, fullPage: true });
    console.log(`  📸 Saved screenshot: ${screenshot1920En}`);

    // Switch to Urdu
    await fhdPage.locator('button:has-text("اردو")').first().click();
    await fhdPage.waitForTimeout(600);

    const screenshot1920Ur = path.join(screenshotsDir, 'after_1920x1080_ur.png');
    await fhdPage.screenshot({ path: screenshot1920Ur, fullPage: true });
    console.log(`  📸 Saved screenshot: ${screenshot1920Ur}`);

    await fhdContext.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 4: WORKER PORTAL MINIMAL SHELL (NO SIDEBAR)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Suite 4: Worker Portal Minimal Shell (No Sidebar) ---');
    const workerContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const workerPage = await workerContext.newPage();

    await workerPage.goto('http://localhost:5173/');
    await workerPage.evaluate(() => {
      localStorage.setItem('lf_active_role', 'worker');
      localStorage.setItem('lf_active_portal', 'kiosk');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_worker_01',
          email: 'worker@lahorefashion.com',
          name: 'Muhammad Aslam',
          employee_id: 'WF-1042',
          role: 'worker',
          role_display: 'Sewing Operator',
          is_2fa_enabled: false,
          department: 'Stitching',
        })
      );
    });
    await workerPage.reload();
    await workerPage.waitForTimeout(1000);

    // Verify sidebar is NOT present in minimal shell
    const asideCount = await workerPage.locator('aside').count();
    assert(asideCount === 0, 'Worker portal renders minimal shell with NO sidebar');

    // Verify Floor Entry is displayed directly
    const workerFloorTitle = await workerPage.textContent('h1');
    assert(workerFloorTitle?.includes('Floor Entry'), 'Floor Entry is embedded inside minimal shell');

    const screenshotWorker = path.join(screenshotsDir, 'after_worker_kiosk_1366x768.png');
    await workerPage.screenshot({ path: screenshotWorker, fullPage: true });
    console.log(`  📸 Saved screenshot: ${screenshotWorker}`);

    await workerContext.close();

    console.log(`\n🎉 Test Suite Completed: ${passedTests} / ${totalTests} assertions passed!`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

runTests();

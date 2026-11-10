import { chromium } from 'playwright';
import assert from 'assert';

(async () => {
  console.log('🚀 Testing Dashboard Tab Redirection...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
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
  await page.reload();
  await page.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
  await page.waitForTimeout(500);

  // 1. Click Finance tab
  console.log('  1. Clicking "Finance" tab on Owner Dashboard...');
  await page.click('[data-testid="dashboard-tab-finance"]');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Financial Ledgers & FBR Sales Tax Invoicing"').isVisible(), 'Redirected to Finance module');
  console.log('  ✅ PASS: "Finance" tab redirected to Financial Ledgers page');

  // Go back to Dashboard
  await page.click('[data-testid="nav-group-dashboard"]');
  await page.waitForTimeout(500);

  // 2. Click Production tab
  console.log('  2. Clicking "Production" tab on Owner Dashboard...');
  await page.click('[data-testid="dashboard-tab-production"]');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Production Telemetry & Loom Stage Tracking"').isVisible(), 'Redirected to Production module');
  console.log('  ✅ PASS: "Production" tab redirected to Production page');

  // Go back to Dashboard
  await page.click('[data-testid="nav-group-dashboard"]');
  await page.waitForTimeout(500);

  // 3. Click HR tab
  console.log('  3. Clicking "HR" tab on Owner Dashboard...');
  await page.click('[data-testid="dashboard-tab-hr"]');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Labour Management & Biometric Attendance"').isVisible(), 'Redirected to HR module');
  console.log('  ✅ PASS: "HR" tab redirected to HR & Workforce page');

  // Go back to Dashboard
  await page.click('[data-testid="nav-group-dashboard"]');
  await page.waitForTimeout(500);

  // 4. Click Quality & Stock tab
  console.log('  4. Clicking "Quality & Stock" tab on Owner Dashboard...');
  await page.click('[data-testid="dashboard-tab-quality_stock"]');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Quality Assurance & ASTM 4-Point Inspection"').isVisible(), 'Redirected to Quality module');
  console.log('  ✅ PASS: "Quality & Stock" tab redirected to Quality Control page');

  console.log('\n==========================================');
  console.log('🏁 All Dashboard Tab Redirection tests PASSED!');
  console.log('==========================================\n');

  await browser.close();
})();

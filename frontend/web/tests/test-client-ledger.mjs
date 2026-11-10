import { chromium } from 'playwright';
import path from 'path';
import assert from 'assert';

const artifactsDir = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\6fe8461d-2d58-4cdf-9334-a4d1969878d5';

(async () => {
  console.log('🚀 Starting Client Tab & Ledgers Playwright Verification...');
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

  // 1. Expand Finance and click Client Ledgers
  console.log('  1. Clicking Finance group -> Client Ledgers...');
  await page.click('[data-testid="btn-group-finance"]');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Client Ledgers")');
  await page.waitForTimeout(500);

  // Verify ClientsView rendered
  const clientHeading = await page.locator('text="Clients & Commercial Brand Accounts"').isVisible();
  assert(clientHeading, 'Clients & Commercial Brand Accounts header is visible');
  console.log('  ✅ PASS: Client Ledgers routed directly to ClientsView');

  // Verify Quick Ledger Selector is present
  const quickSelector = await page.locator('text="Open Client Ledger Statement:"').isVisible();
  assert(quickSelector, 'Quick Client Ledger Statement selector is visible');
  console.log('  ✅ PASS: Quick Client Ledger Statement selector is present');

  const shotClientsView = path.join(artifactsDir, 'clients_accounts_view_1440x900.png');
  await page.screenshot({ path: shotClientsView, fullPage: true });
  console.log(`  📸 Saved screenshot: ${shotClientsView}`);

  // 2. Click "View Real-Time Commercial Ledger" on the first client card (Khaadi Apparel)
  console.log('  2. Opening Khaadi Apparel real-time ledger statement...');
  await page.click('button:has-text("View Real-Time Commercial Ledger") >> nth=0');
  await page.waitForTimeout(500);

  const ledgerHeading = await page.locator('text="Khaadi Apparel (Financial Statement)"').isVisible();
  assert(ledgerHeading, 'Khaadi Apparel ledger statement opened');
  console.log('  ✅ PASS: Khaadi Apparel real-time ledger statement is rendered');

  const shotClientLedger = path.join(artifactsDir, 'client_ledger_statement_1440x900.png');
  await page.screenshot({ path: shotClientLedger, fullPage: true });
  console.log(`  📸 Saved screenshot: ${shotClientLedger}`);

  // 3. Return and verify Orders -> Clients & Accounts
  await page.click('button:has-text("Back to Clients & Accounts")');
  await page.waitForTimeout(300);
  console.log('  3. Testing Orders -> Clients & Accounts link...');
  await page.click('[data-testid="btn-group-orders"]');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Clients & Accounts")');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Clients & Commercial Brand Accounts"').isVisible(), 'Clients & Accounts from Orders opened correctly');
  console.log('  ✅ PASS: Orders -> Clients & Accounts works seamlessly');

  // 4. Test inside Finance View tabs
  console.log('  4. Testing Finance View tab: Client Ledgers & Accounts...');
  await page.click('[data-testid="btn-group-finance"]');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Invoices")');
  await page.waitForTimeout(500);
  // Now click tab inside FinanceView
  await page.click('button:has-text("Client Ledgers & Accounts")');
  await page.waitForTimeout(500);
  assert(await page.locator('text="Clients & Commercial Brand Accounts"').isVisible(), 'Client Ledgers tab inside FinanceView works');
  console.log('  ✅ PASS: FinanceView internal tab Client Ledgers & Accounts works seamlessly');

  console.log('\n==========================================');
  console.log('🏁 All Client Tab & Ledger tests PASSED!');
  console.log('==========================================\n');

  await browser.close();
})();

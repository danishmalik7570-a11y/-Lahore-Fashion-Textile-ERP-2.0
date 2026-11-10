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

async function runSidebarTests() {
  console.log('🚀 Starting Sidebar Navigation & Accordion Playwright Test Suite...');
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
    // TEST 1: HR ROLE PERMISSION SCOPING
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. HR User Permission Scoping ---');
    const hrCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hrPage = await hrCtx.newPage();

    await hrPage.goto('http://localhost:5173/');
    await hrPage.evaluate(() => {
      localStorage.removeItem('lf_jwt_access');
      localStorage.setItem('lf_active_role', 'hr_manager');
      localStorage.setItem('lf_active_portal', 'hr');
      localStorage.setItem(
        'lf_user',
        JSON.stringify({
          id: 'usr_hr_01',
          email: 'hr@lahorefashion.com',
          name: 'Rabia Siddiqui',
          role: 'hr_manager',
          role_display: 'HR & Labour Manager',
          is_2fa_enabled: false,
          permissions: ['hr.read', 'hr.write'],
        })
      );
    });
    await hrPage.reload();
    await hrPage.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
    await hrPage.waitForTimeout(1000);

    // 1a. Verify HR sees ONLY Dashboard + HR group
    const hrGroupCount = await hrPage.locator('[data-testid="nav-group-hr"]').count();
    assert(hrGroupCount === 1, 'HR group is present for HR user');

    const dashGroupCount = await hrPage.locator('[data-testid="nav-group-dashboard"]').count();
    assert(dashGroupCount === 1, 'Dashboard is present for HR user');

    const forbiddenGroups = ['orders', 'production', 'inventory', 'quality', 'delivery', 'admin'];
    for (const mod of forbiddenGroups) {
      const count = await hrPage.locator(`[data-testid="nav-group-${mod}"]`).count();
      assert(count === 0, `Forbidden group "${mod}" is NOT rendered for HR user`);
    }

    const hrShot = path.join(artifactsDir, 'sidebar_hr_role_1440x900.png');
    await hrPage.screenshot({ path: hrShot, fullPage: true });
    console.log(`  📸 Saved screenshot: ${hrShot}`);

    await hrCtx.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 2: OWNER EXPANDED SIDEBAR & ALL MODULES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Owner User: Complete Navigation Hierarchy & Accordion ---');
    const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const ownerPage = await ownerCtx.newPage();

    await ownerPage.goto('http://localhost:5173/');
    await ownerPage.evaluate(() => {
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
    await ownerPage.reload();
    await ownerPage.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
    await ownerPage.waitForTimeout(1000);

    // 2a. Verify all 10 modules are present in exact order
    const expectedModules = [
      'dashboard',
      'orders',
      'production',
      'inventory',
      'quality',
      'delivery',
      'hr',
      'finance',
      'reports',
      'admin',
    ];
    for (const mod of expectedModules) {
      const isVisible = await ownerPage.locator(`[data-testid="nav-group-${mod}"]`).isVisible();
      assert(isVisible, `Top-level module "${mod}" is rendered for Owner`);
    }

    // 2b. Cleanup check: no floating items above Command Center, no "15 OS" badge
    const floatingItems = await ownerPage.locator('text="Review Capital POs", text="Sankey Flow"').count();
    assert(floatingItems === 0, 'No floating items above Command Center in sidebar');

    const fifteenOsCount = await ownerPage.locator('text="15 OS"').count();
    assert(fifteenOsCount === 0, 'No decorative "15 OS" count badge');

    // 2c. Fixed quiet footer check (user name, role, Sign out)
    const footerUser = await ownerPage.locator('[data-testid="sidebar-footer"]').innerText();
    assert(footerUser.includes('Mian Tariq Saigol'), 'Sidebar footer displays user name');
    assert(footerUser.includes('Sign out') || (await ownerPage.locator('[data-testid="sidebar-signout-btn"]').isVisible()), 'Sidebar footer has Sign out button');

    const shotExpanded = path.join(artifactsDir, 'sidebar_expanded_1440x900.png');
    await ownerPage.screenshot({ path: shotExpanded, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shotExpanded}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 3: ACCORDION INTERACTION (OPEN ONE CLOSES OTHERS)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Accordion Interaction & Single Open State ---');
    // Open Orders
    console.log('  Clicking Orders group...');
    await ownerPage.click('[data-testid="btn-group-orders"]');
    await ownerPage.waitForTimeout(300);
    const ordersChildren = ownerPage.locator('[data-testid="group-children-orders"]');
    assert(await ordersChildren.isVisible(), 'Orders group children expanded');

    const shotGroupOpen = path.join(artifactsDir, 'sidebar_group_open_1440x900.png');
    await ownerPage.screenshot({ path: shotGroupOpen, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shotGroupOpen}`);

    // Open Production -> Orders must automatically close
    console.log('  Clicking Production group...');
    await ownerPage.click('[data-testid="btn-group-production"]');
    await ownerPage.waitForTimeout(300);
    const prodChildren = ownerPage.locator('[data-testid="group-children-production"]');
    assert(await prodChildren.isVisible(), 'Production group children expanded');
    assert(!(await ordersChildren.isVisible()), 'Orders group automatically closed when Production was opened');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: IN-SIDEBAR SEARCH ("Find page...")
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. In-Sidebar Search / Ctrl+K ---');
    const searchInput = ownerPage.locator('[data-testid="sidebar-search-input"]');
    await searchInput.fill('Challans');
    await ownerPage.waitForTimeout(300);
    const searchResult = ownerPage.locator('[data-testid="sidebar-search-results"]');
    assert(await searchResult.isVisible(), 'Search results dropdown appeared for query "Challans"');
    await searchInput.fill('');
    await ownerPage.waitForTimeout(200);

    // ─────────────────────────────────────────────────────────────
    // TEST 5: COLLAPSED MODE & FLYOUT PANEL
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Collapsed Mode & Flyout Panel ---');
    // Click collapse button
    await ownerPage.click('[data-testid="btn-collapse-sidebar"]');
    await ownerPage.waitForTimeout(300);
    const sidebarWidth = await ownerPage.locator('[data-testid="sidebar"]').evaluate((el) => el.offsetWidth);
    assert(sidebarWidth <= 64, `Sidebar collapsed to icon-only mode (width: ${sidebarWidth}px)`);

    // Hover Production group icon to trigger flyout
    console.log('  Hovering over Production icon in collapsed mode...');
    await ownerPage.hover('[data-testid="btn-group-production"]');
    await ownerPage.waitForTimeout(300);
    const flyout = ownerPage.locator('[data-testid="sidebar-flyout"]');
    assert(await flyout.isVisible(), 'Flyout menu appeared on hover in collapsed mode');

    const shotCollapsed = path.join(artifactsDir, 'sidebar_collapsed_1440x900.png');
    await ownerPage.screenshot({ path: shotCollapsed, fullPage: true });
    console.log(`  📸 Saved screenshot: ${shotCollapsed}`);

    await ownerCtx.close();

    console.log(`\n==========================================`);
    console.log(`🏁 Sidebar Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================\n`);
  } catch (err) {
    console.error('Unhandled test exception:', err);
  } finally {
    await browser.close();
  }
}

runSidebarTests();

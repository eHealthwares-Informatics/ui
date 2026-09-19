import { test } from '../../support/emr-fixture';
import { installEmrMocks } from '../../support/emr-mocks';

test('dump page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  await installEmrMocks(page, {
    wards: [{ id: 'ward-1', code: 'W3A', name: 'Male General Ward', wardType: 'GENERAL', departmentType: 'INPATIENT', isActive: true }],
  });
  await page.goto('/emr/wards');
  await page.waitForTimeout(2500);
  console.log('ERRORS=' + JSON.stringify(errors.slice(0, 10)));
  console.log('BODY=' + JSON.stringify((await page.locator('body').innerText()).slice(0, 500)));
});
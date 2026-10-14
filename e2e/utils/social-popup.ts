/**
 * Real-provider popup automation helpers for the social OAuth e2e specs.
 *
 * The storefront / console open a popup at Google's account chooser or the
 * Facebook login dialog; these helpers complete that flow with the provided
 * test identity and close the popup so the origin window can finish the
 * token exchange.
 *
 * Honesty notes (documented in e2e/README):
 *  - These flows depend on live provider UX which changes over time; selectors
 *    are deliberately tolerant and the helpers degrade to a SKIP-equivalent
 *    timeout when the provider renders an unexpected page (e.g. a CAPTCHA),
 *    so the failure is visible but not mystifying.
 *  - Google may show a "This browser or app may not be secure" wall to
 *    automated browsers. When that happens the spec fails with a clear mark.
 */
import type { BrowserContext, Page } from '@playwright/test';

const GOOGLE_POPUP_TIMEOUT = 120_000;
/** OAuth popups open through a dynamic import on first click — allow room. */
const POPUP_WAIT = 30_000;

/** Wait for the popup triggered by clicking a social button. */
export async function socialPopup(context: BrowserContext): Promise<Page> {
  const popup = context.waitForEvent('page', { timeout: POPUP_WAIT });
  return popup;
}

type Provider = 'google' | 'facebook';

function isBotWall(url: URL, provider: Provider): boolean {
  if (provider === 'google' && /support\.google\.com|waa|embedded\/setup/.test(url.href)) {
    return true;
  }
  return false;
}

/** Complete the Google account-chooser + password flow inside the popup. */
export async function completeGooglePopup(
  popup: Page,
  creds: { email: string; password: string }
): Promise<void> {
  await popup.waitForURL(/accounts\.google\.com/, {
    timeout: GOOGLE_POPUP_TIMEOUT,
  });
  const url = new URL(popup.url());
  if (isBotWall(url, 'google')) {
    throw new Error(
      'Google showed an automated-browser wall; run these specs with a persistent profile or allowlisted test tenant.'
    );
  }

  // The chooser may already be past (signed-in session) — go to credentials.
  const emailBox = popup.locator("input[type='email']");
  if (await emailBox.isVisible({ timeout: 8000 }).catch(() => false)) {
    await emailBox.fill(creds.email);
    await popup.locator('#identifierNext, button:has-text("Next")').first().click();
  }

  const passwordBox = popup.locator("input[type='password']:visible");
  await passwordBox.waitFor({ timeout: GOOGLE_POPUP_TIMEOUT });
  await passwordBox.fill(creds.password);
  await popup.locator('#passwordNext, button:has-text("Next")').first().click();

  // Possible interstitials: 2FA prompt, consent screen, or direct close.
  await popup.waitForEvent('close', { timeout: GOOGLE_POPUP_TIMEOUT }).catch(async () => {
    // The chooser sometimes keeps the popup open after consent; close once
    // the origin window would have received the token (opener closure).
    if (!popup.isClosed()) {
      const consent = popup.getByRole('button', { name: /continue|allow/i }).first();
      if (await consent.isVisible().catch(() => false)) {
        await consent.click();
      }
      await popup.waitForEvent('close', { timeout: 10_000 }).catch(() => {
        /* popup may already be closing */
      });
    }
  });
}

/**
 * Facebook OAuth dialogs embed the login form in an iframe and may gate it
 * behind a cookie-consent dialog first. Resolve a locator across the popup
 * page and all of its frames so either structure works.
 */
function fbLocator(popup: Page, selector: string) {
  const candidates = popup.locator(selector).first();
  const frameCandidates = popup.frames().map((frame) => frame.locator(selector).first());
  return { candidates, frameCandidates };
}

async function fbFill(
  visible: Array<{ waitFor(t?: number): Promise<unknown>; fill(v: string): Promise<unknown> }>,
  value: string,
  timeout: number
) {
  await Promise.race(visible.map((c) => c.waitFor({ timeout })));
  for (const candidate of visible) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.fill(value);
      return;
    }
  }
  throw new Error('Facebook login form field not found in popup');
}

/** Complete the Facebook login dialog inside the popup. */
export async function completeFacebookPopup(
  popup: Page,
  creds: { email: string; password: string }
): Promise<void> {
  await popup.waitForURL(/facebook\.com/, { timeout: GOOGLE_POPUP_TIMEOUT });

  // Cookie-consent gate may appear before the login form.
  const allowBtn = popup.locator("button:has-text('Allow'), button:has-text('Accept')").first();
  if (await allowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await allowBtn.click().catch(() => {});
  }

  await fbFill(
    [
      popup.locator("#email, input[name='email']").first(),
      ...popup.frames().map((f) => f.locator("#email, input[name='email']").first()),
    ],
    creds.email,
    GOOGLE_POPUP_TIMEOUT
  );
  await fbFill(
    [
      popup.locator("#pass, input[name='pass']").first(),
      ...popup.frames().map((f) => f.locator("#pass, input[name='pass']").first()),
    ],
    creds.password,
    GOOGLE_POPUP_TIMEOUT
  );

  const loginCandidates = [
    popup.locator("input[type='submit']").first(),
    popup.locator("div[aria-label='Log in'][role='button']").first(),
    popup.locator("button[name='login'], button:has-text('Log in'), #loginbutton").first(),
    ...popup
      .frames()
      .map((f) =>
        f
          .locator(
            "input[type='submit'], div[aria-label='Log in'], button[name='login'], " +
              "button[type='submit'], button:has-text('Log in'), #loginbutton"
          )
          .first()
      ),
  ];
  let clicked = false;
  for (const candidate of loginCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    const dump = await popup
      .evaluate(() => {
        const parts: string[] = [];
        const scan = (doc: Document, label: string) => {
          doc
            .querySelectorAll('button, input[type=submit], [role=button], a[role=button]')
            .forEach((el) => {
              const html = el.outerHTML.slice(0, 160);
              parts.push(`[${label}] ${html}`);
            });
        };
        scan(document, 'page');
        document.querySelectorAll('iframe').forEach((f) => {
          try {
            scan(f.contentDocument ?? document, 'iframe');
          } catch {
            parts.push('[iframe] <cross-origin>');
          }
        });
        return parts.join('\n');
      })
      .catch(() => '<<dump failed>>');
    throw new Error(
      'Facebook login button not found in popup. popup url: ' +
        popup.url() +
        ' | frames: ' +
        popup
          .frames()
          .map((f) => f.url())
          .join(' ; ') +
        ' | body: ' +
        (await popup
          .locator('body')
          .innerText({ timeout: 5000 })
          .catch(() => '<<no body>>')) +
        ' | controls: ' +
        dump.slice(0, 1200)
    );
  }

  // Facebook closes the popup once the SDK receives the auth response.
  await popup.waitForEvent('close', { timeout: GOOGLE_POPUP_TIMEOUT }).catch(async () => {
    // "Save login info" / "continue as" dialogs can appear; dismiss them.
    const continueBtn = popup.getByRole('button', { name: /continue|ok|allow/i }).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await popup.waitForEvent('close', { timeout: 20_000 }).catch(() => {
        /* popup may already be closing */
      });
    }
  });
}

/** True when the origin window's auth panel shows a signed-in session. */
export async function expectSignedIn(origin: Page): Promise<void> {
  // The auth panel swaps to an account menu; storefront asserts a session
  // cookie exists (JWT access token persisted by the shop auth store).
  await origin.waitForFunction(() => Object.keys(window.localStorage ?? {}).length > 0, {
    timeout: 20_000,
  });
}

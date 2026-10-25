/**
 * Client-side helpers for Google / Facebook sign-in on the storefront.
 *
 * Both providers are used in popup mode: the browser obtains an OAuth access
 * token (Google Identity Services token client / Facebook SDK FB.login — the
 * getLoginStatus → login flow), then the token is POSTed to
 * /website/auth/oauth/{google|facebook} where it is verified server-side and
 * exchanged for the app's own JWT pair. No redirect/fragment handling needed.
 */

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';

export const FACEBOOK_APP_ID = (import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined) ?? '';

type GoogleTokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

type GoogleGlobal = {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: {
            access_token?: string;
            error?: string;
            error_description?: string;
          }) => void;
          error_callback?: (error: { type?: string; message?: string }) => void;
        }) => GoogleTokenClient;
      };
    };
  };
};

type FacebookGlobal = {
  FB?: {
    init: (opts: Record<string, unknown>) => void;
    getLoginStatus: (cb: (r: unknown) => void) => void;
    login: (cb: (r: unknown) => void, opts?: Record<string, unknown>) => void;
  };
  fbAsyncInit?: () => void;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load OAuth SDK')));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    // No crossOrigin: GSI/FB SDK scripts are classic scripts; adding
    // crossOrigin="anonymous" forces a CORS-mode fetch that Google's
    // accounts.google.com host does not satisfy with ACAO headers, which
    // blocks the whole script from loading (with or without consent).
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error('Failed to load OAuth SDK')));
    document.head.appendChild(script);
  });
}

/** Open the Google sign-in popup and resolve with an access token. */

/** Open the Google sign-in popup and resolve with an access token. */
export async function googleLogin(): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google sign-in is not configured');
  }

  await loadScript('https://accounts.google.com/gsi/client');

  const w = window as unknown as GoogleGlobal;
  const oauth2 = w.google?.accounts?.oauth2;

  if (!oauth2) {
    console.error('Google Identity Services OAuth API unavailable.', {
      google: w.google,
      scriptLoaded: Boolean(
        document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      ),
    });

    throw new Error(
      'Google sign-in unavailable. Check SDK loading, CSP, network errors, and OAuth client configuration.'
    );
  }

  return new Promise<string | null>((resolve, reject) => {
    try {
      const client = oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',

        callback: (response) => {
          if (response.access_token) {
            resolve(response.access_token);
            return;
          }

          if (response.error) {
            if (response.error === 'access_denied' || response.error === 'user_cancelled') {
              resolve(null);
              return;
            }

            reject(
              new Error(response.error_description || `Google OAuth failed: ${response.error}`)
            );
            return;
          }

          resolve(null);
        },

        error_callback: (error) => {
          reject(
            new Error(
              `Google popup failed: ${error.type ?? 'unknown error'}${
                error.message ? ` — ${error.message}` : ''
              }`
            )
          );
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Google sign-in failed'));
    }
  });
}

/**
 * Open the Facebook sign-in flow: FB.getLoginStatus first (is the person
 * already logged into the app?), falling back to the FB.login dialog.
 * Resolves with an access token or null when the user cancels.
 */
export async function facebookLogin(): Promise<string | null> {
  if (!FACEBOOK_APP_ID) {
    throw new Error('Facebook sign-in is not configured');
  }
  await loadScript('https://connect.facebook.net/en_US/sdk.js');
  const w = window as unknown as FacebookGlobal;
  const FB = w.FB;
  if (!FB) {
    throw new Error('Facebook sign-in unavailable');
  }

  return new Promise<string | null>((resolve, reject) => {
    FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false,
      version: 'v19.0',
    });

    const extract = (response: unknown): string | null => {
      const r = response as { status?: string; authResponse?: { accessToken?: string } };
      if (r.status === 'connected' && r.authResponse?.accessToken) {
        return r.authResponse.accessToken;
      }
      return null;
    };

    try {
      FB.getLoginStatus((response) => {
        const token = extract(response);
        if (token) {
          resolve(token);
          return;
        }
        FB.login((loginResponse) => resolve(extract(loginResponse)), {
          scope: 'public_profile,email',
        });
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Facebook sign-in failed'));
    }
  });
}

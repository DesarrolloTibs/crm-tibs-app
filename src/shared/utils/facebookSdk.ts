declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

let fbSdkPromise: Promise<void> | null = null;

export function initFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.FB) {
    return Promise.resolve();
  }
  if (fbSdkPromise) {
    return fbSdkPromise;
  }

  fbSdkPromise = new Promise((resolve) => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
      resolve();
    };

    const id = 'facebook-jssdk';
    if (document.getElementById(id)) return;
    const js = document.createElement('script');
    js.id = id;
    js.src = 'https://connect.facebook.net/es_LA/sdk.js';
    js.async = true;
    js.defer = true;
    js.crossOrigin = 'anonymous';
    document.body.appendChild(js);
  });

  return fbSdkPromise;
}

export interface LaunchEmbeddedSignupOptions {
  appId: string;
  configId: string;
  onSuccess: (data: { code: string; wabaId: string; phoneNumberId: string }) => void;
  onError: (err: any) => void;
  onCancel?: () => void;
}

export function launchWhatsAppEmbeddedSignup({
  appId,
  configId,
  onSuccess,
  onError,
  onCancel,
}: LaunchEmbeddedSignupOptions): void {
  initFacebookSdk(appId)
    .then(() => {
      let capturedWabaId = '';
      let capturedPhoneNumberId = '';

      const messageHandler = (event: MessageEvent) => {
        if (
          event.origin !== 'https://www.facebook.com' &&
          event.origin !== 'https://web.facebook.com'
        ) {
          return;
        }
        try {
          const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (rawData?.type === 'WA_EMBEDDED_SIGNUP') {
            if (rawData?.data) {
              capturedWabaId = rawData.data.waba_id || rawData.data.wabaId || capturedWabaId;
              capturedPhoneNumberId =
                rawData.data.phone_number_id || rawData.data.phoneNumberId || capturedPhoneNumberId;
            }
          }
        } catch {
          // Ignorar eventos que no sean JSON
        }
      };

      window.addEventListener('message', messageHandler);

      window.FB.login(
        (response: any) => {
          window.removeEventListener('message', messageHandler);

          if (response?.authResponse?.code) {
            onSuccess({
              code: response.authResponse.code,
              wabaId: capturedWabaId,
              phoneNumberId: capturedPhoneNumberId,
            });
          } else if (response?.status === 'unknown') {
            if (onCancel) onCancel();
          } else {
            onError(response);
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: '',
            sessionInfoVersion: '3',
          },
        }
      );
    })
    .catch(onError);
}


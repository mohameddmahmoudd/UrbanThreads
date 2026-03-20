'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  userId: string;
}

export default function GameballWidget({ userId }: Props) {
  useEffect(() => {
    if (document.getElementById('gameball-script')) return;

    let script: HTMLScriptElement | null = null;

    api
      .get<{ token: string }>('/users/me/widget-token')
      .then(({ token }) => {
        (window as any).GbLoadInit = function () {
          (window as any).GbSdk.init({
            APIKey: process.env.NEXT_PUBLIC_GAMEBALL_API_KEY,
            lang: 'en',
            playerUniqueId: userId,
            playerAttributes: {},
            sessionToken: token,
          });
        };

        script = document.createElement('script');
        script.id = 'gameball-script';
        script.src = 'https://assets.gameball.co/widget/js/gameball-init.min.js';
        script.defer = true;
        document.body.appendChild(script);
      })
      .catch((err) =>
        console.error('[Gameball] Failed to fetch widget token:', err),
      );

    return () => {
      const existing = document.getElementById('gameball-script');
      if (existing) document.body.removeChild(existing);

      document
        .querySelectorAll('[id*="gameball"], [class*="gameball"]')
        .forEach((el) => el.remove());

      delete (window as any).GbSdk;
      delete (window as any).GbLoadInit;
    };
  }, [userId]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  userId: string;
}

export default function GameballWidget({ userId }: Props) {
  useEffect(() => {
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
        script.src = 'https://assets.gameball.co/widget/js/gameball-init.min.js';
        script.defer = true;
        document.body.appendChild(script);
      })
      .catch((err) =>
        console.error('[Gameball] Failed to fetch widget token:', err),
      );

    return () => {
      if (script) document.body.removeChild(script);
    };
  }, [userId]);

  return null;
}

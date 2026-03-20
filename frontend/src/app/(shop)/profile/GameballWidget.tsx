'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  userId: string;
}

export default function GameballWidget({ userId }: Props) {
  useEffect(() => {
    if (document.getElementById('gameball-script')) return;

    let cancelled = false;

    api
      .get<{ token: string }>('/users/me/widget-token')
      .then(({ token }) => {
        if (cancelled) return;

        (window as any).GbLoadInit = function () {
          (window as any).GbSdk.init({
            APIKey: process.env.NEXT_PUBLIC_GAMEBALL_API_KEY,
            lang: 'en',
            playerUniqueId: userId,
            playerAttributes: {},
            sessionToken: token,
          });
        };

        const script = document.createElement('script');
        script.id = 'gameball-script';
        script.src = 'https://assets.gameball.co/widget/js/gameball-init.min.js';
        script.defer = true;
        document.body.appendChild(script);
      })
      .catch((err) =>
        console.error('[Gameball] Failed to fetch widget token:', err),
      );

    return () => {
      cancelled = true;

      // 1. Stop GSAP/ScrollTrigger BEFORE touching the DOM
      try {
        const gsapRef = (window as any).gsap;
        const ST = (window as any).ScrollTrigger;

        // Kill every ScrollTrigger instance so they stop querying DOM nodes
        if (ST?.getAll) {
          ST.getAll().forEach((t: any) => t.kill());
        }

        // Stop the GSAP requestAnimationFrame ticker (the `yl` loop)
        gsapRef?.ticker?.sleep?.();
        gsapRef?.globalTimeline?.clear?.();
        gsapRef?.killTweensOf?.('*');
      } catch {
        // ignore – globals may not exist
      }

      // 2. Let the SDK tear down its own internals if it exposes a method
      try {
        (window as any).GbSdk?.destroy?.();
      } catch {
        // ignore
      }

      // 3. Now safe to remove DOM elements
      document
        .querySelectorAll(
          '[id*="gameball" i], [class*="gameball" i], [id*="gb-" i], [class*="gb-" i], [id*="gb_" i], [class*="gb_" i]',
        )
        .forEach((el) => el.remove());

      document
        .querySelectorAll('iframe[src*="gameball"]')
        .forEach((el) => el.remove());

      // 4. Remove all scripts the widget loaded (init, gsap, scrolltrigger, widget)
      document
        .querySelectorAll(
          'script[src*="gameball"], script[src*="gsap"], script[src*="ScrollTrigger"]',
        )
        .forEach((el) => el.remove());

      // 5. Clean up globals
      delete (window as any).GbSdk;
      delete (window as any).GbLoadInit;
      delete (window as any).gsap;
      delete (window as any).ScrollTrigger;
    };
  }, [userId]);

  return null;
}

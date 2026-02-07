'use client';
import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

const TurnstileWidget = ({ 
  onVerify, 
  theme = 'light',
  language = 'zh-CN'
}) => {
  const divRef = useRef(null);
  
  const renderWidget = useCallback(() => {
    if (divRef.current && window.turnstile) {
      window.turnstile.render(divRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: onVerify,
        theme,
        language,
      });
    }
  }, [theme, language, onVerify]);

  useEffect(() => {
    if (window.turnstile) {
      renderWidget();
    }
    
    const currentRef = divRef.current; 
    
    return () => {
      if (currentRef) {
        window.turnstile?.remove(currentRef);
      }
    };
  }, [renderWidget, theme, language, onVerify]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={renderWidget}
      />
      <div ref={divRef} />
    </>
  );
};

export default TurnstileWidget;
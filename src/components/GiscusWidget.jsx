// components/GiscusComments.js
'use client';
import { useEffect, useRef, useState } from 'react';

const GiscusComments = ({ 
  theme = 'light',
  lang = 'zh-CN',
  className = '',
  mapping = 'pathname',
  lazy = false
}) => {
  const containerRef = useRef(null);
  const scriptLoaded = useRef(false);
  const [currentTheme, setCurrentTheme] = useState(theme);

  // 监听系统主题变化
  useEffect(() => {
    if (theme === 'preferred_color_scheme') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e) => setCurrentTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const loadScript = () => {
    if (scriptLoaded.current || !containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    const attributes = {
      'data-repo': process.env.NEXT_PUBLIC_GISCUS_REPO || '0x6768/next-shop',
      'data-repo-id': process.env.NEXT_PUBLIC_GISCUS_REPO_ID || 'R_kgDORKw_5A',
      'data-category': process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'Announcements',
      'data-category-id': process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || 'DIC_kwDORKw_5M4C2CWg',
      'data-mapping': mapping,
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'bottom',
      'data-theme': currentTheme,
      'data-lang': lang,
      'data-loading': lazy ? 'lazy' : 'auto'
    };

    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    containerRef.current.innerHTML = ''; // 清空容器
    containerRef.current.appendChild(script);
    scriptLoaded.current = true;
  };

  // 监听主题变化
  useEffect(() => {
    if (scriptLoaded.current) {
      const iframe = containerRef.current?.querySelector('.giscus-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme: currentTheme } } },
          'https://giscus.app'
        );
      }
    }
  }, [currentTheme]);

  // 懒加载处理
  useEffect(() => {
    if (lazy) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !scriptLoaded.current) {
            loadScript();
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    } else if (!scriptLoaded.current) {
      loadScript();
    }
  }, [lazy]);

  // 清理
  useEffect(() => {
    return () => {
      if (containerRef.current && scriptLoaded.current) {
        const script = containerRef.current.querySelector('script[src*="giscus.app"]');
        if (script) {
          script.remove();
          scriptLoaded.current = false;
        }
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`giscus ${className}`}
      style={{ 
        minHeight: '200px',
        width: '100%'
      }}
    />
  );
};

export default GiscusComments;
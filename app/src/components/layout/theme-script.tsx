export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('portfolio-theme');
        var comfort = localStorage.getItem('portfolio-comfort');
        if (!theme) {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-comfort', comfort || 'off');
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

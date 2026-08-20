import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        <link rel="stylesheet" href="/login-brand.css" />
      </Head>
      <body>
        <Main />
        <script src="/login-bg-loader.js" defer />
        <script src="/session-guard.js" defer />
        <script src="/practice-tools.js" defer />
        <script src="/sales-profile.js" defer />
        <script src="/employee360.js" defer />
        <script src="/attention-dashboard.js" defer />
        <script src="/role-ui.js" defer />
        <script src="/role-label-fix.js" defer />
        <NextScript />
      </body>
    </Html>
  );
}

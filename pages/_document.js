import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ru">
      <Head />
      <body>
        <Main />
        <script src="/session-guard.js" defer />
        <script src="/practice-tools.js" defer />
        <NextScript />
      </body>
    </Html>
  );
}

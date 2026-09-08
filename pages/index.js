import Head from "next/head";
import Script from "next/script";

export default function Home() {
  return (
    <>
      <Head>
        <title>CRN GROUP · Дашборд обучения</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/login-brand.css?v=final10" />
      </Head>
      <div id="app"><div className="loading-note">Загрузка…</div></div>
      <Script src="/xlsx.full.min.js" strategy="beforeInteractive" />
      <Script src="/session-guard.js?v=3" strategy="beforeInteractive" />
      <Script src="/app.js?v=director-roster-3" strategy="afterInteractive" />
      <Script src="/i18n.js?v=2" strategy="afterInteractive" />
      <Script src="/login-bg-loader.js?v=final10" strategy="afterInteractive" />
      <Script src="/moderator-tools.js?v=owner2" strategy="afterInteractive" />
      <Script src="/fabric-intelligence.js?v=fabric9" strategy="afterInteractive" />
      <Script src="/materials-advanced.js?v=1" strategy="afterInteractive" />
      <Script src="/client-lab.js?v=2" strategy="afterInteractive" />
      <Script src="/client-lab-expansion.js?v=1" strategy="afterInteractive" />
    </>
  );
}
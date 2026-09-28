import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { ReactNode } from "react";

export default function Root({ children }: { children: ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Recycler</title>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <ScrollViewStyleReset />
        {headNodes}
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const css = `
html, body, #root { height: 100%; }
body { margin: 0; background: #cfc6b8; }
#root { display: flex; }
#root > div { flex: 1; display: flex; min-height: 100%; }
`;

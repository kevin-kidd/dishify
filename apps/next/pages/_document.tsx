import NextDocument, { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import { Children } from "react";
import { AppRegistry } from "react-native";

export default class Document extends NextDocument {
  static async getInitialProps(ctx: DocumentContext) {
    AppRegistry.registerComponent("Main", () => Main);
    // @ts-ignore
    const { getStyleElement } = AppRegistry.getApplication("Main");
    const styles = [getStyleElement()];

    const initialProps = await NextDocument.getInitialProps(ctx);
    return { ...initialProps, styles: Children.toArray(styles) };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

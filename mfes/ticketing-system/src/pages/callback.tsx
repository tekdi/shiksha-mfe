import React from "react";
import { TokenGeneratorDemo } from "@/components";

const CallbackPage: React.FC = () => {
  return (
    <>
      {/* <Head>
        <title>OAuth Callback - Token Generator</title>
        <meta
          name="description"
          content="OAuth callback page for token generation"
        />
      </Head> */}

      <TokenGeneratorDemo />
    </>
  );
};

export default CallbackPage;

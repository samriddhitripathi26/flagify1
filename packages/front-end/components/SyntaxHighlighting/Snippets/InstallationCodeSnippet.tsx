import { SDKLanguage } from "shared/types/sdk-connection";
import React, { useCallback, useMemo } from "react";
import { Box } from "@radix-ui/themes";
import Code from "@/components/SyntaxHighlighting/Code";
import { DocLink } from "@/components/DocLink";
import EventTrackerSelector from "@/components/SyntaxHighlighting/Snippets/EventTrackerSelector";

export default function InstallationCodeSnippet({
  language,
  apiKey,
  apiHost,
  encryptionKey,
  remoteEvalEnabled,
  eventTracker,
  setEventTracker,
}: {
  language: SDKLanguage;
  apiKey: string;
  apiHost: string;
  encryptionKey?: string;
  remoteEvalEnabled: boolean;
  eventTracker: string;
  setEventTracker: (value: string) => void;
}) {
  const nocodeSnippet =
    eventTracker && eventTracker === "GTM"
      ? `
<script>
(function(s) {
  s=document.createElement('script'); s.async=true;
  s.dataset.apiHost=${JSON.stringify(apiHost)};
  s.dataset.clientKey=${JSON.stringify(apiKey)};${
    encryptionKey
      ? `\n  s.dataset.decryptionKey=${JSON.stringify(encryptionKey)};`
      : ""
  }${remoteEvalEnabled ? `\n  s.dataset.remoteEval="true";` : ""}
  s.src="https://cdn.jsdelivr.net/npm/@flagify/flagify/dist/bundles/auto.min.js";
  document.head.appendChild(s);
})();
</script>      
      `.trim()
      : `
<script async
  data-api-host=${JSON.stringify(apiHost)}${eventTracker === "flagify" ? `\n  data-tracking="flagify"` : ""}
  data-client-key=${JSON.stringify(apiKey)}${
    encryptionKey
      ? `\n  data-decryption-key=${JSON.stringify(encryptionKey)}`
      : ""
  }${remoteEvalEnabled ? `\n  data-remote-eval="true"` : ""}
  src="https://cdn.jsdelivr.net/npm/@flagify/flagify/dist/bundles/auto.min.js"
></script>
            `.trim();

  const clientSideLanguages = useMemo(
    () => [
      "nocode-webflow",
      "nocode-wordpress",
      "nocode-shopify",
      "nocode-other",
    ],
    [],
  );

  const getInstallationCodeSnippet = useCallback(
    (language: SDKLanguage) => {
      if (eventTracker === "GTM" && clientSideLanguages.includes(language)) {
        return (
          <>
            Add the Flagify snippet to your Google Tag Manager as a Custom
            HTML tag.{" "}
            <DocLink docSection="gtmSetup">View Documentation</DocLink>
            <Code language="html" code={nocodeSnippet} />
          </>
        );
      }
      if (language === "nocode-shopify") {
        return (
          <>
            Add the Flagify snippet right before the closing{" "}
            <code>&lt;/head&gt;</code> tag in your theme&apos;s{" "}
            <code>theme.liquid</code> file.
            <Code language="html" code={nocodeSnippet} />
          </>
        );
      }
      if (language === "nocode-webflow") {
        return (
          <>
            Go into your site&apos;s settings, click on the &quot;Custom
            Code&quot; tab, and paste the following into the{" "}
            <strong>Head code</strong> section.
            <Code language="html" code={nocodeSnippet} />
          </>
        );
      }
      if (language === "nocode-wordpress") {
        return (
          <>
            Insert the following right before the closing{" "}
            <code>&lt;/head&gt;</code> tag in your site&apos;s HTML. We
            recommend using a plugin like WPCode to make this easier.
            <Code language="html" code={nocodeSnippet} />
          </>
        );
      }
      if (language === "nocode-other") {
        return (
          <>
            Insert the following right before the closing{" "}
            <code>&lt;/head&gt;</code> tag in your site&apos;s HTML.
            <Code language="html" code={nocodeSnippet} />
          </>
        );
      }
      if (language === "javascript") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/flagify
# OR
yarn add @flagify/flagify`.trim()}
          />
        );
      }
      if (language === "react") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/flagify-react
# OR
yarn add @flagify/flagify-react`.trim()}
          />
        );
      }
      if (language === "nodejs") {
        return (
          <Code
            language="bash"
            code={`npm install @flagify/flagify
# or
yarn add @flagify/flagify`}
          />
        );
      }
      if (language === "nextjs") {
        return (
          <Code
            language="bash"
            code={`npm install @flags-sdk/flagify
# or
yarn add @flags-sdk/flagify`}
          />
        );
      }
      if (language === "android") {
        return (
          <Code
            language="javascript"
            filename="build.gradle"
            code={`
repositories {
    mavenCentral()
}

dependencies {
    implementation 'io.flagify.sdk:Flagify:1.+'
}`.trim()}
          />
        );
      }
      if (language === "ios") {
        return (
          <>
            <div className="mb-3">
              Cocoapods
              <Code
                language="javascript"
                filename="Podfile"
                code={`
source 'https://github.com/CocoaPods/Specs.git'

target 'MyApp' do
  pod 'Flagify-IOS'
end
          `.trim()}
              />
              <Code language="sh" code={"pod install"} />
            </div>
            <div className="mb-3">
              Swift Package Manager (SPM)
              <Code
                language="swift"
                filename="Package.swift"
                code={`
dependencies: [
  .package(url: "https://github.com/flagify/flagify-swift.git")
]
            `.trim()}
              />
            </div>
          </>
        );
      }
      if (language === "go") {
        return (
          <Code
            language="sh"
            code="go get github.com/flagify/flagify-golang"
          />
        );
      }
      if (language === "ruby") {
        return <Code language="sh" code={`gem install flagify`} />;
      }
      if (language === "php") {
        return (
          <Code language="sh" code={`composer require flagify/flagify`} />
        );
      }
      if (language === "python") {
        return <Code language="sh" code={`pip install flagify`} />;
      }
      if (language === "java") {
        return (
          <>
            <div className="mb-3">
              Maven
              <Code
                language="xml"
                code={`
<repositories>
  <repository>
    <id>jitpack.io</id>
    <url>https://jitpack.io</url>
  </repository>
</repositories>

<dependency>
  <groupId>com.github.flagify</groupId>
  <artifactId>flagify-sdk-java</artifactId>
  <version>0.3.0</version>
</dependency>
`.trim()}
              />
            </div>
            <div className="mb-3">
              Gradle
              <Code
                language="javascript"
                filename="build.gradle"
                code={`
allprojects {
    repositories {
        maven { url 'https://jitpack.io' }
    }
}
dependencies {
    implementation 'com.github.flagify:flagify-sdk-java:0.3.0'
}`.trim()}
              />
            </div>
          </>
        );
      }
      if (language === "flutter") {
        return (
          <Code
            language="yml"
            filename="pubspec.yml"
            code="flagify_sdk_flutter: ^1.0.0"
          />
        );
      }
      if (language === "csharp") {
        return (
          <Code language="sh" code="dotnet add package flagify-c-sharp" />
        );
      }
      if (language === "elixir") {
        return (
          <Code
            language="elixir"
            filename="mix.exs"
            code={`
def deps do
  [
    {:flagify, "~> 0.2"}
  ]
end
    `.trim()}
          />
        );
      }
      if (language === "edge-cloudflare") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/edge-cloudflare
# OR
yarn add @flagify/edge-cloudflare`.trim()}
          />
        );
      }
      if (language === "edge-fastly") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/edge-fastly
# OR
yarn add @flagify/edge-fastly`.trim()}
          />
        );
      }
      if (language === "edge-lambda") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/edge-lambda
# OR
yarn add @flagify/edge-lambda`.trim()}
          />
        );
      }
      if (language === "edge-other") {
        return (
          <Code
            language="sh"
            code={`
npm i --save @flagify/edge-utils
# OR
yarn add @flagify/edge-utils`.trim()}
          />
        );
      }

      return <em>Depends on your platform</em>;
    },
    [clientSideLanguages, eventTracker, nocodeSnippet],
  );

  return (
    <>
      {clientSideLanguages.includes(language) && (
        <EventTrackerSelector
          eventTracker={eventTracker}
          setEventTracker={setEventTracker}
        />
      )}
      <Box>{getInstallationCodeSnippet(language)}</Box>
    </>
  );
}

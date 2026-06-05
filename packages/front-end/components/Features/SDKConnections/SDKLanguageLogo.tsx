import { SDKLanguage } from "shared/types/sdk-connection";
import { IconType } from "react-icons";
import { DiRuby, DiPython, DiReact, DiAndroid } from "react-icons/di";
import { FaHashtag, FaApple, FaJava, FaCode, FaRust } from "react-icons/fa";
import {
  SiAwslambda,
  SiCloudflare,
  SiFlutter,
  SiGo,
  SiJavascript,
  SiNodedotjs,
  SiPhp,
  SiShopify,
  SiWebflow,
  SiWordpress,
  SiElixir,
  SiFastly,
  SiNextdotjs,
  SiRoku,
} from "react-icons/si";
import React, { ReactElement } from "react";
import { isSDKOutdated } from "shared/sdk-versioning";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { BsFiletypeHtml } from "react-icons/bs";
import { TbCloudCode } from "react-icons/tb";
import { DocSection } from "@/components/DocLink";
import Tooltip from "@/components/Tooltip/Tooltip";

export type LanguageFilter =
  | "popular"
  | "all"
  | "browser"
  | "server"
  | "mobile"
  | "edge";
export type LanguageType =
  | "frontend"
  | "backend"
  | "mobile"
  | "edge"
  | "nocode"
  | "other";
export type LanguageLogo = {
  Icon: IconType;
  color: string;
  label: string;
  docLabel?: string;
  docs: DocSection;
  type: LanguageType;
  filters: LanguageFilter[];
  hideVersion?: boolean;
  extra?: ReactElement | string;
  packageName?: string;
  packageUrl?: string;
};
export const languageMapping: Record<SDKLanguage, LanguageLogo> = {
  "nocode-other": {
    Icon: BsFiletypeHtml,
    color: "#777",
    label: "Script Tag",
    docLabel: "HTML Script Tag",
    docs: "nocode",
    type: "nocode",
    filters: ["browser", "popular"],
    hideVersion: true,
  },
  javascript: {
    Icon: SiJavascript,
    color: "#f7df1e",
    label: "JavaScript",
    docs: "javascript",
    type: "frontend",
    filters: ["browser", "popular"],
    packageName: "@flagify/flagify",
    packageUrl: "https://www.npmjs.com/package/@flagify/flagify",
  },
  react: {
    Icon: DiReact,
    color: "#61DBFB",
    label: "React",
    docs: "tsx",
    type: "frontend",
    filters: ["browser", "mobile", "popular"],
    packageName: "@flagify/flagify-react",
    packageUrl: "https://www.npmjs.com/package/@flagify/flagify-react",
  },
  roku: {
    Icon: SiRoku,
    color: "#4F01A3",
    label: "Roku",
    docs: "roku",
    type: "frontend",
    filters: ["browser"],
    packageName: "flagify-roku",
    packageUrl: "https://www.npmjs.com/package/flagify-roku",
  },
  nodejs: {
    Icon: SiNodedotjs,
    color: "#339933",
    label: "Node.js",
    docs: "javascript",
    type: "backend",
    filters: ["server", "popular"],
    packageName: "@flagify/flagify",
    packageUrl: "https://www.npmjs.com/package/@flagify/flagify",
  },
  nextjs: {
    Icon: SiNextdotjs,
    color: "#000000",
    label: "Next.js",
    docs: "nextjs",
    type: "backend",
    filters: ["browser", "server", "popular"],
    packageName: "@flags-sdk/flagify",
    packageUrl: "https://www.npmjs.com/package/@flags-sdk/flagify",
  },
  php: {
    Icon: SiPhp,
    color: "#8993be",
    label: "PHP",
    docs: "php",
    type: "backend",
    filters: ["server", "popular"],
    packageName: "flagify/flagify",
    packageUrl: "https://packagist.org/packages/flagify/flagify",
  },
  ruby: {
    Icon: DiRuby,
    color: "#A91401",
    label: "Ruby",
    docs: "ruby",
    type: "backend",
    filters: ["server"],
    packageName: "flagify",
    packageUrl: "https://rubygems.org/gems/flagify",
  },
  python: {
    Icon: DiPython,
    color: "#306998",
    label: "Python",
    docs: "python",
    type: "backend",
    filters: ["server", "popular"],
    packageName: "flagify",
    packageUrl: "https://pypi.org/project/flagify/",
  },
  java: {
    Icon: FaJava,
    color: "#f89820",
    label: "Java",
    docs: "java",
    type: "backend",
    filters: ["server"],
    packageName: "flagify-sdk-java",
    packageUrl: "https://jitpack.io/#flagify/flagify-sdk-java",
  },
  csharp: {
    Icon: FaHashtag,
    color: "#684D95",
    label: "C Sharp",
    docs: "csharp",
    type: "backend",
    filters: ["server"],
    packageName: "flagify-c-sharp",
    packageUrl: "https://www.nuget.org/packages/flagify-c-sharp",
  },
  go: {
    Icon: SiGo,
    color: "#29BEB0",
    label: "Golang",
    docs: "go",
    type: "backend",
    filters: ["server"],
    packageName: "github.com/flagify/flagify-golang",
    packageUrl: "https://pkg.go.dev/github.com/flagify/flagify-golang",
  },
  rust: {
    Icon: FaRust,
    color: "#D34516",
    label: "Rust",
    docs: "rust",
    type: "backend",
    filters: ["server"],
    packageName: "flagify-rust",
    packageUrl: "https://crates.io/crates/flagify-rust",
  },
  elixir: {
    Icon: SiElixir,
    color: "#543364",
    label: "Elixir",
    docs: "elixir",
    type: "backend",
    filters: ["server"],
    packageName: "flagify",
    packageUrl: "https://www.hex.pm/packages/flagify",
  },
  ios: {
    Icon: FaApple,
    color: "#000000",
    label: "Swift",
    docs: "swift",
    type: "mobile",
    filters: ["mobile", "popular"],
    packageName: "flagify-swift",
    packageUrl: "https://swiftpackageindex.com/flagify/flagify-swift",
  },
  android: {
    Icon: DiAndroid,
    color: "#78C257",
    label: "Kotlin",
    docs: "kotlin",
    type: "mobile",
    filters: ["mobile", "popular"],
    packageName: "io.flagify.sdk:Flagify",
    packageUrl:
      "https://mvnrepository.com/artifact/io.flagify.sdk/Flagify",
  },
  flutter: {
    Icon: SiFlutter,
    color: "#02569B",
    label: "Flutter",
    docs: "flutter",
    type: "mobile",
    filters: ["mobile"],
    packageName: "flagify_sdk_flutter",
    packageUrl: "https://pub.dev/packages/flagify_sdk_flutter",
  },
  "edge-cloudflare": {
    Icon: SiCloudflare,
    color: "#f78220",
    label: "Cloudflare",
    docLabel: "Cloudflare Workers",
    docs: "cloudflare",
    type: "edge",
    filters: ["edge", "popular"],
    packageName: "@flagify/edge-cloudflare",
    packageUrl: "https://www.npmjs.com/package/@flagify/edge-cloudflare",
  },
  "edge-fastly": {
    Icon: SiFastly,
    color: "#ec1a0c",
    label: "Fastly",
    docLabel: "Fastly Compute",
    docs: "edge",
    type: "edge",
    filters: ["edge", "popular"],
    packageName: "@flagify/edge-fastly",
    packageUrl: "https://www.npmjs.com/package/@flagify/edge-fastly",
  },
  "edge-lambda": {
    Icon: SiAwslambda,
    color: "#e57714",
    label: "Lambda@Edge",
    docs: "lambda",
    type: "edge",
    filters: ["edge"],
    packageName: "@flagify/edge-lambda",
    packageUrl: "https://www.npmjs.com/package/@flagify/edge-lambda",
    extra: (
      <span
        className="badge badge-purple text-uppercase position-absolute"
        style={{ top: -16, right: -12 }}
      >
        Beta
      </span>
    ),
  },
  "edge-other": {
    Icon: TbCloudCode,
    color: "#777",
    label: "Other Edge",
    docs: "edge",
    type: "edge",
    filters: ["edge"],
    packageName: "@flagify/edge-utils",
    packageUrl: "https://www.npmjs.com/package/@flagify/edge-utils",
    extra: (
      <span
        className="badge badge-purple text-uppercase position-absolute"
        style={{ top: -16, right: -12 }}
      >
        Beta
      </span>
    ),
  },
  "nocode-shopify": {
    Icon: SiShopify,
    color: "#95BF47",
    label: "Shopify",
    docs: "shopify",
    type: "nocode",
    filters: ["browser"],
    hideVersion: true,
  },
  "nocode-wordpress": {
    Icon: SiWordpress,
    color: "#00749C",
    label: "Wordpress",
    docs: "wordpress",
    type: "nocode",
    filters: ["browser"],
    hideVersion: true,
  },
  "nocode-webflow": {
    Icon: SiWebflow,
    color: "#146EF5",
    label: "Webflow",
    docs: "webflow",
    type: "nocode",
    filters: ["browser", "popular"],
    hideVersion: true,
  },
  other: {
    Icon: FaCode,
    color: "#777",
    label: "Other",
    docs: "sdks",
    type: "other",
    filters: [],
    hideVersion: true,
  },
};

export default function SDKLanguageLogo({
  language,
  showLabel = false,
  size = 25,
  titlePrefix = "",
  version,
  hideExtra,
}: {
  language: SDKLanguage;
  showLabel?: boolean;
  size?: number;
  titlePrefix?: string;
  version?: string;
  hideExtra?: boolean;
}) {
  const { Icon, color, label, hideVersion, extra } =
    languageMapping[language] || languageMapping["other"];

  const versionOutdated = isSDKOutdated(language, version);

  let versionText: ReactElement | null = null;
  if (version !== undefined && !hideVersion) {
    versionText = (
      <span className="nowrap">
        <span className="text-info small ml-2">ver. {version || "0"}</span>
        {versionOutdated && (
          <Tooltip body="A new SDK version may be available">
            <HiOutlineExclamationCircle
              className="text-warning-orange position-relative"
              style={showLabel ? { top: -2, left: 2 } : { left: 4 }}
            />
          </Tooltip>
        )}
      </span>
    );
  }

  return (
    <span className="d-inline-flex align-items-center position-relative">
      <Icon
        style={{ color, height: size, fontSize: size, lineHeight: size }}
        className="m-0"
        title={titlePrefix + label}
      />
      <span className="ml-1">
        {showLabel && label}
        {versionText}
      </span>
      {!hideExtra ? extra : null}
    </span>
  );
}

export function getLanguagesByFilter(
  languageFilter: LanguageFilter = "all",
): SDKLanguage[] {
  return Object.entries(languageMapping)
    .filter(([_, language]) => {
      if (languageFilter === "all") return true;
      return language.filters.includes(languageFilter);
    })
    .map((o) => o[0]) as SDKLanguage[];
}

export function getConnectionLanguageFilter(
  languages: SDKLanguage[],
): LanguageFilter {
  const languageFilters = new Set<LanguageFilter>();
  languages.forEach((language) => {
    const type = languageMapping?.[language]?.type;
    if (type) {
      languageFilters.add(
        type
          // todo: only use filters (not types) to make this consistent
          .replace("frontend", "browser")
          .replace("nocode", "browser")
          .replace("backend", "server")
          .replace("other", "all") as LanguageFilter,
      );
    }
  });
  if (languageFilters.size === 0) {
    return "popular";
  }
  if (languageFilters.size === 1) {
    return [...languageFilters][0];
  }
  return "all";
}

export function getPackageRepositoryName(url: string): string {
  const repositoryMap: Record<string, string> = {
    "npmjs.com": "NPM",
    "pypi.org": "PyPI",
    "rubygems.org": "RubyGems",
    "packagist.org": "Packagist",
    "jitpack.io": "JitPack",
    "nuget.org": "NuGet",
    "pkg.go.dev": "Go Modules",
    "hex.pm": "Hex",
    "swiftpackageindex.com": "Swift Package Index",
    "mvnrepository.com": "Maven",
    "pub.dev": "pub.dev",
  };

  for (const [domain, name] of Object.entries(repositoryMap)) {
    if (url.includes(domain)) return name;
  }
  return "Package Repository";
}

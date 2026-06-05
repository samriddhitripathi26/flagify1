/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type {
  Experiment,
  Result,
  FeatureResult,
  JSONValue,
  FeatureDefinition,
  Context,
  WidenPrimitives,
} from "@flagify/flagify";
import { Flagify } from "@flagify/flagify";

export type FlagifyContextValue = {
  flagify: Flagify;
};
export interface WithRunExperimentProps {
  runExperiment: <T>(exp: Experiment<T>) => Result<T>;
}
/** @deprecated */
export type FlagifySSRData = {
  attributes: Record<string, any>;
  features: Record<string, FeatureDefinition>;
};

export const FlagifyContext = React.createContext<FlagifyContextValue>(
  {} as FlagifyContextValue,
);

/** @deprecated */
export async function getFlagifySSRData(
  context: Context,
): Promise<FlagifySSRData> {
  // Server-side Flagify instance
  const gb = new Flagify({
    ...context,
  });

  // Load feature flags from network if needed
  if (context.clientKey) {
    await gb.init();
  }

  const data: FlagifySSRData = {
    attributes: gb.getAttributes(),
    features: gb.getFeatures(),
  };
  gb.destroy();

  return data;
}

/** @deprecated */
export function useFlagifySSR(data: FlagifySSRData) {
  const gb = useFlagify();

  // Only do this once to avoid infinite loops
  const isFirst = React.useRef(true);
  if (gb && isFirst.current) {
    gb.setFeatures(data.features);
    gb.setAttributes(data.attributes);
    isFirst.current = false;
  }
}

export function useExperiment<T>(exp: Experiment<T>): Result<T> {
  const { flagify } = React.useContext(FlagifyContext);
  return flagify.run(exp);
}

export function useFeature<T extends JSONValue = any>(
  id: string,
): FeatureResult<T | null> {
  const flagify = useFlagify();
  return flagify.evalFeature<T>(id);
}

export function useFeatureIsOn<
  AppFeatures extends Record<string, any> = Record<string, any>,
>(id: string & keyof AppFeatures): boolean {
  const flagify = useFlagify<AppFeatures>();
  return flagify.isOn(id);
}

export function useFeatureValue<T extends JSONValue = any>(
  id: string,
  fallback: T,
): WidenPrimitives<T> {
  const flagify = useFlagify();
  return flagify.getFeatureValue(id, fallback);
}

export function useFlagify<
  AppFeatures extends Record<string, any> = Record<string, any>,
>(): Flagify<AppFeatures> {
  const { flagify } = React.useContext(FlagifyContext);

  if (!flagify) {
    throw new Error("Missing or invalid FlagifyProvider");
  }

  return flagify as Flagify<AppFeatures>;
}

export function FeaturesReady({
  children,
  timeout,
  fallback,
}: {
  children: React.ReactNode;
  timeout?: number;
  fallback?: React.ReactNode;
}): React.ReactElement {
  const gb = useFlagify();
  const [hitTimeout, setHitTimeout] = React.useState(false);
  const ready = gb ? gb.ready : false;
  React.useEffect(() => {
    if (timeout && !ready) {
      const timer = setTimeout(() => {
        gb &&
          gb.log("FeaturesReady timed out waiting for features to load", {
            timeout,
          });
        setHitTimeout(true);
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, ready, gb]);

  return <>{ready || hitTimeout ? children : fallback || null}</>;
}

export function IfFeatureEnabled({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}): React.ReactElement | null {
  return useFeature(feature).on ? <>{children}</> : null;
}

export function FeatureString(props: {
  default: string;
  feature: string;
}): React.ReactElement {
  const value = useFeature(props.feature).value;

  if (value !== null) {
    return <>{value}</>;
  }

  return <>{props.default}</>;
}

export const withRunExperiment = <P extends WithRunExperimentProps>(
  Component: React.ComponentType<P>,
): React.ComponentType<Omit<P, keyof WithRunExperimentProps>> => {
  const withRunExperimentWrapper = (props: any): React.ReactElement => (
    <FlagifyContext.Consumer>
      {({ flagify }): React.ReactElement => {
        return (
          <Component
            {...(props as P)}
            runExperiment={(exp) => flagify.run(exp)}
          />
        );
      }}
    </FlagifyContext.Consumer>
  );
  return withRunExperimentWrapper;
};
withRunExperiment.displayName = "WithRunExperiment";

export const FlagifyProvider: React.FC<
  React.PropsWithChildren<{
    flagify: Flagify;
  }>
> = ({ children, flagify }) => {
  // Tell flagify how to re-render our app (for dev mode integration)

  const [_, setRenderCount] = React.useState(0);
  React.useEffect(() => {
    if (!flagify || !flagify.setRenderer) return;

    flagify.setRenderer(() => {
      setRenderCount((v) => v + 1);
    });
    return () => {
      flagify.setRenderer(() => {
        // do nothing
      });
    };
  }, [flagify]);

  return (
    <FlagifyContext.Provider
      value={{
        flagify,
      }}
    >
      {children}
    </FlagifyContext.Provider>
  );
};

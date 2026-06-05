import { useRouter } from "next/router";
import { useFlagify } from "@flagify/flagify-react";
import { useEffect } from "react";
import { AppFeatures } from "@/types/app-features";

type UseFeatureDisabledRedirect = {
  ready: boolean;
  shouldRender: boolean;
};

/**
 * Check if an app feature is enabled and redirect if it isn't.
 * @param featureKey
 * @param redirectTo Path to redirect to
 */
export const useFeatureDisabledRedirect = (
  featureKey: keyof AppFeatures,
  redirectTo: string = "/",
): UseFeatureDisabledRedirect => {
  const router = useRouter();
  const flagify = useFlagify<AppFeatures>();

  const shouldRender = flagify?.isOn(featureKey) || false;
  const ready = flagify?.ready || false;

  useEffect(
    function redirectIfFeatureDisabled() {
      if (ready && !shouldRender) {
        router.replace(redirectTo);
      }
    },
    [ready, router, shouldRender, redirectTo],
  );

  return {
    ready,
    shouldRender,
  };
};

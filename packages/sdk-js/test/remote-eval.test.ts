import cloneDeep from "lodash/cloneDeep";
import {
  configureCache,
  Flagify,
  clearCache,
  setPolyfills,
  FeatureApiResponse,
  helpers,
} from "../src";
import { evaluateFeatures } from "./helpers/evaluateFeatures";

/* eslint-disable */
const { webcrypto } = require("node:crypto");
import { TextEncoder, TextDecoder } from "util";
import { ApiHost, ClientKey } from "../src/types/flagify";
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
const { MockEvent, EventSource } = require("mocksse");
require("jest-localstorage-mock");
/* eslint-enable */

setPolyfills({
  EventSource,
  localStorage,
  SubtleCrypto: webcrypto.subtle,
});
const localStorageCacheKey = "flagify:cache:features";
configureCache({
  staleTTL: 100,
  cacheKey: localStorageCacheKey,
});

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function mockApi(
  data: FeatureApiResponse | null,
  supportSSE: boolean = false,
  delay: number = 50,
) {
  // eslint-disable-next-line
  const f = jest.fn((url: string, resp: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: data ? 200 : 500,
          ok: !!data,
          headers: {
            get: (header: string) =>
              header === "x-sse-support" && supportSSE ? "enabled" : undefined,
          },
          url,
          json: () => {
            const body = JSON.parse(resp.body);
            const {
              attributes,
              forcedVariations,
              forcedFeatures: forcedFeaturesArray,
              url: evalUrl,
            } = body;
            return data
              ? Promise.resolve(
                  evaluateFeatures({
                    payload: cloneDeep(data),
                    attributes,
                    forcedVariations,
                    forcedFeatures: new Map(forcedFeaturesArray),
                    url: evalUrl,
                  }),
                )
              : Promise.reject("Fetch error");
          },
        });
      }, delay);
    });
  });

  setPolyfills({
    fetch: f,
  });

  return [
    f,
    () => {
      setPolyfills({ fetch: undefined });
    },
  ] as const;
}

async function seedLocalStorage(
  sse: boolean = false,
  apiHost: ApiHost = "https://fakeapi.sample.io",
  clientKey: ClientKey = "qwerty1234",
  attributeBlob = `{"ca":{"uid":"5"},"fv":{},"url":""}`,
  feature: string = "foo",
  value: string = "localstorage",
  staleAt: number = 50,
) {
  await clearCache();
  localStorage.setItem(
    localStorageCacheKey,
    JSON.stringify([
      [
        `${apiHost}||${clientKey}||${attributeBlob}`,
        {
          staleAt: new Date(Date.now() + staleAt),
          data: {
            features: {
              [feature]: {
                defaultValue: value,
              },
            },
          },
          sse,
        },
      ],
    ]),
  );
}

const sdkPayload = {
  features: {
    foo: {
      defaultValue: "initial",
      rules: [
        {
          condition: {
            uid: { $in: ["3", "5", "10"] },
          },
          force: "ruleEvaluated",
        },
      ],
    },
    bar: {
      defaultValue: "initial",
    },
    exp1: {
      defaultValue: {},
      rules: [
        {
          coverage: 1,
          seed: "exp1",
          hashAttribute: "uid",
          hashVersion: 2,
          variations: [{ v: "controlValue" }, { v: "variationValue" }],
          weights: [0.5, 0.5],
          key: "exp1",
          phase: "0",
        },
      ],
    },
  },
};

const sdkPayloadUpdated = {
  ...sdkPayload,
  features: {
    ...sdkPayload.features,
    bar: {
      defaultValue: "changedForSSE",
    },
  },
};

describe("remote-eval", () => {
  it("debounces network requests for same clientKey and cacheKeyAttributes", async () => {
    await clearCache();
    const [f, cleanup] = mockApi(sdkPayload);

    // a.1
    const flagify1 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
      attributes: { uid: "5" },
    });

    // a.2
    const flagify2 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
      attributes: { uid: "5" },
    });

    // b
    const flagify3 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
      attributes: { uid: "1" },
    });

    // c
    const flagify4 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "asdfjkl",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
      attributes: { uid: "5" },
    });

    // d
    const flagify5 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: [],
      attributes: { uid: "5" },
    });

    await Promise.all([
      flagify1.loadFeatures(),
      flagify2.loadFeatures(),
      flagify3.loadFeatures(),
      flagify4.loadFeatures(),
      flagify5.loadFeatures(),
    ]);

    expect(f.mock.calls.length).toEqual(4);

    flagify1.destroy();
    flagify2.destroy();
    flagify3.destroy();
    flagify4.destroy();
    flagify5.destroy();
    cleanup();
  });

  it("doesn't fire network requests before loadFeatures is called", async () => {
    await clearCache();
    const [f, cleanup] = mockApi(sdkPayload);

    const flagify = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
    });

    expect(f.mock.calls.length).toEqual(0);

    flagify.setAttributes({ uid: "5" });
    await sleep(10);
    expect(f.mock.calls.length).toEqual(0);

    flagify.setForcedFeatures(new Map([["bar", "something else"]]));
    await sleep(10);
    expect(f.mock.calls.length).toEqual(0);

    flagify.setForcedVariations({ exp1: 0 });
    await sleep(10);
    expect(f.mock.calls.length).toEqual(0);

    flagify.setURL("https://www.page.io/page2");
    await sleep(10);
    expect(f.mock.calls.length).toEqual(0);

    await flagify.loadFeatures();
    expect(f.mock.calls.length).toEqual(1);

    flagify.destroy();
    cleanup();
  });

  it("fires a network request when remote eval dependency changes and cache is stale", async () => {
    await clearCache();
    const [f, cleanup] = mockApi(sdkPayload);

    const flagify1 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
    });

    // 1
    await flagify1.loadFeatures();
    await sleep(200);

    // 2
    flagify1.setAttributes({ uid: "5" });
    await sleep(10);

    // non-dependency change should NOT trigger a network request
    flagify1.setAttributes({ uid: "5", something: "foo" });
    await sleep(200);

    // setForcedFeatures should NOT trigger an API call
    flagify1.setForcedFeatures(new Map([["bar", "something else"]]));
    await sleep(200);

    // 3
    flagify1.setForcedVariations({ exp1: 0 });
    await sleep(200);

    // 4
    flagify1.setURL("https://www.page.io/page2");
    await sleep(200);

    expect(f.mock.calls.length).toEqual(4);

    cleanup();
    flagify1.destroy();
    await clearCache();

    // Test that all attributes are dependencies when no cacheKeyAttributes are set
    const flagify2 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "blahblah",
      remoteEval: true,
    });

    // 1
    await flagify2.loadFeatures();
    await sleep(200);

    // 2
    flagify2.setAttributes({ uid: "5" });
    await sleep(200);

    expect(f.mock.calls.length).toEqual(4);

    cleanup();
    flagify2.destroy();
    await clearCache();
  });

  it("updates features when remote eval dependencies change", async () => {
    await clearCache();

    const [f, cleanup] = mockApi(sdkPayload);

    const flagify = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
    });

    await flagify.loadFeatures();

    expect(f.mock.calls.length).toEqual(1);

    expect(flagify.evalFeature("foo").value).toEqual("initial");
    expect(flagify.evalFeature("bar").value).toEqual("initial");
    await sleep(200);

    flagify.setAttributes({ uid: "5" });
    await sleep(200);
    expect(flagify.evalFeature("foo").value).toEqual("ruleEvaluated");
    expect(flagify.evalFeature("bar").value).toEqual("initial");

    await sleep(200);
    // does not trigger a network call
    flagify.setForcedFeatures(new Map([["bar", "something else"]]));
    expect(flagify.evalFeature("bar").value).toEqual("something else");

    await sleep(200);
    // initial variation (1)
    expect(flagify.evalFeature("exp1").value.v).toEqual("variationValue");

    // force variation 0
    flagify.setForcedVariations({ exp1: 0 });
    await sleep(200);
    expect(flagify.evalFeature("exp1").value.v).toEqual("controlValue");

    // force variation 1
    flagify.forceVariation("exp1", 1);
    await sleep(200);
    expect(flagify.evalFeature("exp1").value.v).toEqual("variationValue");

    flagify.destroy();
    cleanup();
    await clearCache();
  });

  it("triggers remote evaluation based on SSE", async () => {
    await clearCache();

    const [f, cleanup] = mockApi(sdkPayload, true);

    // Simulate SSE data
    const event = new MockEvent({
      url: "https://fakeapi.sample.io/sub/qwerty1234",
      setInterval: 50,
      responses: [
        {
          type: "features-updated",
          data: "{}", // mockSSE requires valid JSON string, but real event would be empty ("")
        },
      ],
    });

    const flagify1 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      subscribeToChanges: true,
      attributes: { uid: "5" },
    });
    // identical; should also receive SSE updates
    const flagify2 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      subscribeToChanges: true,
      attributes: { uid: "5" },
    });
    // should not receive SSE updates (subscribeToChanges: false)
    const flagify3 = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      attributes: { uid: "5" },
    });

    expect(flagify1.evalFeature("bar").value).toEqual(null);
    expect(flagify2.evalFeature("bar").value).toEqual(null);
    expect(flagify3.evalFeature("bar").value).toEqual(null);

    await Promise.all([
      flagify1.loadFeatures(),
      flagify2.loadFeatures(),
      flagify3.loadFeatures(),
    ]);
    expect(f.mock.calls.length).toEqual(1);

    // Initial value from API
    expect(flagify1.evalFeature("bar").value).toEqual("initial");
    expect(flagify2.evalFeature("bar").value).toEqual("initial");
    expect(flagify3.evalFeature("bar").value).toEqual("initial");

    // update the API server with new payload
    const [f2, cleanup2] = mockApi(sdkPayloadUpdated, true);

    // After SSE update received, instance with subscribeToChanges should have new value
    await sleep(150);
    expect(flagify1.evalFeature("bar").value).toEqual("changedForSSE");
    expect(flagify2.evalFeature("bar").value).toEqual("changedForSSE");
    expect(flagify3.evalFeature("bar").value).toEqual("initial");

    expect(f2.mock.calls.length).toEqual(1);

    // // Cache SSE value
    const lsValue = JSON.parse(
      localStorage.getItem(localStorageCacheKey) || "[]",
    );
    expect(lsValue.length).toEqual(1);
    expect(lsValue[0][0]).toEqual(
      `https://fakeapi.sample.io||qwerty1234||{"ca":{"uid":"5"},"fv":{},"url":""}`,
    );
    expect(lsValue[0][1].sse).toEqual(true);

    await clearCache();
    flagify1.destroy();
    flagify2.destroy();
    flagify3.destroy();
    cleanup();
    cleanup2();
    event.clear();
  });

  it("uses localStorage cache", async () => {
    await clearCache();
    await seedLocalStorage();

    const data = {
      features: {
        foo: {
          defaultValue: "api",
        },
      },
      dateUpdated: "2020-01-01T00:00:00Z",
    };
    const [f, cleanup] = mockApi(data);

    const flagify = new Flagify({
      apiHost: "https://fakeapi.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      subscribeToChanges: true,
      cacheKeyAttributes: ["uid"],
      attributes: { uid: "5" },
    });
    // Initial value of feature should be null
    expect(flagify.evalFeature("foo").value).toEqual(null);

    // Once features are loaded, value should be from localStorage
    await flagify.loadFeatures();

    // Setting an attribute should not trigger a network request if within the cache window
    flagify.setAttributes({ uid: "5" });

    await sleep(100);
    expect(flagify.evalFeature("foo").value).toEqual("localstorage");

    expect(f.mock.calls.length).toEqual(0);

    // Wait for localStorage entry to expire and refresh features
    await sleep(120);
    await flagify.refreshFeatures();
    expect(f.mock.calls.length).toEqual(1);
    expect(flagify.evalFeature("foo").value).toEqual("api");
    const staleAt = new Date(
      JSON.parse(
        localStorage.getItem(localStorageCacheKey) || "[]",
      )[0][1].staleAt,
    ).getTime();

    // Wait for localStorage entry to expire again
    // Since the payload didn't change, make sure it updates localStorage staleAt flag
    await sleep(120);
    await flagify.refreshFeatures();
    expect(f.mock.calls.length).toEqual(2);
    expect(flagify.evalFeature("foo").value).toEqual("api");
    const newStaleAt = new Date(
      JSON.parse(
        localStorage.getItem(localStorageCacheKey) || "[]",
      )[0][1].staleAt,
    ).getTime();
    expect(newStaleAt).toBeGreaterThan(staleAt);

    // If api has a new version, refreshFeatures should pick it up
    data.features.foo.defaultValue = "new";
    data.dateUpdated = "2020-02-01T00:00:00Z";
    await sleep(120);
    await flagify.refreshFeatures();
    expect(f.mock.calls.length).toEqual(3);
    expect(flagify.evalFeature("foo").value).toEqual("new");

    const lsValue = JSON.parse(
      localStorage.getItem(localStorageCacheKey) || "[]",
    );
    expect(lsValue.length).toEqual(1);
    expect(lsValue[0][0]).toEqual(
      `https://fakeapi.sample.io||qwerty1234||{"ca":{"uid":"5"},"fv":{},"url":""}`,
    );
    expect(lsValue[0][1].version).toEqual(data.dateUpdated);
    expect(lsValue[0][1].data.features).toEqual({
      foo: {
        defaultValue: "new",
      },
    });

    await clearCache();
    flagify.destroy();
    cleanup();
  });

  it("passes custom headers if supplied", async () => {
    await clearCache();

    const [f, cleanup] = mockApi(sdkPayload);

    const flagify1 = new Flagify({
      apiHost: "https://fakeapi1.sample.io",
      clientKey: "qwerty1234",
      apiHostRequestHeaders: { "x-custom-header": "foo" },
    });

    const flagify2 = new Flagify({
      apiHost: "https://fakeapi2.sample.io",
      clientKey: "qwerty1234",
      remoteEval: true,
      cacheKeyAttributes: ["uid"],
      apiHostRequestHeaders: { "x-custom-header": "bar" },
    });

    await Promise.all([flagify1.loadFeatures(), flagify2.loadFeatures()]);

    const call1 = f.mock.calls.find((c) =>
      c[0].match(/^https:\/\/fakeapi1\.sample\.io\.*/),
    );
    const call2 = f.mock.calls.find((c) =>
      c[0].match(/^https:\/\/fakeapi2\.sample\.io\.*/),
    );
    const headers1 = call1?.[1]?.headers || {};
    const headers2 = call2?.[1]?.headers || {};
    expect(headers1["x-custom-header"]).toEqual("foo");
    expect(headers2["x-custom-header"]).toEqual("bar");

    await clearCache();
    flagify1.destroy();
    flagify2.destroy();

    // Overwrite the fetchFeatures function. headers will not be sent if (accidentally?) excluded from helper method:

    const flagify3 = new Flagify({
      apiHost: "https://fakeapi3.sample.io",
      clientKey: "qwerty1234",
      apiHostRequestHeaders: { "x-custom-header": "foo" },
    });
    helpers.fetchFeaturesCall =
      // eslint-disable-next-line
      ({ host, clientKey, headers }) => {
        return (f as typeof globalThis.fetch)(
          `${host}/api/features/${clientKey}`,
          {
            headers: { "x-other-property": "bar" },
          },
        );
      };

    await flagify3.loadFeatures();

    const call3 = f.mock.calls.find((c) =>
      c[0].match(/^https:\/\/fakeapi3\.sample\.io\.*/),
    );
    const headers3 = call3?.[1]?.headers || {};
    expect(headers3["x-custom-header"]).toEqual(undefined);
    expect(headers3["x-other-property"]).toEqual("bar");

    await clearCache();
    flagify3.destroy();

    cleanup();
  });
});

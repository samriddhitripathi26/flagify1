import { Flagify } from "../src";
import {
  AutoExperiment,
  Options,
  Experiment,
  TrackingData,
} from "../src/types/flagify";

Object.defineProperty(window, "location", {
  value: {
    ...window.location,
  },
  writable: true,
});

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
const mockCallback = (options: Options) => {
  const onExperimentViewed = jest.fn((a) => {
    return a;
  });
  options.trackingCallback = onExperimentViewed;
  return onExperimentViewed.mock;
};

const mockAsyncCallback = (options: Options) => {
  const onExperimentViewed = jest.fn();
  options.trackingCallback = async (experiment, result) => {
    await sleep(500);
    onExperimentViewed(experiment, result);
  };
  return onExperimentViewed.mock;
};

describe("experiments", () => {
  beforeEach(() => {
    window.location.href = "";
  });

  it("tracking", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    const mock = mockCallback(options);

    const exp1: Experiment<number> = {
      key: "my-tracked-test",
      variations: [0, 1],
    };
    const exp2: Experiment<number> = {
      key: "my-other-tracked-test",
      variations: [0, 1],
    };

    const res1 = flagify.run(exp1);
    flagify.run(exp1);
    flagify.run(exp1);
    const res4 = flagify.run(exp2);
    options.user = { id: "2" };
    const res5 = flagify.run(exp2);

    expect(mock.calls.length).toEqual(3);
    expect(mock.calls[0]).toEqual([exp1, res1]);
    expect(mock.calls[1]).toEqual([exp2, res4]);
    expect(mock.calls[2]).toEqual([exp2, res5]);

    flagify.destroy();
  });

  it("async tracking", async () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    const mock = mockAsyncCallback(options);

    const exp1: Experiment<number> = {
      key: "my-tracked-test",
      variations: [0, 1],
    };
    const exp2: Experiment<number> = {
      key: "my-other-tracked-test",
      variations: [0, 1],
    };

    const res1 = flagify.run(exp1);
    flagify.run(exp1);
    flagify.run(exp1);
    const res4 = flagify.run(exp2);
    options.user = { id: "2" };
    const res5 = flagify.run(exp2);

    expect(mock.calls.length).toEqual(0);

    await sleep(1000);
    expect(mock.calls.length).toEqual(3);
    expect(mock.calls[0]).toEqual([exp1, res1]);
    expect(mock.calls[1]).toEqual([exp2, res4]);
    expect(mock.calls[2]).toEqual([exp2, res5]);

    flagify.destroy();
  });

  it("handles weird experiment values", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    const spy = jest.spyOn(console, "error").mockImplementation();

    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        include: () => {
          throw new Error("Blah");
        },
      }).inExperiment,
    ).toEqual(false);

    // Should fail gracefully
    options.trackingCallback = () => {
      throw new Error("Blah");
    };
    expect(
      flagify.run({ key: "my-test", variations: [0, 1] }).value,
    ).toEqual(1);

    flagify.subscribe(() => {
      throw new Error("Blah");
    });
    expect(
      flagify.run({ key: "my-new-test", variations: [0, 1] }).value,
    ).toEqual(0);

    spy.mockRestore();

    flagify.destroy();
  });

  it("logs debug message", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    flagify.run({
      key: "my-test",
      variations: [0, 1],
    });

    // Does not log normally
    expect(spy.mock.calls.length).toEqual(0);

    // Logs when in debug mode
    flagify.debug = true;
    flagify.run({
      key: "my-test2",
      variations: [0, 1],
    });
    // Should be
    // 1. In experiment
    expect(spy.mock.calls.length).toEqual(1);

    flagify.debug = false;
    spy.mockRestore();
    flagify.destroy();
  });

  it("uses window.location.href by default", () => {
    window.location.href = "http://example.com/path";
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        url: /^\/path/,
      }).inExperiment,
    ).toEqual(true);
    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        url: /^\/bath/,
      }).inExperiment,
    ).toEqual(false);

    flagify.destroy();
  });

  it("forces variation from overrides", () => {
    const flagify = new Flagify({
      attributes: {
        id: "6",
      },
      overrides: {
        "forced-test": {
          force: 1,
        },
      },
    });

    const res = flagify.run({
      key: "forced-test",
      variations: [0, 1],
    });

    expect(res.variationId).toEqual(1);
    expect(res.inExperiment).toEqual(true);
    expect(res.hashUsed).toEqual(false);

    flagify.destroy();
  });

  it("coverrage from overrides", () => {
    const flagify = new Flagify({
      attributes: {
        id: "1",
      },
      overrides: {
        "my-test": {
          coverage: 0.01,
        },
      },
    });

    const res = flagify.run({
      key: "my-test",
      variations: [0, 1],
    });

    expect(res.variationId).toEqual(0);
    expect(res.inExperiment).toEqual(false);

    flagify.destroy();
  });

  it("coverrage from overrides", () => {
    const flagify = new Flagify({
      attributes: {
        id: "1",
      },
      overrides: {
        "my-test": {
          coverage: 0.01,
        },
      },
    });

    const res = flagify.run({
      key: "my-test",
      variations: [0, 1],
    });

    expect(res.variationId).toEqual(0);
    expect(res.inExperiment).toEqual(false);

    flagify.destroy();
  });

  it("does not track when forced with overrides", () => {
    const options: Options = { user: { id: "6" } };
    const flagify = new Flagify(options);
    const exp: Experiment<number> = { key: "forced-test", variations: [0, 1] };

    const mock = mockCallback(options);
    options.overrides = {
      "forced-test": {
        force: 1,
      },
    };
    flagify.run(exp);
    expect(mock.calls.length).toEqual(0);

    flagify.destroy();
  });

  it("url from overrides", () => {
    const options: Options = {
      user: { id: "1" },
      overrides: {
        "my-test": {
          url: /^\/path/,
        },
      },
    };
    const flagify = new Flagify(options);
    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
      }).inExperiment,
    ).toEqual(false);

    flagify.destroy();
  });

  it("filters user groups", () => {
    const flagify = new Flagify({
      user: { id: "123" },
      groups: {
        alpha: true,
        beta: true,
        internal: false,
        qa: false,
      },
    });

    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        groups: ["internal", "qa"],
      }).inExperiment,
    ).toEqual(false);

    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        groups: ["internal", "qa", "beta"],
      }).inExperiment,
    ).toEqual(true);

    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
      }).inExperiment,
    ).toEqual(true);

    flagify.destroy();
  });

  it("sets attributes", () => {
    const attributes = {
      id: "1",
      browser: "firefox",
    };
    const flagify = new Flagify();

    flagify.setAttributes(attributes);

    expect(flagify.getAttributes()).toEqual(attributes);

    flagify.destroy();
  });

  it("runs custom include callback", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
        include: () => false,
      }).inExperiment,
    ).toEqual(false);

    flagify.destroy();
  });

  it("tracking skipped when options disabled", () => {
    const options: Options = { user: { id: "1" }, enabled: false };
    const flagify = new Flagify(options);
    const mock = mockCallback(options);

    flagify.run({ key: "disabled-test", variations: [0, 1] });

    expect(mock.calls.length).toEqual(0);

    flagify.destroy();
  });

  it("querystring force disabled tracking", () => {
    const options: Options = {
      user: { id: "1" },
      url: "http://example.com?forced-test-qs=1",
    };
    const flagify = new Flagify(options);
    const mock = mockCallback(options);
    const exp: Experiment<number> = {
      key: "forced-test-qs",
      variations: [0, 1],
    };
    flagify.run(exp);
    expect(mock.calls.length).toEqual(0);

    flagify.destroy();
  });

  it("url targeting", () => {
    const options: Options = {
      user: { id: "1" },
      url: "http://example.com",
    };
    const flagify = new Flagify(options);
    const exp: Experiment<number> = {
      key: "my-test",
      variations: [0, 1],
      url: /^\/post\/[0-9]+/,
    };

    expect(flagify.run(exp)).toMatchObject({
      inExperiment: false,
      value: 0,
    });

    options.url = "http://example.com/post/123";
    expect(flagify.run(exp)).toMatchObject({
      inExperiment: true,
      value: 1,
    });

    exp.url = /http:\/\/example.com\/post\/[0-9]+/;
    expect(flagify.run(exp)).toMatchObject({
      inExperiment: true,
      value: 1,
    });

    flagify.destroy();
  });

  it("invalid url regex", () => {
    const flagify = new Flagify({
      user: { id: "1" },
      overrides: {
        "my-test": {
          url: "???***[)",
        },
      },
      url: "http://example.com",
    });
    const spy = jest.spyOn(console, "error").mockImplementation();

    expect(
      flagify.run({
        key: "my-test",
        variations: [0, 1],
      }).value,
    ).toEqual(1);

    spy.mockRestore();

    flagify.destroy();
  });

  it("ignores draft experiments", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    const exp: Experiment<number> = {
      key: "my-test",
      status: "draft",
      variations: [0, 1],
    };

    const res1 = flagify.run(exp);
    options.url = "http://example.com/?my-test=1";
    const res2 = flagify.run(exp);

    expect(res1.inExperiment).toEqual(false);
    expect(res1.hashUsed).toEqual(false);
    expect(res1.value).toEqual(0);
    expect(res2.inExperiment).toEqual(true);
    expect(res2.hashUsed).toEqual(false);
    expect(res2.value).toEqual(1);

    flagify.destroy();
  });

  it("ignores stopped experiments unless forced", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    const expLose: Experiment<number> = {
      key: "my-test",
      status: "stopped",
      variations: [0, 1, 2],
    };
    const expWin: Experiment<number> = {
      key: "my-test",
      status: "stopped",
      variations: [0, 1, 2],
      force: 2,
    };

    const res1 = flagify.run(expLose);
    const res2 = flagify.run(expWin);

    expect(res1.value).toEqual(0);
    expect(res1.inExperiment).toEqual(false);
    expect(res1.hashUsed).toEqual(false);
    expect(res2.value).toEqual(2);
    expect(res2.inExperiment).toEqual(true);
    expect(res2.hashUsed).toEqual(false);

    flagify.destroy();
  });

  it("destroy removes subscriptions", () => {
    const options: Options = { user: { id: "1" } };
    const flagify = new Flagify(options);
    let fired = false;
    flagify.subscribe(() => {
      fired = true;
    });

    flagify.run({
      key: "my-test",
      variations: [0, 1],
    });
    expect(fired).toEqual(true);

    fired = false;
    flagify.destroy();

    flagify.run({
      key: "my-other-test",
      variations: [0, 1],
    });
    expect(fired).toEqual(false);

    flagify.destroy();
  });

  it("does even weighting", () => {
    const options: Options = {};
    const flagify = new Flagify(options);
    // Full coverage
    const exp: Experiment<number> = { key: "my-test", variations: [0, 1] };
    let variations: Record<string, number> = {
      "0": 0,
      "1": 0,
      "-1": 0,
    };
    for (let i = 0; i < 1000; i++) {
      options.user = { id: i + "" };
      const res = flagify.run(exp);
      const v = res.inExperiment ? res.value : -1;
      variations[v]++;
    }
    expect(variations["0"]).toEqual(503);

    // Reduced coverage
    exp.coverage = 0.4;
    variations = {
      "0": 0,
      "1": 0,
      "-1": 0,
    };
    for (let i = 0; i < 10000; i++) {
      options.user = { id: i + "" };
      const res = flagify.run(exp);
      const v = res.inExperiment ? res.value : -1;
      variations[v]++;
    }
    expect(variations["0"]).toEqual(2044);
    expect(variations["1"]).toEqual(1980);
    expect(variations["-1"]).toEqual(5976);

    // 3-way
    exp.coverage = 0.6;
    exp.variations = [0, 1, 2];
    variations = {
      "0": 0,
      "1": 0,
      "2": 0,
      "-1": 0,
    };
    for (let i = 0; i < 10000; i++) {
      options.user = { id: i + "" };
      const res = flagify.run(exp);
      const v = res.inExperiment ? res.value : -1;
      variations[v]++;
    }
    expect(variations).toEqual({
      "-1": 3913,
      "0": 2044,
      "1": 2000,
      "2": 2043,
    });

    flagify.destroy();
  });

  it("forces multiple variations at once", () => {
    const flagify = new Flagify({ attributes: { id: "1" } });
    const exp: Experiment<number> = {
      key: "my-test",
      variations: [0, 1],
    };
    const res1 = flagify.run(exp);
    expect(res1.inExperiment).toEqual(true);
    expect(res1.hashUsed).toEqual(true);
    expect(res1.value).toEqual(1);

    flagify.setForcedVariations({
      "my-test": 0,
    });

    const res2 = flagify.run(exp);
    expect(res2.inExperiment).toEqual(true);
    expect(res2.hashUsed).toEqual(false);
    expect(res2.value).toEqual(0);

    flagify.setForcedVariations({});
    const res3 = flagify.run(exp);
    expect(res3.inExperiment).toEqual(true);
    expect(res3.hashUsed).toEqual(true);
    expect(res3.value).toEqual(1);

    flagify.destroy();
  });

  it("forces all variations to -1 in qa mode", () => {
    const options: Options = { user: { id: "1" }, qaMode: true };
    const flagify = new Flagify(options);
    const exp: Experiment<number> = {
      key: "my-test",
      variations: [0, 1],
    };

    const res1 = flagify.run(exp);
    expect(res1.inExperiment).toEqual(false);
    expect(res1.hashUsed).toEqual(false);
    expect(res1.value).toEqual(0);

    // Still works if explicitly forced
    options.forcedVariations = { "my-test": 1 };
    const res2 = flagify.run(exp);
    expect(res2.inExperiment).toEqual(true);
    expect(res2.hashUsed).toEqual(false);
    expect(res2.value).toEqual(1);

    // Works if the experiment itself is forced
    const res3 = flagify.run({
      key: "my-test-2",
      variations: [0, 1],
      force: 1,
    });
    expect(res3.inExperiment).toEqual(true);
    expect(res3.hashUsed).toEqual(false);
    expect(res3.value).toEqual(1);

    flagify.destroy();
  });

  it("fires subscriptions correctly", () => {
    const flagify = new Flagify({
      user: {
        id: "1",
      },
    });

    let fired = false;
    const unsubscriber = flagify.subscribe(() => {
      fired = true;
    });
    expect(fired).toEqual(false);

    const exp: Experiment<number> = {
      key: "my-test",
      variations: [0, 1],
    };

    // Should fire when user is put in an experiment
    flagify.run(exp);
    expect(fired).toEqual(true);

    // Does not fire if nothing has changed
    fired = false;
    flagify.run(exp);
    expect(fired).toEqual(false);

    // Does not fire after unsubscribed
    unsubscriber();
    flagify.run({
      key: "other-test",
      variations: [0, 1],
    });
    expect(fired).toEqual(false);

    flagify.destroy();
  });

  it("stores assigned variations in the user", () => {
    const flagify = new Flagify({
      user: {
        id: "1",
      },
    });
    flagify.run({ key: "my-test", variations: [0, 1] });
    flagify.run({ key: "my-test-3", variations: [0, 1] });

    const assigned = flagify.getAllResults();
    const assignedArr: { e: string; v: number }[] = [];
    assigned.forEach((v, e) => {
      assignedArr.push({ e, v: v.result.variationId });
    });

    expect(assignedArr.length).toEqual(2);
    expect(assignedArr[0].e).toEqual("my-test");
    expect(assignedArr[0].v).toEqual(1);
    expect(assignedArr[1].e).toEqual("my-test-3");
    expect(assignedArr[1].v).toEqual(0);

    flagify.destroy();
  });

  it("renders when a variation is forced", () => {
    const options: Options = {
      user: { id: "1" },
    };
    const flagify = new Flagify(options);
    let called = false;
    flagify.setRenderer(() => {
      called = true;
    });

    expect(called).toEqual(false);
    flagify.forceVariation("my-test", 1);
    expect(options.forcedVariations).toEqual({ "my-test": 1 });
    expect(called).toEqual(true);

    flagify.destroy();
  });

  it("renders when attributes are updated", async () => {
    const options: Options = {
      user: { id: "1" },
    };
    const flagify = new Flagify(options);
    let called = false;
    flagify.setRenderer(() => {
      called = true;
    });

    expect(called).toEqual(false);
    flagify.setAttributes({ id: "2" });
    await sleep(1);
    expect(called).toEqual(true);

    flagify.destroy();
  });

  it("stores flagify instance in window when enableDevMode is true", () => {
    const options: Options = {
      enableDevMode: true,
    };
    const flagify = new Flagify(options);

    expect(window._flagify).toEqual(flagify);

    flagify.destroy();

    expect(window._flagify).toBeUndefined();
  });

  it("does not store flagify in window by default", () => {
    const options: Options = {};
    const flagify = new Flagify(options);

    expect(window._flagify).toBeUndefined();

    flagify.destroy();
  });

  it("does not have bias when using namespaces", () => {
    const options: Options = {
      user: {
        id: "1",
      },
    };
    const flagify = new Flagify(options);

    const variations: { [key: string]: number } = {
      "0": 0,
      "1": 0,
      "-1": 0,
    };
    for (let i = 0; i < 10000; i++) {
      options.user = { id: i + "" };
      const res = flagify.run({
        key: "my-test",
        variations: ["0", "1"],
        namespace: ["namespace", 0, 0.5],
      });
      const v = res.inExperiment ? res.value : "-1";
      variations[v]++;
    }

    expect(variations).toEqual({
      "-1": 4973,
      "0": 2538,
      "1": 2489,
    });

    flagify.destroy();
  });

  // TODO: test setEncryptedExperiments

  it("handles deferred tracking calls", () => {
    const trackingCallback = jest.fn();
    const gb = new Flagify({
      attributes: { id: "1" },
    });

    const exp: AutoExperiment<number> = {
      changeId: "123",
      key: "my-test",
      variations: [0, 1],
    };
    const result = gb.run(exp);

    expect(gb.getDeferredTrackingCalls()).toEqual([
      {
        experiment: exp,
        result,
      },
    ]);
    expect(gb.getCompletedChangeIds()).toEqual(["123"]);
    gb.setTrackingCallback(trackingCallback);
    expect(trackingCallback).toHaveBeenCalledTimes(1);
    expect(trackingCallback).toHaveBeenCalledWith(exp, result);

    // Does not call trackingCallback again for the same experiment
    gb.run(exp);
    expect(trackingCallback).toHaveBeenCalledTimes(1);

    gb.destroy();

    // Can set deferred tracking calls on an existing Flagify instance
    const trackingCallback2 = jest.fn();
    const gb2 = new Flagify({ trackingCallback: trackingCallback2 });
    gb2.setDeferredTrackingCalls([
      {
        invalid: true,
      } as unknown as TrackingData,
      {
        experiment: exp,
        result,
      },
    ]);
    expect(trackingCallback2).toHaveBeenCalledTimes(0);
    gb2.fireDeferredTrackingCalls();
    expect(trackingCallback2).toHaveBeenCalledTimes(1);
    expect(trackingCallback2).toHaveBeenCalledWith(exp, result);
    expect(gb2.getDeferredTrackingCalls()).toEqual([]);

    gb2.destroy();
  });

  it("handles deferred tracking calls when there is no trackingCallback", () => {
    const gb = new Flagify({
      attributes: { id: "1" },
    });
    const exp: AutoExperiment<number> = {
      key: "my-test",
      variations: [0, 1],
    };
    const result = gb.run(exp);
    gb.destroy();

    // Can set deferred tracking calls on an existing Flagify instance
    const trackingCallback = jest.fn();
    const gb2 = new Flagify();
    gb2.setDeferredTrackingCalls([
      {
        invalid: true,
      } as unknown as TrackingData,
      {
        experiment: exp,
        result,
      },
    ]);
    // This should do nothing because there's no trackingCallback yet
    gb2.fireDeferredTrackingCalls();

    gb2.setTrackingCallback(trackingCallback);
    expect(trackingCallback).toHaveBeenCalledTimes(1);
    expect(trackingCallback).toHaveBeenCalledWith(exp, result);
    expect(gb2.getDeferredTrackingCalls()).toEqual([]);

    gb2.destroy();
  });
});

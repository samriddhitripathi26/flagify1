import * as React from "react";
import { act } from "react-dom/test-utils";
import { cleanup, render } from "@testing-library/react";
import {
  Flagify,
  FlagifyProvider,
  useExperiment,
  withRunExperiment,
  WithRunExperimentProps,
  useFlagify,
  useFeatureIsOn,
  useFeatureValue,
  FeaturesReady,
} from "../src";

afterEach(cleanup);

const TestedComponent = () => {
  const { value } = useExperiment({
    key: "my-test",
    variations: [0, 1],
  });
  return <h1>{value}</h1>;
};

const TestedClassComponent = withRunExperiment(
  class TestedClassComponent extends React.Component<WithRunExperimentProps> {
    render() {
      const { value } = this.props.runExperiment({
        key: "my-test",
        variations: [0, 1],
      });
      return <h1>{value}</h1>;
    }
  },
);

describe("FlagifyProvider", () => {
  it("renders without crashing and doesn't add additional html", () => {
    const flagify = new Flagify({ user: { id: "1" } });

    const { container } = render(
      <FlagifyProvider flagify={flagify}>
        <h1>Hello World</h1>
      </FlagifyProvider>,
    );
    expect(container.innerHTML).toEqual("<h1>Hello World</h1>");
    flagify.destroy();
  });

  it("runs an experiment with the useExperiment hook", () => {
    const flagify = new Flagify({ user: { id: "1" } });

    const { container } = render(
      <FlagifyProvider flagify={flagify}>
        <TestedComponent />
      </FlagifyProvider>,
    );
    expect(container.innerHTML).toEqual("<h1>1</h1>");
    flagify.destroy();
  });

  it("works using the withRunExperiment HoC", () => {
    const flagify = new Flagify({ user: { id: "1" } });

    const { container } = render(
      <FlagifyProvider flagify={flagify}>
        <TestedClassComponent />
      </FlagifyProvider>,
    );
    expect(container.innerHTML).toEqual("<h1>1</h1>");
    flagify.destroy();
  });

  it("returns the control when there is no user", () => {
    const flagify = new Flagify({});

    const { container } = render(
      <FlagifyProvider flagify={flagify}>
        <TestedComponent />
      </FlagifyProvider>,
    );
    expect(container.innerHTML).toEqual("<h1>0</h1>");
    flagify.destroy();
  });

  describe("FeaturesReady", () => {
    it("renders immediately if ready", async () => {
      const flagify = new Flagify({
        features: {
          feature: {
            defaultValue: "actual value",
          },
        },
      });

      const Fallback = () => <div>loading fallback</div>;
      const FeatureComponent = () => {
        const val = useFeatureValue("feature", "inline fallback");
        return <div>{val}</div>;
      };

      const { container } = render(
        <FlagifyProvider flagify={flagify}>
          <FeaturesReady fallback={<Fallback />}>
            <FeatureComponent />
          </FeaturesReady>
        </FlagifyProvider>,
      );
      expect(container.innerHTML).toEqual("<div>actual value</div>");

      flagify.destroy();
    });

    it("re-renders when features set and no timeout", async () => {
      const flagify = new Flagify({});

      const Fallback = () => <div>loading fallback</div>;
      const FeatureComponent = () => {
        const val = useFeatureValue("feature", "inline fallback");
        return <div>{val}</div>;
      };

      const { container } = render(
        <FlagifyProvider flagify={flagify}>
          <FeaturesReady fallback={<Fallback />}>
            <FeatureComponent />
          </FeaturesReady>
        </FlagifyProvider>,
      );
      expect(container.innerHTML).toEqual("<div>loading fallback</div>");

      act(() => {
        flagify.setFeatures({
          feature: {
            defaultValue: "actual value",
          },
        });
      });
      expect(container.innerHTML).toEqual("<div>actual value</div>");

      flagify.destroy();
    });

    it("re-renders when timeout is hit", async () => {
      const flagify = new Flagify({});

      const Fallback = () => <div>loading fallback</div>;
      const FeatureComponent = () => {
        const val = useFeatureValue("feature", "inline fallback");
        return <div>{val}</div>;
      };

      const { container } = render(
        <FlagifyProvider flagify={flagify}>
          <FeaturesReady fallback={<Fallback />} timeout={100}>
            <FeatureComponent />
          </FeaturesReady>
        </FlagifyProvider>,
      );
      expect(container.innerHTML).toEqual("<div>loading fallback</div>");

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      expect(container.innerHTML).toEqual("<div>inline fallback</div>");

      act(() => {
        flagify.setFeatures({
          feature: {
            defaultValue: "actual value",
          },
        });
      });
      expect(container.innerHTML).toEqual("<div>actual value</div>");

      flagify.destroy();
    });
  });

  describe("with typed features", () => {
    type SampleAppFeatures = {
      foo: number;
      bar: boolean;
      baz: string;
    };

    const providedFlagify = new Flagify<SampleAppFeatures>({
      features: {
        foo: {
          defaultValue: 1337,
        },
        bar: {
          defaultValue: true,
        },
        baz: {
          defaultValue: "hello world",
        },
      },
      attributes: {
        id: "user-abc123",
      },
    });

    it("allows you to use a typed Flagify instance via typed useFlagify", () => {
      const ComponentThatCallsUseFlagifyWithTypes = () => {
        const flagify = useFlagify<SampleAppFeatures>();

        const fooValue = flagify?.getFeatureValue("foo", -1);
        const barValue = flagify?.getFeatureValue("bar", false);
        const bazValue = flagify?.getFeatureValue("baz", "??");

        return (
          <h1>
            foo = {fooValue}, bar = {String(barValue)}, baz = {bazValue}
          </h1>
        );
      };

      const { container } = render(
        <FlagifyProvider flagify={providedFlagify}>
          <ComponentThatCallsUseFlagifyWithTypes />
        </FlagifyProvider>,
      );

      expect(container.innerHTML).toEqual(
        "<h1>foo = 1337, bar = true, baz = hello world</h1>",
      );
    });

    it("allows you to use types when using the hook useFeatureIsOn", () => {
      const ComponentThatCallsUseFeatureIsOn = () => {
        const isOn = useFeatureIsOn<SampleAppFeatures>("bar");

        const text = isOn ? "Yes" : "No";

        return <h1>is on = {text}</h1>;
      };

      const { container } = render(
        <FlagifyProvider flagify={providedFlagify}>
          <ComponentThatCallsUseFeatureIsOn />
        </FlagifyProvider>,
      );

      expect(container.innerHTML).toEqual("<h1>is on = Yes</h1>");
    });

    describe("useFeatureIsOn untyped", () => {
      it("allows you to not use types when using the hook useFeatureIsOn", () => {
        const ComponentThatCallsUseFeatureIsOn = () => {
          const isOn = useFeatureIsOn("bar");

          const text = isOn ? "Yes" : "No";

          return <h1>is on = {text}</h1>;
        };

        const { container } = render(
          <FlagifyProvider flagify={providedFlagify}>
            <ComponentThatCallsUseFeatureIsOn />
          </FlagifyProvider>,
        );

        expect(container.innerHTML).toEqual("<h1>is on = Yes</h1>");
      });
    });

    describe("useFlagify untyped", () => {
      it("allows you to use an untyped Flagify instance", () => {
        const ComponentThatCallsUseFlagifyWithTypes = () => {
          const flagify = useFlagify();

          const fooValue = flagify?.getFeatureValue("foo", -1);
          const barValue = flagify?.getFeatureValue("bar", false);
          const bazValue = flagify?.getFeatureValue("baz", "??");

          return (
            <h1>
              foo = {fooValue}, bar = {String(barValue)}, baz = {bazValue}
            </h1>
          );
        };

        const { container } = render(
          <FlagifyProvider flagify={providedFlagify}>
            <ComponentThatCallsUseFlagifyWithTypes />
          </FlagifyProvider>,
        );

        expect(container.innerHTML).toEqual(
          "<h1>foo = 1337, bar = true, baz = hello world</h1>",
        );
      });
    });
  });
});

import { Context, Flagify } from "../src";

type TestAppFeatures = {
  dark_mode: boolean;
  sample_json: Record<string, unknown>;
  greeting: string;
};

describe("typed features", () => {
  const features = {
    dark_mode: {
      defaultValue: false,
      rules: [
        {
          condition: {
            id: "foo",
          },
          force: true,
          coverage: 0.5,
          hashAttribute: "id",
        },
      ],
    },
    sample_json: {
      defaultValue: {
        foo: "bar",
      },
    },
    greeting: {
      defaultValue: "Welcome to Acme Donuts!",
      rules: [
        {
          condition: {
            country: "france",
          },
          force: "Bienvenue au Beignets Acme !",
        },
        {
          condition: {
            country: "mexico",
          },
          force: "¡Bienvenidos y bienvenidas a Donas Acme!",
        },
      ],
    },
  };

  describe("getFeatureValue", () => {
    const context: Context = {
      features,
      attributes: {
        id: "user-abc123",
        country: "mexico",
      },
    };

    it("implements type-safe feature getting", () => {
      const flagify = new Flagify<TestAppFeatures>(context);

      const booleanResult = flagify.getFeatureValue("dark_mode", false);
      const jsonResult = flagify.getFeatureValue("sample_json", {});
      const stringResult = flagify.getFeatureValue("greeting", "??");

      expect(typeof booleanResult).toEqual("boolean");
      expect(booleanResult).toEqual(false);
      expect(typeof jsonResult).toEqual("object");
      expect(jsonResult).toEqual({ foo: "bar" });
      expect(typeof stringResult).toEqual("string");
      expect(stringResult).toEqual("¡Bienvenidos y bienvenidas a Donas Acme!");
      expect(flagify.isOn("greeting")).toEqual(true);
      expect(flagify.isOff("greeting")).toEqual(false);
    });

    it("implements feature getting without types", () => {
      const flagify = new Flagify(context);

      expect(flagify.getFeatureValue("greeting", "??")).toEqual(
        "¡Bienvenidos y bienvenidas a Donas Acme!",
      );
      expect(flagify.getFeatureValue<string>("greeting", "??")).toEqual(
        "¡Bienvenidos y bienvenidas a Donas Acme!",
      );
      expect(flagify.getFeatureValue("unknown_key", "??")).toEqual("??");
      expect(flagify.isOn("unknown_key")).toEqual(false);
      expect(flagify.isOff("unknown_key")).toEqual(true);
    });
  });

  describe("evalFeature", () => {
    const context: Context = {
      features,
      attributes: {
        id: "user-abc123",
        country: "france",
      },
    };

    it("evaluates a feature without using types", () => {
      const flagify = new Flagify(context);

      expect(flagify.evalFeature("greeting").value).toEqual(
        "Bienvenue au Beignets Acme !",
      );
      expect(flagify.evalFeature("unknown_key").value).toEqual(null);
    });

    it("evaluates a typed feature", () => {
      const flagify = new Flagify<TestAppFeatures>(context);

      const result = flagify.evalFeature("greeting");

      expect(result.on).toEqual(true);
      expect(result.value).toEqual("Bienvenue au Beignets Acme !");
    });
  });

  describe("feature (alias for evalFeature(key))", () => {
    const context: Context = {
      features,
      attributes: {
        id: "user-abc123",
        country: "france",
      },
    };

    it("evaluates a feature without using types", () => {
      const flagify = new Flagify(context);

      expect(flagify.feature("greeting").value).toEqual(
        "Bienvenue au Beignets Acme !",
      );
      expect(flagify.feature("unknown_key").value).toEqual(null);
    });

    it("evaluates a typed feature", () => {
      const flagify = new Flagify<TestAppFeatures>(context);

      const result = flagify.feature("greeting");

      expect(result.on).toEqual(true);
      expect(result.value).toEqual("Bienvenue au Beignets Acme !");
    });
  });
});

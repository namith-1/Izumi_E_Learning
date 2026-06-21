const { checkWeightSum } = require("../../controllers/courseController");

describe("Course Controller - Unit Tests", () => {
  describe("checkWeightSum helper", () => {
    test("should return null if modules is undefined", () => {
      expect(checkWeightSum(undefined)).toBeNull();
    });

    test("should return null if no graded modules exist", () => {
      const modules = {
        m1: { type: "text", title: "Intro", isGraded: false }
      };
      expect(checkWeightSum(modules)).toBeNull();
    });

    test("should return null if graded modules sum to exactly 100", () => {
      const modules = {
        m1: { type: "quiz", title: "Quiz 1", weight: 50 },
        m2: { type: "quiz", title: "Quiz 2", weight: 50 }
      };
      expect(checkWeightSum(modules)).toBeNull();
    });

    test("should return error message if graded modules sum to 90", () => {
      const modules = {
        m1: { type: "quiz", title: "Quiz 1", weight: 40 },
        m2: { type: "quiz", title: "Quiz 2", weight: 50 }
      };
      const result = checkWeightSum(modules);
      expect(result).toContain("sum to 90, not 100");
    });

    test("should handle Map input as well as Object", () => {
      const modules = new Map([
        ["m1", { type: "quiz", weight: 60 }],
        ["m2", { type: "quiz", weight: 40 }]
      ]);
      expect(checkWeightSum(modules)).toBeNull();
    });

    test("should ignore non-graded modules in sum", () => {
      const modules = {
        m1: { type: "quiz", weight: 100 },
        m2: { type: "text", weight: 50, isGraded: false }
      };
      expect(checkWeightSum(modules)).toBeNull();
    });
  });
});

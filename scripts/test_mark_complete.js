const studentCourseC = require("../controllers/studentCourseC");

function makeRes() {
  return {
    status(code) {
      this._status = code;
      return this;
    },
    json(obj) {
      console.log("RES JSON", this._status || 200, obj);
    },
    send(obj) {
      console.log("RES SEND", this._status || 200, obj);
    },
  };
}

(async () => {
  try {
    console.log("Test 1: demo moduleId=1 without session");
    await studentCourseC.markModuleComplete(
      { body: { moduleId: "1" }, session: {} },
      makeRes()
    );

    console.log("Test 2: invalid moduleId and no studentId");
    await studentCourseC.markModuleComplete(
      { body: { moduleId: "not_valid" }, session: {} },
      makeRes()
    );

    console.log("Test 3: valid ObjectId but no student session (should 401)");
    await studentCourseC.markModuleComplete(
      { body: { moduleId: "507f191e810c19729de860ea" }, session: {} },
      makeRes()
    );

    console.log("Test 4: valid ObjectId with fake student id");
    await studentCourseC.markModuleComplete(
      {
        body: {
          moduleId: "507f191e810c19729de860ea",
          studentId: "507f191e810c19729de860eb",
        },
        session: {},
      },
      makeRes()
    );
  } catch (err) {
    console.error("Test script error", err);
  }
})();

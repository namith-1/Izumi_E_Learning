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
    console.log("Direct Test 1: numeric moduleId=1 without session");
    await studentCourseC.markModuleComplete(
      { body: { moduleId: 1 }, session: {} },
      makeRes()
    );

    console.log('\nDirect Test 2: numeric string moduleId="1" without session');
    await studentCourseC.markModuleComplete(
      { body: { moduleId: "1" }, session: {} },
      makeRes()
    );

    console.log(
      "\nDirect Test 3: valid ObjectId string without studentId (should 401)"
    );
    await studentCourseC.markModuleComplete(
      { body: { moduleId: "507f191e810c19729de860ea" }, session: {} },
      makeRes()
    );

    console.log("\nDirect Test 4: valid ObjectId string with fake studentId");
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

    console.log("\nDone tests");
  } catch (err) {
    console.error("Handler test error", err);
  }
})();

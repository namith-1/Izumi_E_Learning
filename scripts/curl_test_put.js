const http = require("http");

function putJson(path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body })
      );
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log("Test 1: demo moduleId=1 (no studentId)");
    let r = await putJson(
      "/module_complete",
      JSON.stringify({ moduleId: "1" })
    );
    console.log(r);

    console.log(
      "\nTest 2: valid-looking ObjectId without student (expect 401)"
    );
    r = await putJson(
      "/module_complete",
      JSON.stringify({ moduleId: "507f191e810c19729de860ea" })
    );
    console.log(r);

    console.log("\nTest 3: valid-looking ObjectId with fake studentId");
    r = await putJson(
      "/module_complete",
      JSON.stringify({
        moduleId: "507f191e810c19729de860ea",
        studentId: "507f191e810c19729de860eb",
      })
    );
    console.log(r);
  } catch (err) {
    console.error("Request failed", err);
  }
})();

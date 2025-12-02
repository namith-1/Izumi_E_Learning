const path = require("path");
const fs = require("fs");

function sendClientIndex(req, res) {
  try {
    const clientIndex = path.join(
      __dirname,
      "..",
      "client",
      "build",
      "index.html"
    );
    if (fs.existsSync(clientIndex)) {
      return res.sendFile(clientIndex);
    }
  } catch (e) {
    // ignore and fallthrough to fallback response
  }

  // Fallback minimal HTML so routes don't break when no client build exists
  res
    .type("html")
    .send(
      '<!doctype html><html><head><meta charset="utf-8"><title>Izumi</title></head><body><h1>Izumi E-Learning</h1><p>Client not built. Visit the API endpoints directly.</p></body></html>'
    );
}

exports.home = sendClientIndex;
exports.login = sendClientIndex;
exports.signup = sendClientIndex;
exports.loginInstructor = sendClientIndex;
exports.signupInstructor = sendClientIndex;
exports.studentHome = sendClientIndex;

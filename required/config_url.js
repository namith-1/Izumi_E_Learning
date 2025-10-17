const ENV = window.location.hostname === "localhost" ? "development" : "production";

const CONFIG = {
  development: {
    BASE_URL: "http://localhost:4000",
  },
  production: {
    BASE_URL: "https://api.izumi-learning.com",
  },
};

const BASE_URL = CONFIG[ENV].BASE_URL;
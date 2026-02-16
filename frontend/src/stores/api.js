// frontend/src/stores/api.js
export const BASE_URL = "http://localhost:5000/api";

export const apiRequest = async (endpoint, method = "GET", body = null) => {
  const config = {
    method,
    headers: {},
    credentials: "include",
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const err = data || { message: "Something went wrong" };
    err.status = response.status;
    throw err;
  }

  return data;
};

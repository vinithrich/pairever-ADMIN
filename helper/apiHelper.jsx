let cancelController;

// Max time any request may stay in flight before it's aborted. Prevents a slow/hung
// backend from leaving the global loader spinning forever.
const REQUEST_TIMEOUT_MS = 45000;

// ---- Global request-loading signal ----------------------------------------
// Every API call funnels through makeRequest below, so we track how many are in
// flight and notify subscribers. A single <GlobalLoader/> (mounted in _app.js)
// shows an overlay whenever the count > 0 — so a slow response shows a loader
// everywhere instead of each page flashing its "no data found" empty state.
let inflightRequests = 0;
const loadingListeners = new Set();

const emitLoading = () => {
  loadingListeners.forEach((listener) => {
    try {
      listener(inflightRequests);
    } catch (e) {
      // never let a bad listener break a request
    }
  });
};

// Subscribe to in-flight request count. Calls back immediately with the current
// value and returns an unsubscribe function.
export const subscribeRequestLoading = (listener) => {
  loadingListeners.add(listener);
  listener(inflightRequests);
  return () => loadingListeners.delete(listener);
};

export const isRequestLoading = () => inflightRequests > 0;

const beginRequest = () => {
  inflightRequests += 1;
  emitLoading();
};

const endRequest = () => {
  inflightRequests = Math.max(0, inflightRequests - 1);
  emitLoading();
};

export const authUrl = (() => {
  // return "http://103.181.21.210:9500/api/v1/admin/auth";
  // return "http://192.168.1.77:5000/api/v1/admin/auth";
  return "https://api.pair-ever.com/api/v1/admin/auth"



  switch (process.env.NODE_ENV) {
    case "development":
    case "devel":
      // return "https://api.pair-ever.com/api/v1/admin/auth";
      return "http://localhost:7000/api/v1/admin/auth";


    default:
      // return "https://api.pair-ever.com/api/v1/admin/auth";
      return "http://localhost:7000/api/v1/admin/auth";
  }
})();

export const adminUrl = authUrl.replace(/\/auth$/, "");

export const getRequest = async (endpoint, isCancel = false) => {
  return makeRequest(`${authUrl}/${endpoint}`, "GET", undefined, isCancel);
};

export const putRequest = async (endpoint, body, isCancel = false) => {
  return makeRequest(`${authUrl}/${endpoint}`, "PUT", body, isCancel);
};

export const postRequest = async (
  endpoint,
  body,
  isFormData = false,
  isCancel = false
) => {
  return makeRequest(
    `${authUrl}/${endpoint}`,
    "POST",
    body,
    isCancel,
    isFormData
  );
};

export const postAdminRequest = async (
  endpoint,
  body,
  isFormData = false,
  isCancel = false
) => {
  return makeRequest(
    `${adminUrl}/${endpoint}`,
    "POST",
    body,
    isCancel,
    isFormData
  );
};

export const deleteRequest = async (endpoint, body, isCancel = false) => {
  return makeRequest(`${authUrl}/${endpoint}`, "DELETE", body, isCancel);
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const storedToken = localStorage.getItem("kudavasalToken");

    if (storedToken) {
      return storedToken;
    }

    const savedAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");

    return savedAuth?.token || savedAuth?.raw?.token || savedAuth?.raw?.data?.token || "";
  } catch (error) {
    return "";
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const makeRequest = async (
  endpoint,
  method,
  data,
  isCancel = false,
  isFormData = false
) => {
  const headers = {
    ...getAuthHeaders(),
  };

  if (typeof window !== "undefined") {
    let selectedApp = localStorage.getItem("selectedAdminApp") || "0";
    if (selectedApp === "pairever") selectedApp = "0";
    else if (selectedApp === "flamez") selectedApp = "1";
    else if (selectedApp === "bonding") selectedApp = "2";
    else if (selectedApp === "heylove" || selectedApp === "hey love") selectedApp = "3";
    else if (selectedApp === "doly") selectedApp = "4";
    else if (selectedApp === "bestie" || selectedApp === "best") selectedApp = "5";
    headers["X-App-Name"] = selectedApp;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Hard timeout so a slow/hung backend can never leave a request in flight forever
  // (which would keep the global loader spinning and the page stuck on "loading").
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const options = {
    method: method,
    headers: headers,
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    signal: controller.signal,
  };

  beginRequest();
  try {
    const response = await fetch(endpoint, options);
    return await handleResponse(response);
  } catch (error) {
    await handleErrors(error);
  } finally {
    clearTimeout(timeoutId);
    endRequest();
  }
};

// Single exit path for an expired/invalid session.
//
// Three things went wrong before and each one caused the reload loop:
//   1. Only "kudavasalToken" was cleared. AuthContext keeps the session under
//      "adminAuth", and getAuthToken() falls back to it — so after redirecting to "/"
//      the app still looked logged in, _app.js bounced it straight back into the
//      dashboard, that page called the API with the same dead token, and round it went.
//   2. No guard for already being on "/", so the login page could redirect to itself.
//   3. A dashboard fires many requests at once and EVERY 401 triggered its own
//      navigation, stacking several reloads.
//
// Storage is cleared BEFORE navigating: the old code called replace() first and the
// clear after, which the navigation could cut short.
let loggingOut = false;

// Pages reachable without a session. A 401 on one of these is a failed login
// attempt, not an expired session — verifyAdminOtp answers 401 for a wrong OTP too,
// so redirecting or reloading here would wipe the form the user is filling in and
// hide the "Invalid or expired OTP" message they need to see.
const PUBLIC_PATHS = ["/", "/404", "/privacy-policy"];

export const forceLogout = () => {
  if (typeof window === "undefined" || loggingOut) return;

  if (PUBLIC_PATHS.includes(window.location.pathname)) return;

  // Set only once we are certain we are leaving, so a wrong OTP on the login page
  // cannot latch this flag and disarm the real logout later in the session.
  loggingOut = true;

  try {
    // The same keys AuthContext.logout() removes, so a forced logout leaves exactly
    // the state a manual one does.
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("kudavasalToken");
    localStorage.removeItem("email");
    localStorage.removeItem("selectedAdminApp");
  } catch (e) {
    // storage can throw in private mode; the redirect below still has to happen
  }

  window.location.replace("/");
};

const ErrorReload = (res) => {
  if (res !== undefined) {
    forceLogout();
  }
};

const handleErrors = (error) => {
  if (error.name === "AbortError") {
    return; // Request was canceled, no need to handle error
  }

  if (error !== undefined) {
    if (
      error.message === "jwt expired" ||
      error.message === "Please authenticate" ||
      error.message === "jwt must be provided"
    ) {
      ErrorReload(error);
    } else if (error.status === 500) {
      // Handle other error cases accordingly
    } else if (error.status === 400) {
      // Handle other error cases accordingly
    } else if (error.status === 401) {
      // Handle other error cases accordingly
    } else if (error.status === 429) {
      // Handle other error cases accordingly
    } else {
      // Handle other error cases accordingly
    }
  }
};

export const handleResponse = async (response) => {
  // Handle successful response with data
  if (response && response.ok) {
    const responseData = await response.json();
    return responseData;
  }
  // Handle unauthorized access (401) or no token provided
  else if (
    response.status === 401 ||
    (response.message &&
      response.message === "Access Denied. No token provided.")
  ) {
    forceLogout();
    throw new Error("Unauthorized");
  }
  // Handle server errors (500) including token expiration
  else if (response.status === 500) {
    let message;
    try {
      const data = await response.json();
      message = data.message;
    } catch (e) {
      message = null;
    }

    if (message === "jwt expired" || message === "Please authenticate") {
      forceLogout();
      throw new Error("Session expired");
    }
    // Throw generic error for other 500 responses
    throw new Error("Internal Server Error");
  }
  // Handle any other unexpected responses
  else {
    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    return {
      ...(data || {}),
      status: false,
      httpStatus: response.status,
      message: data?.message || `Unexpected response status: ${response.status}`,
    };
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);

  const padZero = (num) => (num < 10 ? `0${num}` : num);

  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = padZero(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = `${hours}:${minutes} ${ampm}`;
  return `${day}/${month}/${year} ${strTime}`;
};

export default {
  getRequest,
  putRequest,
  postRequest,
  postAdminRequest,
  deleteRequest,
  getAuthHeaders,
  getAuthToken,
  formatDate,
};




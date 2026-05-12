let cancelController;

export const authUrl = (() => {
  switch (process.env.NODE_ENV) {
    case "development":
    case "devel":
      return "https://api.pair-ever.com/api/v1/admin/auth";
            // return "http://localhost:7000/api/v1/admin/auth";


  
    default:
      return "https://api.pair-ever.com/api/v1/admin/auth";
            // return "http://localhost:7000/api/v1/admin/auth";

   
  }
})();

export const adminUrl = authUrl.replace(/\/auth$/, "");

export const getRequest = async (endpoint, isCancel = false) => {
  return makeRequest(`${authUrl}/${endpoint}`, "GET", isCancel);
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

const makeRequest = async (
  endpoint,
  method,
  data,
  isCancel = false,
  isFormData = false
) => {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const options = {
    method: method,
    headers: headers,
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
  };

  try {
    const response = await fetch(endpoint, options);
    return await handleResponse(response);
  } catch (error) {
    await handleErrors(error);
  }
};

const ErrorReload = (res) => {
  if (res !== undefined && window.location.pathname !== "/") {
    window.location.replace("/");
    localStorage.clear();
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
    localStorage.removeItem("kudavasalToken"); // Clear token
    window.location.href = "/"; // Redirect to login
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
      localStorage.removeItem("kudavasalToken"); // Clear token
      window.location.href = "/"; // Redirect to login
      throw new Error("Session expired");
    }
    // Throw generic error for other 500 responses
    throw new Error("Internal Server Error");
  }
  // Handle any other unexpected responses
  else {
    throw new Error(`Unexpected response status: ${response.status}`);
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
  formatDate,
};

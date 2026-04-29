import { createSlice } from "@reduxjs/toolkit";
import * as apiHelper from "../../apiHelper";
const initialState = {
  // RegistrationSuccess: [],
  // CountryList: [],
};
const slice = createSlice({
  name: "homepage",
  initialState: initialState,

  reducers: {
    LoginForm: (state, action) => {
      state.Loginsuccess = action.payload;
    },
  },
});
export default slice.reducer;
const { LoginForm } = slice.actions;

// export const GetDashBoardApi =
//   (callback = () => { }) =>
//     async (dispatch) => {
//       try {
//         const response = await apiHelper.getRequest("admin/getDashCount");
//         callback(response);
//         dispatch(GetDashBoard(response));
//       } catch (e) {
//       }
//     };
// export const GetAllUsersApi =
//   (callback = () => { }) =>
//     async (dispatch) => {
//       try {
//         const response = await apiHelper.getRequest("admin/getusers");
//         callback(response);
//         dispatch(GetAllUsers(response));
//       } catch (e) {
//       }
//     };

// export const GetSingleUsersApi =
//   (userid, callback = () => { }) =>
//     async (dispatch) => {
//       try {
//         const response = await apiHelper.getRequest(`/admin/getuser/${userid}`);
//         callback(response);
//         dispatch(GetSingleUsers(response));
//       } catch (e) {
//       }
//     };

// export const ApproveRejectApi =
//   (data, callback = () => { }) =>
//     async (dispatch) => {
//       try {
//         const response = await apiHelper.postRequest("admin/eventstatus", data);
//         callback(response);
//         dispatch(ApproveReject(response));
//         if (response) {
//         }
//       } catch (e) {
//       }
//     };
// export const UpdateEventsApi =
//   (data, callback = () => { }) =>
//     async (dispatch) => {
//       try {
//         const response = await apiHelper.postRequest("admin/updateEvent", data,true);
//         callback(response);
//         dispatch(UpdateEvents(response));
//         if (response) {
//         }
//       } catch (e) {
//       }
//     };
//     export const DeleteEventsApi =
//       (data, callback = () => {}) =>
//       async (dispatch) => {
//         try {
//           const response = await apiHelper.postRequest(
//             "admin/deleteEvents",
//             data
//           );
//           callback(response);
//           dispatch(DeleteEvents(response));
//           if (response) {
//           }
//         } catch (e) {}
//       };
//

// =================================================================

export const UserloginApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("login", data);
        callback(response);
        dispatch(LoginForm(response));
        if (response) {
          return response;
        } else {
          return false;
        }
      } catch (e) { }
    };

export const GetDashBoardDetailsApi =
  (callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.getRequest("getDashboardCounts");
        callback(response);
      } catch (e) { }
    };

export const CreateCategoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("gstCreateCategory", data);
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const GetAllCategoriesApi =
  (callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.getRequest("gstGetAllCategories");
        callback(response);
      } catch (e) { }
    };

export const GetSingleCategoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest(
          "getGstSingleCategory",
          data
        );
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const UpdateCategoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest(
          "gstUpdateUnionCategory",
          data
        );
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const DeleteCategoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("gstDeleteCategory", data);
        callback(response);
        if (response) {
        }
      } catch (e) { }
    };

export const CreatePanjayatApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("gstCreatePanjayat", data);
        callback(response);
        return response;
      } catch (e) {
        // Ensure callback runs even on error
        callback({ status: false, message: e?.message || "Request failed" });
        return null;
      }
    };

export const GetAllPanjayatApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `gstGetAllPanjayat?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };

export const GetSinglePanjayatApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest(
          "getGstSinglePanjayat",
          data
        );
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const UpdatePanjayatApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("gstUpdatePanjayat", data);
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const DeletePanjayatApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("gstDeletePanjayat", data);
        callback(response);
        if (response) {
        }
      } catch (e) { }
    };

export const GenerateInvoiceApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest("addinvoice", data);
        callback(response);
        return response;
      } catch (e) {
        // Ensure callback runs even on error
        callback({ status: false, message: e?.message || "Request failed" });
        return null;
      }
    };

export const NewGenerateInvoiceApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        // 🔹 Use fetch here instead of apiHelper since we need blob
        const response = await fetch(
          "https://api.vptds.com/api/v1/gstAdmin/generateInvoice",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate invoice");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // 👉 Trigger download/open
        callback({
          status: true,
          fileUrl: url,
          blob,
        });

        return { status: true, fileUrl: url, blob };
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetAllPanjayatInvoiceApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.getRequest(
          `getAllPanjayatInvoice?gst=${data}`
        );
        callback(response);
      } catch (e) { }
    };

export const GetAllInvoiceApi =
  (callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.getRequest("getinvoice");
        callback(response);
      } catch (e) { }
    };










/////////////////////   bonding api





export const UploadAcknoledgementApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        const response = await apiHelper.postRequest(
          "generateAcknoledgeUpload",
          data,
          true
        );
        callback(response);
        if (response) {
          return response;
        }
      } catch (e) { }
    };

export const GetUserListApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `getUserList?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };


export const GetSingleUserApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        console.log("GetSingleUserApi payload:", data);

        const response = await apiHelper.postRequest(
          "getUsersingleList",
          { userId: data }   // 👈 send as object (recommended)
        );

        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const DeleteUserApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await fetch(`${apiHelper.authUrl}/deleteUser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json().catch(() => null);
        const fallbackMessage =
          response.status === 400
            ? "userId is required"
            : response.status === 404
              ? "User record not found"
              : "Failed to delete user";

        const result = responseData || {
          status: response.ok,
          message: fallbackMessage,
        };

        callback(result);
        return result;
      } catch (e) {
        const result = {
          status: false,
          message: e?.message || "Request failed",
        };
        callback(result);
        return null;
      }
    };

export const GetStaffListApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `getStaffList?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };

export const GetSingleStaffApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        console.log("GetSingleUserApi payload:", data);

        const response = await apiHelper.postRequest(
          "getStaffsingleList",
          { userId: data }   // 👈 send as object (recommended)
        );

        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };


export const UpdateStaffApprovalApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest(
          "updateStaffApproval",
          data
        );
        callback(response);
        return response;
      } catch (e) {
        callback({ status: false, message: e.message });
        return null;
      }
    };

export const UpdateStaffApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest(
          "updateStaff",
          data,
          data instanceof FormData
        );
        callback(response);
        return response;
      } catch (e) {
        callback({ status: false, message: e.message });
        return null;
      }
    };

export const DeleteStaffApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await fetch(`${apiHelper.authUrl}/deleteStaff`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json().catch(() => null);
        const fallbackMessage =
          response.status === 400
            ? "staffId is required"
            : response.status === 404
              ? "Staff record not found"
              : "Failed to delete staff";

        const result = responseData || {
          status: response.ok,
          message: fallbackMessage,
        };

        callback(result);
        return result;
      } catch (e) {
        const result = {
          status: false,
          message: e?.message || "Request failed",
        };
        callback(result);
        return null;
      }
    };

export const GetdepositHistoryApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `getdeposithistory?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };


export const getDepositHistoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        console.log("GetSingleUserApi payload:", data);

        const response = await apiHelper.postRequest(
          "getDepositHistory",
          { userId: data }   // 👈 send as object (recommended)
        );

        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetWithdrawhistoryApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `getWithdrawhistory?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };

export const GetStaffWithdrawHistoryApi =
  (staffId, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams({ staffId }).toString();
        const response = await apiHelper.getRequest(
          `getStaffWithdrawHistory?${queryString}`
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const getSingleWithdrawhistoryApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        console.log("GetSingleUserApi payload:", data);

        const response = await apiHelper.postRequest(
          "getSingleWithdrawhistory",
          { userId: data }   // 👈 send as object (recommended)
        );

        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const updateWithdrawStatusApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest(
          "updateWithdrawStatus",
          data
        );
        callback(response);
        return response;
      } catch (e) {
        callback({ status: false, message: e.message });
        return null;
      }
    };


export const getPaymentStructureApi =
  (params = {}, callback = () => { }) =>
    async (dispatch) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `getPaymentStructure?${queryString}`
        );
        callback(response);
      } catch (e) { }
    };

    export const updatePaymentStructureApi =
  (data, callback = () => { }) =>
    async () => {
      console.log("data",data)
      try {
        const response = await apiHelper.postRequest(
          "updatePaymentStructure",
          data,
          true 
        );
        callback(response);
        return response;
      } catch (e) {
        callback({ status: false, message: e.message });
        return null;
      }
    };


export const getSinglePaymentStructureApi =
  (data, callback = () => { }) =>
    async (dispatch) => {
      try {
        console.log("GetSingleUserApi payload:", data);

        const response = await apiHelper.postRequest(
          "getSinglePaymentStructure",
          { userId: data }   // 👈 send as object (recommended)
        );

        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetAdBannerApi =
  (callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.getRequest("getAdBanner");
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const UpdateAdBannerApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest(
          "updateAdBanner",
          data,
          data instanceof FormData
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetAppVersionApi =
  (callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.getRequest("getAppVersion");
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const UpdateAppVersionApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest("updateAppVersion", data);
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const SendAdminPushApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postAdminRequest("push/send", data);
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const SendStaffWarningPushApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postAdminRequest("push/send", data);
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetSupportTicketDashboardApi =
  (callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.getRequest("support-ticket/dashboard");
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetSupportTicketListApi =
  (params = {}, callback = () => { }) =>
    async () => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `support-ticket/list?${queryString}`
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetSupportTicketByIdApi =
  (ticketId, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.getRequest(
          `support-ticket/${ticketId}`
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const UpdateSupportTicketApi =
  (data, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.postRequest(
          "support-ticket/update",
          data
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetStaffReportListApi =
  (params = {}, callback = () => { }) =>
    async () => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiHelper.getRequest(
          `staff-report/list?${queryString}`
        );
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

export const GetStaffReportByIdApi =
  (reportId, callback = () => { }) =>
    async () => {
      try {
        const response = await apiHelper.getRequest(`staff-report/${reportId}`);
        callback(response);
        return response;
      } catch (e) {
        callback({
          status: false,
          success: false,
          message: e?.message || "Request failed",
        });
        return null;
      }
    };

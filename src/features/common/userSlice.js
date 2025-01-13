// src/features/common/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import liff from "@line/liff";

const baseurl = 'https://project-dev-0hj6.onrender.com/';

// Endpoint
const getprofile = `${baseurl}customer/customerinfo`;
const Updateinfo = `${baseurl}customer/customerinfo/updateprofile`
const gethisTory = (page, userID) => `${baseurl}events/customer/registered-events/${userID}?page=${page}per_page=10`
const getreward = (page) => `${baseurl}customer/rewards?page=${page}per_page=10`
const uploadFaceUrl = `${baseurl}customer/customerinfo/uploadfaceid`
const register = (eventid) => `${baseurl}events/registerCustomer/${eventid}`;

function mobileCheck() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobile = (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4))
    || /(iPhone|iPad|iPod)/i.test(userAgent));
  const hasRedirected = sessionStorage.getItem("mobileRedirected");

  if (isMobile && !hasRedirected) {
    sessionStorage.setItem("mobileRedirected", "true");
    return true;
  }
  return false;
}

export const loginWithLine = createAsyncThunk(
  "user/loginWithLine",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const redirected = urlParams.get("redirected");

      if (mobileCheck() && !redirected) {
        window.location.href = "line://app/2002511864-Lw8l8Jo8?redirected=true";
        return;
      }

      await liff.init({ liffId: "2002511864-Lw8l8Jo8" });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      console.log("Profile retrieved:", profile);

      // Dispatch getuser with profile
      dispatch(getuser({ profile }));

      return profile;

    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue(error.message || "Failed to login with LINE");
    }
  }
);

export const updateinfo = createAsyncThunk(
  "user/updateinfos",
  async ({ formData }, { rejectWithValue }) => {

    const url = Updateinfo; // ปลายทางของ API, อาจเป็นเช่น "/api/user/update"

    try {
      const response = await axios.put(url, formData, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error response:", error.response);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else {
        console.error("Network error:", error.message);
        return rejectWithValue("Network error occurred");
      }
    }
  }
);


export const upFaceurl = createAsyncThunk(
  "user/upFaceurls",
  async ({ fileData }, { rejectWithValue }) => {
    const url = 'https://project-dev-0hj6.onrender.com/customer/customerinfo/uploadfaceid';

    if (!(fileData instanceof FormData)) {
      return rejectWithValue("Invalid file data. Please provide FormData.");
    }

    try {
      const response = await axios.put(url, fileData, {
        headers: {
          // ไม่ต้องกำหนด 'Content-Type' เพราะ axios จะตั้งค่าให้เองเมื่อใช้ FormData
        },
      });
      return response.data;
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);

      if (error.response) {
        const { status, data } = error.response;
        if (status >= 400 && status < 500) {
          return rejectWithValue(data?.message || "Client error occurred");
        } else if (status >= 500) {
          return rejectWithValue("Server error occurred. Please try again later.");
        }
      }

      return rejectWithValue("Network error occurred. Please check your connection.");
    }
  }
);

export const getuser = createAsyncThunk(
  'user/getuserData',
  async ({ profile }, { rejectWithValue }) => {
    try {
      const response = await axios.post(getprofile,
        {
          name: profile.displayName,
          customer_id: profile.userId,
          picture: profile.pictureUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const signin = createAsyncThunk(
  'user/signins',
  async ({ eventid, formdata }, { rejectWithValue }) => {
    try {
      const response = await axios.post(register(eventid),
        formdata
        ,
        {
          headers: {
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const gethistory = createAsyncThunk(
  "users/gethistorys",
  async ({ page = 1, userID }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        gethisTory(page, userID),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching history:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Error occurred while fetching events");
    }
  }
);

export const getrewarddata = createAsyncThunk(
  "users/getrewards",
  async (page = 1 , { rejectWithValue }) => {
    try {
      const response = await axios.get(
        getreward(page),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching history:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Error occurred while fetching events");
    }
  }
);



const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    profile: null,
    customerinfo: null,
    isLoading: false,
    error: null,
    response: null,
    gethistorysData: { data: [], meta: {} },
    getrewardslist: { data: [], meta: {} },
  },
  reducers: {
    resetState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle loginWithLine Thunk
      .addCase(loginWithLine.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithLine.fulfilled, (state, action) => {
        console.log("Action payload on success:", action.payload);
        if (action.payload) {
          state.isLoading = false;
          state.profile = action.payload;
        } else {
          state.isLoading = false;
          state.error = "Profile is undefined";
        }
      })
      .addCase(loginWithLine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Handle getuser Thunk
      .addCase(getuser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getuser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customerinfo = action.payload.user; // Assuming response structure
        console.log("Customer Info:", action.payload.user);
      })
      .addCase(getuser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(gethistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gethistorysData = action.payload; // Debug payload structure
        console.log("Fetched history data:", action.payload);
      })
      .addCase(gethistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.error("Error fetching history:", action.payload);
      })
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state, action) => {
          if (action.type.includes("gethistorys")) {
            state.gethistorysData = action.payload;
          } else if (action.type.includes("getrewards")) {
            state.getrewardslist = action.payload;
          }
        }
      )
  },
});

export const { resetState } = userSlice.actions;

export default userSlice.reducer;

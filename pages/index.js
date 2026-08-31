import {
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import AuthLayout from "@/layouts/AuthLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/helper/Context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  UserloginApi,
  VerifyAdminOtpApi,
  SendAdminOtpApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { errorToast, successToast } from "@/components/custom-toast";

// Step 1 Validation schema
const phoneSchema = yup.object().shape({
  mobileNumber: yup
    .string()
    .required("Mobile phone number is required"),
  password: yup.string().required("Password is required"),
});

const SignIn = () => {
  const { login } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  const [step, setStep] = useState(1); // 1: Phone + Password, 2: OTP Verification
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Form for Step 1
  const {
    handleSubmit: handlePhoneSubmit,
    control: phoneControl,
    formState: { errors: phoneErrors },
  } = useForm({
    resolver: yupResolver(phoneSchema),
    defaultValues: {
      mobileNumber: "",
      password: "",
    },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Submit Phone & Password
  const onPhonePasswordSubmit = async (data) => {
    setLoading(true);
    const param = {
      mobileNumber: data.mobileNumber,
      password: data.password,
    };

    await dispatch(
      UserloginApi(param, (resp) => {
        if (resp?.status === true && (resp?.requiresOtp || resp?.otpExpiresTime || resp?.mobileNumber)) {
          successToast(resp?.message || "OTP sent to your registered mobile number");
          setMobileNumber(resp?.mobileNumber || data.mobileNumber);
          setOtp("");
          setStep(2);
          setResendTimer(60);
          setCanResend(false);
          setLoading(false);
        } else if (resp?.status === true && resp?.token) {
          // Direct login fallback if OTP disabled
          successToast(resp?.message || "Login successful");
          login({
            mobileNumber: data?.mobileNumber,
            ...resp,
          });
          router.push("/select-app");
          setLoading(false);
        } else {
          errorToast(resp?.message || "Invalid mobile phone number or password");
          setLoading(false);
        }
      })
    );
  };

  // Step 2: Submit OTP Verification
  const onOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = String(otp).trim();

    if (!cleanOtp) {
      errorToast("OTP is required");
      return;
    }

    if (cleanOtp.length !== 6) {
      errorToast("OTP must be exactly 6 digits");
      return;
    }

    setLoading(true);
    const param = {
      mobileNumber: mobileNumber,
      otp: cleanOtp,
    };

    await dispatch(
      VerifyAdminOtpApi(param, (resp) => {
        if (resp?.status === true && resp?.token) {
          successToast("Login successful");
          login({
            mobileNumber: mobileNumber,
            ...resp,
          });
          router.push("/select-app");
          setLoading(false);
        } else {
          errorToast(resp?.message || "Invalid or expired OTP");
          setLoading(false);
        }
      })
    );
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    await dispatch(
      SendAdminOtpApi({ mobileNumber: mobileNumber }, (resp) => {
        if (resp?.status === true) {
          successToast("OTP resent successfully via Fast2SMS");
          setResendTimer(60);
          setCanResend(false);
        } else {
          errorToast(resp?.message || "Failed to resend OTP");
        }
        setLoading(false);
      })
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <Row className="d-flex align-items-center justify-content-left g-0 min-vh-100">
        <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
          <Card className="smooth-shadow-md login-card">
            <Card.Body className="p-6 login-card">
              <div className="mb-4">
                <h1 className="text-black fw-bold">Admin Panel</h1>
                <p className="text-muted small">
                  {step === 1
                    ? "Enter your mobile phone number and password to receive an OTP."
                    : "Enter the 6-digit OTP sent to your registered mobile phone number."}
                </p>
              </div>

              {step === 1 ? (
                /* STEP 1: Phone & Password Form */
                <form autoComplete="off" onSubmit={handlePhoneSubmit(onPhonePasswordSubmit)}>
                  <Form.Group className="mb-3" controlId="mobileNumber">
                    <Form.Label className="text-black">Mobile Phone Number</Form.Label>
                    <Controller
                      name="mobileNumber"
                      control={phoneControl}
                      defaultValue=""
                      render={({ field }) => (
                        <Form.Control
                          className="login-form"
                          type="text"
                          placeholder="Enter mobile phone number"
                          {...field}
                          value={field.value || ""}
                          isInvalid={!!phoneErrors.mobileNumber}
                        />
                      )}
                    />
                    {phoneErrors.mobileNumber && (
                      <Form.Control.Feedback type="invalid">
                        {phoneErrors.mobileNumber.message}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label className="text-black">Password</Form.Label>
                    <InputGroup>
                      <Controller
                        name="password"
                        control={phoneControl}
                        defaultValue=""
                        render={({ field }) => (
                          <Form.Control
                            className="login-form"
                            type={showPassword ? "text" : "password"}
                            placeholder="**************"
                            {...field}
                            value={field.value || ""}
                            isInvalid={!!phoneErrors.password}
                          />
                        )}
                      />
                      <InputGroup.Text
                        onClick={togglePasswordVisibility}
                        className="password-toggle cursor-pointer"
                        role="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <i className="fe fe-eye"></i>
                        ) : (
                          <i className="fe fe-eye-off"></i>
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                    {phoneErrors.password && (
                      <Form.Control.Feedback type="invalid">
                        {phoneErrors.password.message}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <div className="d-grid mt-4">
                    {loading ? (
                      <Button
                        variant="primary"
                        disabled
                        style={{ backgroundColor: "#d7f52b", border: "none", color: "#220735" }}
                      >
                        <Spinner animation="border" variant="light" size="sm" />
                      </Button>
                    ) : (
                      <Button variant="primary" type="submit" style={{ border: "none" }}>
                        Send OTP
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                /* STEP 2: OTP Verification Form */
                <form autoComplete="off" onSubmit={onOtpSubmit}>
                  <Form.Group className="mb-3" controlId="otpInput">
                    <Form.Label className="text-black fw-bold">6-Digit Verification OTP</Form.Label>
                    <Form.Control
                      className="login-form text-center fs-3"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </Form.Group>

                  <div className="d-grid gap-2 mt-4">
                    {loading ? (
                      <Button
                        variant="primary"
                        disabled
                        style={{ backgroundColor: "#d7f52b", border: "none", color: "#220735" }}
                      >
                        <Spinner animation="border" variant="light" size="sm" />
                      </Button>
                    ) : (
                      <Button variant="primary" type="submit" style={{ border: "none" }}>
                        Verify & Login
                      </Button>
                    )}
                  </div>

                  <div className="d-flex justify-content-end align-items-center mt-4">
                    {/* <Button
                      variant="link"
                      className="p-0 text-muted small text-decoration-none"
                      onClick={() => setStep(1)}
                      style={{ backgroundColor: "#d7f52b", border: "none", color: "#220735" }}
                    >
                      ← Change Phone Number
                    </Button> */}

                    <Button
                      variant="link"
                      className="p-0 text-primary small text-decoration-none"
                      style={{ backgroundColor: "#d7f52b", border: "none", color: "#220735" }}
                      disabled={!canResend || loading}
                      onClick={handleResendOtp}
                    >
                      {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
                    </Button>
                  </div>
                </form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

SignIn.Layout = AuthLayout;

export default SignIn;

import React, { useEffect } from "react";
import { Row, Col, Card, Form, Button, Image, Spinner } from "react-bootstrap";
import Link from "next/link";

// import authlayout to override default layout
import AuthLayout from "@/layouts/AuthLayout";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { OTPVerifyApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { useRouter } from "next/router";
import Notiflix from "notiflix";
const OtpVerify = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);
  const schema = yup.object().shape({
    otp: yup.number().required("email is required"),
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    let param = {
      email: email,
      otp: data?.otp,
    };

    await dispatch(
      OTPVerifyApi(param, (resp) => {
        if (resp.status === true) {
          localStorage.setItem("resettoken", resp?.resetToken);
          router.push("/authentication/reset-password");
          Notiflix.Notify.success(resp?.message);
          setLoading(false);
        } else {
          Notiflix.Notify.failure(resp?.message);
          setLoading(false);
        }
      })
    );
  };
  return (
    <Row className="align-items-center justify-content-left g-0 min-vh-100">
      <Col xxl={4} lg={6} md={8} xs={12} className="py-8 py-xl-0">
        {/* Card */}
        <Card className="smooth-shadow-md login-card">
          {/* Card body */}
          <Card.Body className="p-6 login-card ">
            <div className="mb-4">
              <h1 className="text-black">Verify OTP</h1>
            </div>
            {/* Form */}
            <Form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Enter OTP</Form.Label>
                <Controller
                  name="otp"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      className="login-form"
                      type="number"
                      placeholder=""
                      {...field}
                      isInvalid={!!errors.email}
                    />
                  )}
                />
              </Form.Group>
              {/* Button */}
              <div className="d-grid">
                {loading && (
                  <Button
                    variant="primary"
                    disabled
                    style={{ backgroundColor: "#3572ef", border: "none" }}
                  >
                    <Spinner animation="border" variant="light" size="sm" />
                  </Button>
                )}
                {!loading && (
                  <Button
                    variant="primary"
                    type="submit"
                    style={{ border: "none" }}
                  >
                    Verify
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
OtpVerify.Layout = AuthLayout;
export default OtpVerify;

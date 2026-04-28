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
import {
  OTPVerifyApi,
  ResetPasswordApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { useRouter } from "next/router";
import Notiflix from "notiflix";
const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("resettoken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  const schema = yup.object().shape({
    newpassword: yup.string().required("newpassword is required"),
    confirmpassword: yup.string().required("confirmpassword is required"),
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      newpassword: "",
      confirmpassword: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    let param = {
      token: token,
      newPassword: data?.newpassword,
      confirmPassword: data?.confirmpassword,
    };
    await dispatch(
      ResetPasswordApi(param, (resp) => {
        if (resp.status === true) {
          localStorage.removeItem("email");
          localStorage.removeItem("resettoken");
          router.push("/");
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
              <h1 className="text-black">Reset Password</h1>
            </div>
            {/* Form */}
            <Form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>New Password</Form.Label>
                <Controller
                  name="newpassword"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      className="login-form"
                      type="text"
                      placeholder=""
                      {...field}
                      isInvalid={!!errors.email}
                    />
                  )}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Confirm Password</Form.Label>
                <Controller
                  name="confirmpassword"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      className="login-form"
                      type="text"
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
                    Update
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
ResetPassword.Layout = AuthLayout;
export default ResetPassword;

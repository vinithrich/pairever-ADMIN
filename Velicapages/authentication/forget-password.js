// import node module libraries
import { Row, Col, Card, Form, Button, Image, Spinner } from "react-bootstrap";
import Link from "next/link";

// import authlayout to override default layout
import AuthLayout from "@/layouts/AuthLayout";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ForgetPasswordApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import { useRouter } from "next/router";

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const schema = yup.object().shape({
    email: yup.string().required("email is required"),
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    let param = {
      email: data.email,
    };

    await dispatch(
      ForgetPasswordApi(param, (resp) => {
        if (resp.status === true) {
          router.push("/authentication/otp-verify");
          localStorage.setItem("email", data?.email);
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
              <h1 className="text-black">Forget Password</h1>
              <p className="mb-6">
                Don&apos;t worry, we&apos;ll send you an email to reset your
                password.
              </p>
            </div>
            {/* Form */}
            <Form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      className="login-form"
                      type="email"
                      placeholder="Enter email"
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
                    Forget Password
                  </Button>
                )}
              </div>
              <span>
                Don&apos;t have an account? <Link href="/">Sign In</Link>
              </span>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

ForgetPassword.Layout = AuthLayout;

export default ForgetPassword;

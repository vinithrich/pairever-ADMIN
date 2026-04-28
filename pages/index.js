import {
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import AuthLayout from "@/layouts/AuthLayout";
import { useState } from "react";
import { useAuth } from "@/helper/Context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { UserloginApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { errorToast, successToast } from "@/components/custom-toast";

// Define validation schema
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

const SignIn = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    setLoading(true);
    const param = {
      email: data.email,
      password: data.password,
    };

    await dispatch(
      UserloginApi(param, (resp) => {
        if (resp.status === true) {
          successToast(resp?.message);
          login({
            email: data?.email,
            ...resp,
          });
          router.push("/dashboard");
          setLoading(false);
        } else {
          errorToast(resp?.message);
          setLoading(false);
        }
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
              <div className="d-flex justify-content-end align-items-center">
                {/* <Image src={logo} alt="Image" width={100} height={50} /> */}
              </div>
              <div className="mb-4">
                <h1 className="text-black">Admin Panel</h1>
              </div>
              <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                {/* <form> */}
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label className="text-black">Email</Form.Label>
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
                  {errors.email && (
                    <Form.Control.Feedback type="invalid">
                      {errors.email.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label className="text-black">Password</Form.Label>
                  <InputGroup>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          className="login-form"
                          type={showPassword ? "text" : "password"}
                          placeholder="**************"
                          {...field}
                          isInvalid={!!errors.password}
                        />
                      )}
                    />
                    <InputGroup.Text
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
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
                  {errors.password && (
                    <Form.Control.Feedback type="invalid">
                      {errors.password.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <div className="d-grid">
                  {loading && (
                    <Button
                      variant="primary"
                      disabled
                      style={{ backgroundColor: "#d7f52b", border: "none", color: "#220735" }}
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
                      Sign In
                    </Button>
                  )}
                </div>
                <div className="d-md-flex justify-content-between mt-4">
                  <div>
                    <Link href="/forget-password" className="text-black fs-5">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

SignIn.Layout = AuthLayout;

export default SignIn;

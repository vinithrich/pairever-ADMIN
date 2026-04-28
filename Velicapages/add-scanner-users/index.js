import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Col, Row, Container, Form, Card, Button, InputGroup } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CreateScannerUserApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useDispatch } from 'react-redux';
import Notiflix from 'notiflix';
import { Eye, EyeSlash } from "react-bootstrap-icons";

const AddScannerUsers = () => {
  const router = useRouter();
const dispatch = useDispatch();
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const schema = yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    password: yup.string().required("Password is required"),
    confirmpassword: yup.string().required("confirmpassword is required"),
    loginname: yup.string().required("loginname is required"),
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
        password: "",
        confirmpassword: "",
        loginname: "",
    },
  });


  
  const onSubmit = async(data) => {
    if (data.password !== data.confirmpassword) {
      alert("Passwords do not match");
        return;
    }
    const obj = {
      name: data.loginname,
      email: data.email,
        password: data.password,
    };
      await dispatch(CreateScannerUserApi(obj, (resp) => {
          if (resp.status === true) {
            Notiflix.Notify.success(resp?.message);
            getallJobs();
          }
          else {
            Notiflix.Notify.failure(resp?.message);
          }
        }))
  };

  const handleGoback = () => {
    router.back();
  };
  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className={`nav-icon fe fe-arrow-left-circle me-2 text-white`}
          onClick={handleGoback}
        ></i>
        <PageHeading heading="Add Scanner User" />
      </div>

      <Row className="mb-8">
        <Col xl={12} lg={12} md={12} xs={12}>
          <Card>
            <Card.Body>
              <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                <Row className="mb-3 align-items-center">
                  <Form.Label className="col-sm-4 mb-0" htmlFor="loginname">
                    Name :
                  </Form.Label>
                  <Col md={8} xs={12}>
                    <Controller
                      name="loginname"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          type="text"
                          placeholder="Enter name"
                          {...field}
                          isInvalid={!!errors.loginname}
                        />
                      )}
                    />
                  </Col>
                </Row>

                <Row className="mb-3 align-items-center">
                  <Form.Label className="col-sm-4 mb-0" htmlFor="email">
                    Email :
                  </Form.Label>
                  <Col md={8} xs={12}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          type="email"
                          placeholder="Enter email"
                          {...field}
                          isInvalid={!!errors.email}
                        />
                      )}
                    />
                  </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                  <Form.Label className="col-sm-4 mb-0" htmlFor="password">
                    Password :
                  </Form.Label>
                  <Col md={8} xs={12}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="**************"
                            {...field}
                            isInvalid={!!errors.password}
                          />
                          <InputGroup.Text
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeSlash /> : <Eye />}
                          </InputGroup.Text>
                          <Form.Control.Feedback type="invalid">
                            {errors.password?.message}
                          </Form.Control.Feedback>
                        </InputGroup>
                      )}
                    />
                  </Col>
                </Row>

                <Row className="mb-3 align-items-center">
                  <Form.Label
                    className="col-sm-4 mb-0"
                    htmlFor="confirmpassword"
                  >
                    Confirm Password :
                  </Form.Label>
                  <Col md={8} xs={12}>
                    <Controller
                      name="confirmpassword"
                      control={control}
                      render={({ field }) => (
                        <InputGroup>
                          <Form.Control
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="**************"
                            {...field}
                            isInvalid={!!errors.confirmpassword}
                          />
                          <InputGroup.Text
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? <EyeSlash /> : <Eye />}
                          </InputGroup.Text>
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmpassword?.message}
                          </Form.Control.Feedback>
                        </InputGroup>
                      )}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
                    <Button variant="primary" type="submit">
                      Submit
                    </Button>
                  </Col>
                </Row>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddScannerUsers;

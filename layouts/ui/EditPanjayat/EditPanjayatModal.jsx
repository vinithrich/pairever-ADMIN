import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Col, Form, Row, Spinner, InputGroup } from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import {
  GetAllCategoriesApi,
  GetSinglePanjayatApi,
  UpdatePanjayatApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { errorToast, successToast } from "@/components/custom-toast";

const EditPanjayatModal = (props) => {
  const getId = props?.unionID;
  const [categoryList, setCategoryList] = useState([]);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [singlecat, setSingleCat] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchSingleCat = async () => {
    if (!getId) return;
    await dispatch(
      GetSinglePanjayatApi({ id: getId }, (resp) => {
        if (resp?.status) {
          setSingleCat(resp?.data);
        } else {
          setSingleCat(null);
        }
      })
    );
  };

  const GetUnionCategory = async () => {
    dispatch(
      GetAllCategoriesApi((resp) => {
        if (resp.status === true) {
          setCategoryList(resp.data || []);
        } else {
          setCategoryList([]);
        }
      })
    );
  };

  useEffect(() => {
    GetUnionCategory();
  }, []);

  useEffect(() => {
    fetchSingleCat();
  }, [getId]);

  const schema = yup.object().shape({
    panjayatName: yup.string().required("Panjayat Name is required"),
    GSTNumber: yup
      .string()
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Invalid GST Number format"
      )
      .required("GST Number is required"),
    TANNumber: yup
      .string()
      .matches(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, "Invalid TAN Number format")
      .required("TAN Number is required"),
    union: yup.string().required("Union Office is required"),
    address: yup.string().required("Address is required"),
    password: yup
      .string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .matches(
        /[@$!%*?&]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
    blockUser: yup.boolean().required(),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      panjayatName: "",
      GSTNumber: "",
      TANNumber: "",
      union: "",
      address: "",
      password: "",
      confirmPassword: "",
      blockUser: false,
    },
  });

  useEffect(() => {
    if (singlecat) {
      reset({
        panjayatName: singlecat?.panjayatName || "",
        GSTNumber: singlecat?.GSTNumber || "",
        TANNumber: singlecat?.TANNumber || "",
        union: singlecat?.union || "",
        address: singlecat?.address || "",
        password: "",
        confirmPassword: "",
        blockUser: singlecat?.blockUser || false,
      });
    }
  }, [singlecat, reset]);

  const onSubmit = async (data) => {
    try {
      const params = {
        id: getId,
        ...data,
      };
      setLoading(true);
      await dispatch(
        UpdatePanjayatApi(params, (resp) => {
          if (resp.status === true) {
            successToast("Category Updated Successfully");
            props?.onHide?.();
          } else {
            errorToast(resp?.message);
          }
          setLoading(false);
        })
      );
    } catch (error) {
      errorToast(error?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <Modal {...props} size="lg" centered>
      <Modal.Header closeButton>
        <h3 className="mb-0 fw-bold" style={{ color: "#2b0b47" }}>
          Edit Panjayat
        </h3>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Union */}
          <Row className="mb-4">
            <Form.Label className="col-4">Union Name :</Form.Label>
            <Col lg={8}>
              <Controller
                name="union"
                control={control}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors.union}>
                    <option value="">Select Union</option>
                    {categoryList.map((union) => (
                      <option key={union?._id} value={union?.categoryTitle}>
                        {union?.categoryTitle}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              {errors.union && (
                <Form.Control.Feedback type="invalid">
                  {errors.union.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* Panjayat Name */}
          <Row className="mb-4">
            <Form.Label className="col-4">Panjayat Name :</Form.Label>
            <Col lg={8}>
              <Controller
                name="panjayatName"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.panjayatName}
                  />
                )}
              />
              {errors.panjayatName && (
                <Form.Control.Feedback type="invalid">
                  {errors.panjayatName.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* GST Number */}
          <Row className="mb-4">
            <Form.Label className="col-4">GST Number :</Form.Label>
            <Col lg={8}>
              <Controller
                name="GSTNumber"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.GSTNumber}
                  />
                )}
              />
              {errors.GSTNumber && (
                <Form.Control.Feedback type="invalid">
                  {errors.GSTNumber.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>
          {/* TAN Number */}
          <Row className="mb-4">
            <Form.Label className="col-4">TAN Number :</Form.Label>
            <Col lg={8}>
              <Controller
                name="TANNumber"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.TANNumber}
                  />
                )}
              />
              {errors.TANNumber && (
                <Form.Control.Feedback type="invalid">
                  {errors.TANNumber.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>
          {/* Address */}
          <Row className="mb-4">
            <Form.Label className="col-4">Panjayat Address :</Form.Label>
            <Col lg={8}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.address}
                  />
                )}
              />
              {errors.address && (
                <Form.Control.Feedback type="invalid">
                  {errors.address.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* Password */}
          <Row className="mb-4">
            <Form.Label className="col-4">Password :</Form.Label>
            <Col lg={8}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      {...field}
                      isInvalid={!!errors.password}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? <EyeSlashFill /> : <EyeFill />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {errors.password?.message}
                    </Form.Control.Feedback>
                  </InputGroup>
                )}
              />
            </Col>
          </Row>

          {/* Confirm Password */}
          <Row className="mb-4">
            <Form.Label className="col-4">Confirm Password :</Form.Label>
            <Col lg={8}>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="password"
                    {...field}
                    isInvalid={!!errors.confirmPassword}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>
          <Row className="mb-4">
            <Form.Label className="col-4">Block User :</Form.Label>
            <Col lg={8} style={{ cursor: "pointer" }}>
              <Controller
                name="blockUser"
                control={control}
                render={({ field }) => (
                  <Form.Check
                    type="switch"
                    id="block-user-switch"
                    label={field.value ? "Blocked" : "Active"}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </Col>
          </Row>
          {/* Submit */}
          <Row className="mt-4">
            <Col className="text-end">
              {loading ? (
                <Button variant="primary" disabled>
                  <Spinner animation="border" size="sm" /> Updating...
                </Button>
              ) : (
                <Button variant="primary" type="submit">
                  Update
                </Button>
              )}
            </Col>
          </Row>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default EditPanjayatModal;

import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import {
  GetSingleCategoryApi,
  UpdateCategoryApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { errorToast, successToast } from "@/components/custom-toast";

const EditUnionCategoryModal = (props) => {
  const getId = props?.unionID;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [singlecat, setSingleCat] = useState(null);

  const fetchSingleCat = async () => {
    if (!getId) return;
    await dispatch(
      GetSingleCategoryApi({ id: getId }, (resp) => {
        if (resp?.status) {
          setSingleCat(resp?.data);
        } else {
          setSingleCat(null);
        }
      })
    );
  };

  useEffect(() => {
    fetchSingleCat();
  }, [getId]);

  const schema = yup.object().shape({
    categoryurl: yup.string().required("Category URL is required"),
    categorytitle: yup.string().required("Category Title is required"),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      categoryurl: "",
      categorytitle: "",
    },
  });

  useEffect(() => {
    if (singlecat) {
      reset({
        categoryurl: singlecat?.categoryURL || "",
        categorytitle: singlecat?.categoryTitle || "",
      });
    }
  }, [singlecat, reset]);

  const onSubmit = async (data) => {
    try {
      const params = {
        id: getId,
        categoryURL: data.categoryurl,
        categoryTitle: data.categorytitle,
      };
      setLoading(true);
      await dispatch(
        UpdateCategoryApi(params, (resp) => {
          if (resp.status === true) {
            successToast("Category Updated Successfully");
            setLoading(false);
            props?.onHide?.();
          } else {
            setLoading(false);
            errorToast(resp?.message);
          }
        })
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Modal
      {...props}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Edit Union</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0" htmlFor="categorytitle">
              Union Name :
            </Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="categorytitle"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.categorytitle}
                  />
                )}
              />
              {errors.categorytitle && (
                <Form.Control.Feedback type="invalid">
                  {errors.categorytitle.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0" htmlFor="categoryurl">
              Union URL :
            </Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="categoryurl"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    {...field}
                    isInvalid={!!errors.categoryurl}
                  />
                )}
              />
              {errors.categoryurl && (
                <Form.Control.Feedback type="invalid">
                  {errors.categoryurl.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
              {loading ? (
                <Button variant="primary" disabled>
                  <Spinner animation="border" variant="light" size="sm" />{" "}
                  Updating...
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

export default EditUnionCategoryModal;

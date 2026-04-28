import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Button } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleAreaofInterstApi, GetSinglePlatformFeesApi, UpdatePlatformFeeApi, UpdateSingleAreaofInterstApi } from '@/helper/Redux/ReduxThunk/Homepage';
import Notiflix from 'notiflix';
import Image from 'next/image';

const UpdatePlatformfees = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sendimg, setSendImg] = useState(null);
  const [aoi, setAOI] = useState({});
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const id = router.query.id;
  const handleGoback = () => {
    router.back();
  };

  const schema = yup.object().shape({
    platformfee: yup.string().required("Field is required"),
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      platformfee: "",
    },
  });

  useEffect(() => {
    if (aoi) {
      setValue("platformfee", aoi?.fee || "");
    }
  }, [aoi, setValue]);



  const fetchSingleUser = async () => {
    if (!id) return;
    setLoading(true);
    await dispatch(
      GetSinglePlatformFeesApi({id:id}, (resp) => {
        if (resp?.status === true) {
          setAOI(resp?.data);
        } else {
          Notiflix.Notify.failure("Failed to fetch data.");
        }
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchSingleUser();
    }
  }, [id]);
 const updateInterestHandler = async (data) => {
   const obj = {
     platformfee: data?.platformfee,
     id: id, // make sure `id` is defined in your component
   };

   setLoading(true);
   try {
     await dispatch(
       UpdatePlatformFeeApi(obj, (response) => {
         setLoading(false); // ensure loading is stopped even on early returns

         if (response?.status === true) {
           Notiflix.Notify.success(
             response?.message || "Platform fee updated!"
           );
           router.push("/platform-fee-history");
         } else {
           Notiflix.Notify.failure(response?.message || "Update failed.");
         }
       })
     );
   } catch (error) {
     console.error("Error updating:", error);
     Notiflix.Notify.failure("Failed to update. Try again.");
     setLoading(false);
   }
 };


  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoback}
        ></i>
        <PageHeading heading="Update Platform Fees" />
      </div>

      <Row className="mb-8">
        <Col xl={12} lg={12} md={12} xs={12}>
          <Card>
            <Card.Body>
              <form onSubmit={handleSubmit(updateInterestHandler)}>
                <Row className="mb-3 align-items-center">
                  <Form.Label className="col-sm-4 mb-0" htmlFor="Name">
                    Platform Fees:
                  </Form.Label>
                  <Col md={8} xs={12}>
                    <Controller
                      name="platformfee"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          type="text"
                          placeholder="Enter name"
                          {...field}
                          isInvalid={!!errors.platformfee}
                        />
                      )}
                    />
                    {errors.platformfee && (
                      <Form.Control.Feedback type="invalid">
                        {errors.platformfee.message}
                      </Form.Control.Feedback>
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
                    <Button
                      className="btn-primary"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Submit"}
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

export default UpdatePlatformfees;

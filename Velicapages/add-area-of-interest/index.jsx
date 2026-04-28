import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Col, Row, Container, Form, Card, Button, Spinner } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dynamic from 'next/dynamic';
import { useDispatch } from 'react-redux';
import { AddAreaOfInterestApi } from '@/helper/Redux/ReduxThunk/Homepage';
import Notiflix from "notiflix";
import Image from 'next/image';

const CustomEditor = dynamic(() => import('@/components/custom-editor'), { ssr: false });


const AddBlogs = () => {
    
    const schema = yup.object().shape({
        name: yup.string().required("Name is required"),
        blogimage: yup
            .mixed()
            .required('An image is required')
            .test('fileSize', 'The file is too large', (value) => {
                return value && value.size <= 2 * 1024 * 1024; // 2MB
            })
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [sendImg, setSendImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();

    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            blogimage: null,
        }
    });

    const handleGoback = () => {
        router.back();
    };

    const handleImageChange = (event, onChange) => {
        const file = event.target.files[0];
        if (file) {
            setSendImg(file);
            onChange(file); // Update form state
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("image", sendImg);

        await dispatch(AddAreaOfInterestApi(formData, (resp) => {
            if (resp.status === true) {
                Notiflix.Notify.success("Added Successfully");
                router.push("/area-of-interest");
            } else {
                Notiflix.Notify.failure(resp.message);
            }
            setLoading(false);
        }));
    };

    return (
      <Container fluid className="p-6">
        <div className="go_back">
          <i
            className="nav-icon fe fe-arrow-left-circle me-2 text-white"
            onClick={handleGoback}
          ></i>
          <PageHeading heading="Add New Area Of Interest" />
        </div>

        <Row className="mb-8">
          <Col xl={12} lg={12} md={12} xs={12}>
            <Card>
              <Card.Body>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Row className="mb-3 align-items-center">
                    <Form.Label className="col-sm-4 mb-0">Name:</Form.Label>
                    <Col md={8} xs={12}>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <Form.Control
                            type="text"
                            {...field}
                            isInvalid={!!errors.name}
                          />
                        )}
                      />
                      {errors.name && (
                        <p style={{ color: "red" }}>{errors.name.message}</p>
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3 align-items-center">
                    <Form.Label className="col-sm-4 mb-0">
                      Upload Image:
                    </Form.Label>
                    <Col md={8} xs={12}>
                      <Controller
                        name="blogimage"
                        control={control}
                        render={({ field: { onChange } }) => (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, onChange)}
                          />
                        )}
                      />
                      {errors.blogimage && (
                        <p style={{ color: "red" }}>
                          {errors.blogimage.message}
                        </p>
                      )}
                    </Col>
                  </Row>
                  <Row className="mb-3 align-items-center">
                    <Col md={{ span: 8, offset: 4 }} xs={12}>
                      {selectedImage && (
                        <div style={{ marginTop: "20px" }}>
                          <Image
                            src={selectedImage}
                            alt="Selected"
                            style={{ width: "100px", height: "auto" }}
                            width={1200}
                            height={600}
                          />
                        </div>
                      )}
                    </Col>
                  </Row>

                  <Row>
                    <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
                      {loading ? (
                        <Button
                          disabled
                          style={{ background: "#383846", border: "none" }}
                        >
                          <Spinner
                            animation="border"
                            variant="light"
                            size="sm"
                          />
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          type="submit"
                          style={{ background: "#383846", border: "none" }}
                        >
                          Submit
                        </Button>
                      )}
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

export default AddBlogs;

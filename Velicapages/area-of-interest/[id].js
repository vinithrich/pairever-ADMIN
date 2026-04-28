import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Button } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleAreaofInterstApi, UpdateSingleAreaofInterstApi } from '@/helper/Redux/ReduxThunk/Homepage';
import Notiflix from 'notiflix';
import Image from 'next/image';

const UpdateAddOfInterest = () => {
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
        image: yup.mixed().required('An image is required'),
        name: yup.string().required("Field is required"),
    });

    const { handleSubmit, control, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            image: ""
        }
    });

    useEffect(() => {
        if (aoi) {
            setValue("name", aoi?.name || "");
            setSelectedImage(aoi?.image || "");
            setSendImg(null); // Reset file selection
        }
    }, [aoi, setValue]);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSendImg(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchSingleUser = async () => {
        
        if (!id) return;
        setLoading(true);
        await dispatch(GetSingleAreaofInterstApi(id, (resp) => {
            if (resp?.status === true) {
                setAOI(resp?.data);
            } else {
                Notiflix.Notify.failure("Failed to fetch data.");
            }
        }));
        setLoading(false);
    };

    useEffect(() => {
        if (id) {
            fetchSingleUser();
        }
    }, [id]);

    const updateInterestHandler = async (data) => {
        const formData = new FormData();

        formData.append("name", data?.name);

        if (sendimg) {
            formData.append("image", sendimg); // Only append image if it's selected
        } else {
            formData.append("image", aoi?.image); // Use the old image URL
        }

        setLoading(true);
        try {
            await dispatch(UpdateSingleAreaofInterstApi(id, formData, (response) => {
                if (response?.status === true) {
                    Notiflix.Notify.success(response?.message);
                    router.push("/area-of-interest"); // Redirect on success
                } else {
                    Notiflix.Notify.failure(response?.message);  // Failure notification
                }
            }));
        } catch (error) {
            Notiflix.Notify.failure("Failed to update. Try again.");
            console.error("Error updating:", error); // Log the error
        }
        setLoading(false);
    };



    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                <PageHeading heading="Update Area Of Interest" />
            </div>

            <Row className="mb-8">
                <Col xl={12} lg={12} md={12} xs={12}>
                    <Card>
                        <Card.Body>
                            <form onSubmit={handleSubmit(updateInterestHandler)}>
                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='Name'>Name:</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="name"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter name"
                                                    {...field}
                                                    isInvalid={!!errors.name}
                                                />
                                            )}
                                        />
                                        {errors.name && <Form.Control.Feedback type="invalid">{errors.name.message}</Form.Control.Feedback>}
                                    </Col>
                                </Row>

                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='blogurl'>Upload Image:</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="image"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputRef}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.files);
                                                        handleImageChange(e);
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.image && <p style={{ color: 'red' }}>{errors.image.message}</p>}
                                    </Col>
                                </Row>

                                {selectedImage && (
                                    <Row>
                                        <Col md={{ offset: 4, span: 8 }} xs={12}>
                                            <div style={{ marginTop: '20px' }}>
                                                <Image
                                                    src={selectedImage}
                                                    alt="Selected"
                                                    width={200}
                                                    height={200}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                <Row>
                                    <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
                                        <Button className='btn-primary' type="submit" disabled={loading}>
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

export default UpdateAddOfInterest;

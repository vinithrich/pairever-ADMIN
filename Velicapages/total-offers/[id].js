import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Button } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleOfferApi, UpdateOffersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import Notiflix from 'notiflix';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const CustomEditor = dynamic(() => import('@/components/custom-editor'), { ssr: false });

const UpdateOffers = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [sendimg, setSendImg] = useState(null);
    const [aoi, setAOI] = useState({});
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const { id } = router.query;
    const [editorData, setEditorData] = useState('');

    const handleOfferEditorChange = (data) => {
        setEditorData(data);
    };

    const handleGoback = () => {
        router.back();
    };

    const schema = yup.object().shape({
        image: yup.mixed().required('An image is required'),
        code: yup.string().required("code is required"),
    });

    const { handleSubmit, control, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            code: aoi?.code || "",
            image: aoi?.image || "",
            description: aoi?.description || ""
        }
    });

    useEffect(() => {
        if (aoi) {
            setValue("code", aoi?.code || ""); // Set code
            setSelectedImage(aoi?.image || ""); // Set selectedImage
            setSendImg(null);
            setEditorData(aoi?.description || ""); // Set description
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

    const getSingleOffers = async () => {
        if (!id) return; // Prevent fetching without authentication
        const param = { id: id };

        await dispatch(
            GetSingleOfferApi(param, (resp) => {
                if (resp?.status === true) {
                    setAOI(resp?.offer);
                } else {
                    console.error('Failed to fetch offer details', resp);
                }
            })
        );
    };

    useEffect(() => {
        if (id) {
            getSingleOffers();
        }
    }, [id]);

    const onSubmit = async (data) => {
        if (editorData === "") {
            alert("Content is required");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("offerid", id);

        formData.append("code", data.code);

        if (sendimg) {
            formData.append("image", sendimg); // Only append image if it's selected
        } else {
            formData.append("image", aoi?.image); // Use the old image URL
        }

        formData.append("description", editorData);

        try {
            // Pass offerid and formData correctly to the API function
            await dispatch(UpdateOffersApi(formData, (resp) => {
                if (resp?.status === true) {
                    Notiflix.Notify.success("Updated Successfully");
                    router.push('/total-offers')
                    setLoading(false);
                } else {
                    Notiflix.Notify.failure(resp?.message);
                    setLoading(false);
                }
            }));
        } catch (error) {
            Notiflix.Notify.failure("Failed to update offer");
            setLoading(false);
        }
    };

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                <PageHeading heading="Update Offers" />
            </div>

            <Row className="mb-8">
                <Col xl={12} lg={12} md={12} xs={12}>
                    <Card>
                        <Card.Body>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='code'>Code:</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="code"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter code"
                                                    {...field}
                                                    isInvalid={!!errors.code}
                                                />
                                            )}
                                        />
                                        {errors.code && <Form.Control.Feedback type="invalid">{errors.code.message}</Form.Control.Feedback>}
                                    </Col>
                                </Row>

                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='image'>Upload Image:</Form.Label>
                                    <Col md={8} xs={12}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
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
                                                    width={400}
                                                    height={200}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                <Row className="mb-3 d-flex align-items-start">
                                    <Form.Label className='col-sm-4 col-md-4 mb-0' htmlFor='description'>Description:</Form.Label>
                                    <Col md={8} xs={12} className='mt-0'>
                                        <CustomEditor handleEditorChange={handleOfferEditorChange} editorblogdata={editorData} />
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-4">
                                        <Button variant="primary" type="submit" disabled={loading}>
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

export default UpdateOffers;

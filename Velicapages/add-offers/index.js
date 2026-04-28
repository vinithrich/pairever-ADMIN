import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Button, Spinner } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dynamic from 'next/dynamic';
import { useDispatch } from 'react-redux';
import { AddAreaOfInterestApi, CreateOffersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import Notiflix from "notiflix";
import Image from 'next/image';

const CustomEditor = dynamic(() => import('@/components/custom-editor'), { ssr: false });


const AddOffers = () => {
    const [editorData, setEditorData] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [sendImg, setSendImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const schema = yup.object().shape({
        code: yup.string().required("Name is required"),
        image: yup
            .mixed()
            .required('An image is required')
            .test('fileSize', 'The file is too large', (value) => {
                return value && value.size <= 2 * 1024 * 1024; // 2MB
            }),
      
    });
    const handleOfferEditorChange = (data) => {
        setEditorData(data);
        setValue("description", data);  // ✅ Update React Hook Form state
    };

    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            code: "",
           image: null,
            description:""
        }
    });

    const handleGoback = () => {
        router.back();
    };

    const handleImageChange = (event, onChange) => {
        const file = event.target.files[0];
        if (file) {
            setSendImg(file);
            onChange(file); // ✅ Updates React Hook Form state properly

            // Read file for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        if (editorData == "") {
            alert("content required")
        }
        else {
            setLoading(true);
            const formData = new FormData();
            formData.append("code", data.code);
            formData.append("image", sendImg);
            formData.append("description", data.description);
   
            await dispatch(CreateOffersApi(formData, (resp) => {
                if (resp.status === true) {
                    Notiflix.Notify.success("Added Successfully");
                    router.push("/total-offers");
                } else {
                    Notiflix.Notify.failure(resp.message);
                }
                setLoading(false);
            }));
        }
    };

    return (
        <div>
            <Container fluid className="p-6">
                <div className='go_back'>
                    <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                    <PageHeading heading="Add Offers" />
                </div>

                <Row className="mb-8">
                    <Col xl={12} lg={12} md={12} xs={12}>
                        <Card>
                            <Card.Body>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='Name'>Code:</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="code"
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
                                            render={({ field: { onChange, value, ...rest } }) => (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputRef}
                                                    onChange={(e) => handleImageChange(e, onChange)} // ✅ Pass `onChange`
                                                    {...rest}
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
                                                    width={400}
                                                    height={200}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                <Row className="mb-3 d-flex align-items-start">
                                    <Form.Label className='col-sm-4 col-md-4 mb-0' htmlFor='blogcontent' >Description   :</Form.Label>
                                    <Col md={8} xs={12} className='mt-0'>
                                        <CustomEditor handleEditorChange={handleOfferEditorChange}  />
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
        </div>
    )
}

export default AddOffers;
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Image } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleUsersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useParams } from 'next/navigation';

const UserProfileDetails = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const userid = router.query.id;
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [sendimg, setSendImg] = useState(null);
    const fileInputRef = useRef(null);

    const handleGoback = () => router.back();

    const schema = yup.object().shape({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email format').required('Email is required'),
        about: yup.string().required("About is required"),
        image: yup.mixed().required("Image is required").test('fileType', 'Only image files are allowed',
            value => value && value[0] && value[0].type.startsWith('image/')),
        areaOfInterest: yup.string().required("Area of Interest is required"),
        phone: yup.string().required("Phone is required"),
    });

    const {
        control,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const fetchUserData = async () => {
        if (!userid) return;
        setLoading(true);
        await dispatch(GetSingleUsersApi(userid, (resp) => {
            setUserData(resp?.data);
            setLoading(false);
        }));
    };

    useEffect(() => {
        fetchUserData();
    }, [userid]);

    useEffect(() => {
        if (userData) {
            setValue('name', userData.name);
            setValue('email', userData.email);
            setValue('about', userData.about);
            setValue('areaOfInterest', userData.areaOfInterest);
            setSelectedImage(userData?.image || "");
            setValue('phone', userData.phone);
        }
    }, [userData, setValue]);

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
    return (
        <div>
            <Container fluid className="p-6">
                <div className='go_back'>
                    <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                    <PageHeading heading="User Profile Details" />
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <Row className="mb-8">
                        <Col xl={12}>
                            <Card>
                                <Card.Body>
                                    <Row className="mb-3 align-items-center">
                                        <Form.Label className='col-sm-4 mb-0'>Name:</Form.Label>
                                        <Col md={8}>
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field }) => (
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter name"
                                                        {...field}
                                                    />
                                                )}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3 align-items-center">
                                        <Form.Label className='col-sm-4 mb-0'>Email:</Form.Label>
                                        <Col md={8}>
                                            <Controller
                                                name="email"
                                                control={control}
                                                render={({ field }) => (
                                                    <Form.Control
                                                        type="email"
                                                        placeholder="Phone Number is Provided"
                                                        {...field}
                                                    />
                                                )}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3 align-items-center">
                                        <Form.Label className='col-sm-4 mb-0' htmlFor='blogurl'>Upload Blog Image:</Form.Label>
                                        <Col md={8} xs={12}>
                                            {/* <Controller
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
                                            {errors.image && <p style={{ color: 'red' }}>{errors.image.message}</p>} */}
                                                {selectedImage && (
                                                    <Row>
                                                        <Col >
                                                            <div >
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
                                        </Col>
                                    </Row>
                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Area Of Interest:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="areaOfInterest"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Card>
                                                            <div className='row bg-white pt-2'>
                                                                {userData?.areaOfInterest?.map((d, index) => (
                                                                    <div key={index} className='col-lg-4 col-md-6 col-sm-12 '>
                                                                        <ul>
                                                                            <li>{d}</li>
                                                                        </ul>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Card>
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                    

                                    <Row className="mb-3 align-items-center">
                                        <Form.Label className='col-sm-4 mb-0'>About:</Form.Label>
                                        <Col md={8}>
                                            <Controller
                                                name="about"
                                                control={control}
                                                render={({ field }) => (
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter about info"
                                                        {...field}
                                                    />
                                                )}
                                            />
                                        </Col>
                                        </Row>
                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Phone:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="phone"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Email is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default UserProfileDetails;

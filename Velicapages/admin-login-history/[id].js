import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Image } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleAdminHistoryApi, GetSingleUsersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useParams } from 'next/navigation';

const SingleAdminHistory = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const userid = router.query.id;
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
   

    const handleGoback = () => router.back();

    const schema = yup.object().shape({
      
        email: yup.string().email('Invalid email format').required('Email is required'),
        browser_name: yup.string().required("browser_name is required"),
        ip_address: yup.string().required("ip_address is required"),
        os: yup.string().required("Operating System is required"),
        country: yup.string().required("country is required"),
        region: yup.string().required("region is required"),
        regionName: yup.string().required("regionName is required"),
        city: yup.string().required("city is required"),
    });
    const {
        control,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            email: "",
            browser_name: "",
            ip_address: "",
            os: "",
            country: "",
            region: "",
            regionName: "",
            city: "",
        },
    });

    const fetchUserData = async () => {
        if (!userid) return;
        const obj = {
            id: userid
        }
        setLoading(true);
        await dispatch(GetSingleAdminHistoryApi(obj, (resp) => {
            setHistoryData(resp?.data);
            setLoading(false);
        }));
    };

    useEffect(() => {
        fetchUserData();
    }, [userid]);
    useEffect(() => {
        if (historyData && historyData.length > 0) {
            const user = historyData[0]; 
            setValue("email", user.email || "");
            setValue("browser_name", user.browser_name || "");
            setValue("ip_address", user.ip_address || "");
            setValue("os", user.os || "");
            setValue("country", user.country || "");
            setValue("region", user.region || "");
            setValue("regionName", user.regionName || "");
            setValue("city", user.city || "");
        }
    }, [historyData, setValue]);
 
    return (
        <div>
            <Container fluid className="p-6">
                <div className='go_back'>
                    <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                    <PageHeading heading="Admin Login History Details" />
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <Row className="mb-8">
                        <Col xl={12}>
                            <Card>
                                <Card.Body>
                                    <Row className="mb-3 align-items-center">
                                        <Form.Label className='col-sm-4 mb-0'>Email:</Form.Label>
                                        <Col md={8}>
                                            <Controller
                                                    name="email"
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
                                        <Form.Label className='col-sm-4 mb-0'>Browser Name:</Form.Label>
                                        <Col md={8}>
                                            <Controller
                                                    name="browser_name"
                                                control={control}
                                                render={({ field }) => (
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Phone Number is Provided"
                                                        {...field}
                                                    />
                                                )}
                                            />
                                        </Col>
                                    </Row>

                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>IP Address:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="ip_address"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>

                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Operating Systems:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="os"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>

                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Country:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="country"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                   
                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Region:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="region"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>Region Name:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="regionName"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>

                                        <Row className="mb-3 align-items-center">
                                            <Form.Label className='col-sm-4 mb-0'>City:</Form.Label>
                                            <Col md={8}>
                                                <Controller
                                                    name="city"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number is Provided"
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

export default SingleAdminHistory;

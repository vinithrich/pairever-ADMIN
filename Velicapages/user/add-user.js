import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Col, Row, Container, Form, Card, Button } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";


const AddUsers = () => {

    const router = useRouter();

    const schema = yup.object().shape({
        email: yup.string().email('Invalid email format').required('Email is required'),
        password: yup.string().required("Password is required"),
        department: yup.string().required("Field is required"),
        loginname: yup.string().required("Field is required"),

    });

    const {
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });
    const department = watch("department");

    const getLoginNameOptions = () => {
        switch (department) {
            case "sales":
                return ["Michael1", "Michael2", "Michael3"];
            case "admin":
                return ["Vinith", "Michale"];
            case "marketing":
                return ["Venkat", "Venkat2", "Venkat3"];
            case "Developer":
                return ["Mohan", "Giri", "Suren", "Suriya"];
            default:
                return [];
        }
    };
    const onSubmit = (data) => {

        console.log('Form submitted:', data);

    };


    const handleGoback = () => {
        router.back()
    }
    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2`} onClick={handleGoback}></i>
                <PageHeading heading="Add User" />
            </div>

            <Row className="mb-8">
                <Col xl={12} lg={12} md={12} xs={12}>
                    <Card>
                        <Card.Body>
                            <form onSubmit={handleSubmit(onSubmit)}>

                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='department' >Department   :</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="department"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Control as="select" {...field} isInvalid={!!errors.department}>
                                                    <option value="">Select Department</option>
                                                    <option value="marketing">Marketing</option>
                                                    <option value="sales">Sales</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="sdeveloper">Developer</option>
                                                </Form.Control>
                                            )}
                                        />
                                    </Col>
                                </Row>
                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='loginname' >Login Name   :</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="loginname"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Control as="select" {...field} isInvalid={!!errors.loginname}>
                                                    <option value="">Select Name</option>
                                                    {getLoginNameOptions().map((name) => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </Form.Control>
                                            )}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-3 align-items-center">
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='email' >Email   :</Form.Label>
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
                                    <Form.Label className='col-sm-4 mb-0' htmlFor='password' >Password   :</Form.Label>
                                    <Col md={8} xs={12}>
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Control
                                                    type="password"
                                                    placeholder="**************"
                                                    {...field}
                                                    isInvalid={!!errors.password}
                                                />
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

export default AddUsers;

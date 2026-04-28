// import node module libraries
import React from "react";
import Link from 'next/link';
import { Col, Card, Accordion, Dropdown, Image, Row, Form } from 'react-bootstrap';
const SubAdminPermissionLists = ({ selectedDepartment }) => {

    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        (<Link
            href=""
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            className="text-muted text-primary-hover">
            {children}
        </Link>)
    ));

    CustomToggle.displayName = 'CustomToggle';

    const renderCards = () => {
        if (selectedDepartment === 'marketing') { // Marketing
            return (
                <>
                     <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Leads Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Careers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Blogs Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
           
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Subscribers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Email Campaign Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
                </>
            );
        }
        if (selectedDepartment === 'sales') { 
            return (
                <>
                     <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Leads Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Careers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Subscribers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Email Campaign Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
                </>
            );
        }
        if (selectedDepartment === 'content') { 
            return (
                <>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Blog Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
         
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Email Campaign Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
                </>
            );
        }
        else{
return(
    <>
    
    <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Leads Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Careers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Blogs Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Pages Meta Tags Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label>Subscribers Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Card className="mt-3">
                <Card.Body>
                    <Row>
                        <Col md={12} xs={12}>
                            <Form.Check id="customOpenEmail">
                                <Form.Check.Input type="checkbox" name="customOpenEmail" />
                                <Form.Check.Label> Email Campaign Management</Form.Check.Label>
                            </Form.Check>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
    </>
)
        }

        return null;
    };

    return (
        <Col xl={6} lg={12} md={12} xs={12} className="mb-6">

{renderCards()}

        </Col>
    )
}

export default SubAdminPermissionLists
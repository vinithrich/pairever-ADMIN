import { PageHeading } from '@/widgets'
import React from 'react'
import { Col, Row, Container, Form, Card, Table, } from 'react-bootstrap';

const AddAdminlist = () => {
    return (
        <Container fluid className="p-6">
            <PageHeading heading="Sub-Admin List" />

            <div className="">
                <div className='d-flex justify-content-between w-100'>
                    <div className="d-flex align-items-center">
                        <div className="ms-lg-3">
                            {/* Search Form */}
                            <Form className="d-flex align-items-center">
                                <Form.Control type="search" placeholder="Search" />
                            </Form>
                        </div>
                    </div>

                </div>
                <Row className="mt-6">
                    <Col md={12} xs={12}>
                        <Card>
                            <Table responsive className="text-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="align-middle">1</td>
                                        <td className="align-middle">Sub Admin Users</td>
                                        <td className="align-middle">
                                            subadmin@gmail.com
                                        </td>
                                        <td className="align-middle text-dark">
                                            12/07/2024
                                        </td>
                                        <td className="align-middle"><span className={`badge bg-success`}>Active</span></td>
                                        <td className="align-middle"><span className={`badge bg-success`}>Action</span></td>

                                    </tr>

                                </tbody>
                            </Table>

                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    )
}



export default AddAdminlist


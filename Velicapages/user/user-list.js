import { PageHeading } from '@/widgets'
import { useRouter } from 'next/router';
import React from 'react'
import { Col, Row, Container, Form, Card, Table, } from 'react-bootstrap';

const UserList = () => {
    const router = useRouter();
    const handleGoback = () => {
        router.back()
    }
    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2`} onClick={handleGoback}></i>
                <PageHeading heading="User List" />
            </div>
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
                                        <th>Username</th>
                                        <th>Email Address</th>
                                        <th>Country</th>
                                        <th>Phone</th>
                                        <th>Register On</th>
                                        <th>Account Status</th>
                                        <th>KYC Status</th>
                                        <th>TFA Status</th>
                                        <th>Action</th>


                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="align-middle">1</td>
                                        <td className="align-middle">user</td>
                                        <td className="align-middle">user@gmail.com</td>
                                        <td className="align-middle">India
                                        </td>
                                        <td className="align-middle">765788654</td>
                                        <td className="align-middle">06/07/2024</td>
                                        <td className="align-middle"><span className={`badge bg-success`}>Active</span></td>
                                        <td className="align-middle"><span className={`badge bg-info`}>NOT UPLOAD</span></td>
                                        <td className="align-middle"><span className={`badge bg-warning`}>DISABLED</span></td>
                                        <td className="align-middle"><span className={`badge bg-danger`}>DISABLED</span></td>

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



export default UserList


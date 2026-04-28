import { PageHeading } from '@/widgets'
import { useRouter } from 'next/router';
import React from 'react'
import { Col, Row, Container, Form, Card, Table, } from 'react-bootstrap';

const AdminLoginhistory = () => {
    const router=useRouter();
    const handleGoback=()=>{
        router.back();
    }
    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Log History" />
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
                                        <th>IP Address</th>
                                        <th>Operating System</th>
                                        <th>Browser</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="align-middle">1</td>
                                        <td className="align-middle">user</td>
                                        <td className="align-middle">
                                            162.76.65
                                        </td>
                                        <td className="align-middle text-dark">
                                            Linux 125.0.0
                                        </td>
                                        <td className="align-middle">Chrome</td>
                                        <td className="align-middle">06/07/2024</td>

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



export default AdminLoginhistory


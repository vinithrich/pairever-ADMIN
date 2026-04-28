
import { formatDate } from '@/helper/apiHelper';
import { GetallSubscribeusApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import PrivateRoute from '@/helper/PrivateRoute';

const SubscribeUs = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [leadsPerPage] = useState(10);
    const router = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [subscribeusdata, setSubscribeUsData] = useState([])
    useEffect(() => {
        GetallSubscribeus();
    }, [])
    const GetallSubscribeus = async () => {
        setLoading(true);
        await dispatch(GetallSubscribeusApi((resp) => {
            if (resp.status === true) {
                setSubscribeUsData(resp?.data)
                setLoading(false)
            }
            else {

            }

        }))
    }

    const handleGoback = () => {
        router.back();
    };

    const handleLeadsdet = (id) => {
        router.push(`/leads/${id}`);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to the first page when a search is initiated
    };

    // Filtered leads based on the search query
    const filteredLeads = subscribeusdata?.filter((lead) =>
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Subscribers" />
            </div>
            <div className="">
                <div className='d-flex justify-content-between w-100'>
                    <div className="d-flex align-items-center">
                        <div className="ms-lg-3">
                            {/* Search Form */}
                            <Form>
                                <Form.Label className='text-white fw-bold'>Search</Form.Label>
                                <Form.Control
                                    type="search"
                                    placeholder="Email/IP"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </Form>
                        </div>
                    </div>
                    {/* <div className="d-flex justify-content-end gap-3 ms-lg-3">
                        <Form>
                            <Form.Label  className='text-white fw-bold'>From</Form.Label>
                            <Form.Control type="date" placeholder="From" />
                        </Form>
                        <Form>
                            <Form.Label  className='text-white fw-bold'>To</Form.Label>
                            <Form.Control type="date" placeholder="To" />
                        </Form>
                    </div> */}
                </div>
                <Row className="mt-6">
                    <Col md={12} xs={12}>
                        <Card>
                            <Table responsive className="text-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sl.No</th>
                                        <th>Date & Time</th>
                                        <th>IP Address</th>
                                        <th>Email ID</th>
                                        <th>Subscribed From</th>
                                        <th>Action</th>


                                        {/* <th>View</th> */}
                                    </tr>
                                </thead>

                                {!loading && <tbody>
                                    {currentLeads && currentLeads?.map((d, i) =>
                                        <tr key={i}>
                                            <td className="align-middle">{indexOfFirstLead + i + 1}</td>
                                            <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                            <td className="align-middle">{d?.ipAddress}</td>
                                            <td className="align-middle">{d?.email}</td>
                                            <td className="align-middle">{d?.pageFrom || ""}</td>

                                            {/* <td className="align-middle">{d.blog_category}</td>
                                            <td className="align-middle"><span className={`${d.siteMapStatus === true ? "badge bg-success" : "badge bg-danger"}`}>{d.siteMapStatus === true ? "Active" : "InActive"}</span></td>
                                            <td className="align-middle"><span className='editlist' onClick={() => handleMetaDet(d._id)}><i className="fe fe-eye" ></i></span><span className='deletelist' onClick={() => handleDelete(d._id)}><i className="fe fe-trash" ></i></span></td> */}


                                        </tr>
                                    )}

                                </tbody>
                                }

                                {/* {currentLeads.length > 0 ? (
                                        currentLeads.map((d, i) => (
                                            <tr key={d._id}>
                                                <td className="align-middle">{indexOfFirstLead + i + 1}</td>
                                                <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                                <td className="align-middle">{d.ipAddress}</td>
                                                <td className="align-middle">{d.email}</td>
                           
                                                <td className="align-middle"><span className='deletelist' onClick={() => handleLeadsdet(d._id)}><i className="fe fe-eye"></i></span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No leads found</td>
                                        </tr>
                                    )} */}

                            </Table>
                            <Pagination className="justify-content-center mt-3">
                                <Pagination.Prev
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                />
                                {[...Array(totalPages)].map((_, i) => (
                                    <Pagination.Item
                                        key={i}
                                        active={i + 1 === currentPage}
                                        onClick={() => paginate(i + 1)}
                                    >
                                        {i + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default PrivateRoute(SubscribeUs);

import { formatDate } from '@/helper/apiHelper';
import { DeleteSingleCarrearApi, GetCarearApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import PrivateRoute from '@/helper/PrivateRoute';
import Notiflix from "notiflix";

const Carear = () => {
    const [leadslist, setLeadsList] = useState([])
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [leadsPerPage] = useState(10);
    const router = useRouter();
    const dispatch = useDispatch();
    const getleads = async () => {
        dispatch(GetCarearApi((resp) => {
            if (resp.status == true) {
                setLeadsList(resp.data);
            }
            else {
                setLeadsList([])
            }
        }))
    }
    useEffect(() => {
        getleads();
    }, [])
    const handleGoback = () => {
        router.back()
    }
    const handleLeadsdet = (id) => {
        router.push(`/careers/${id}`)
    }

    const filteredLeads = leadslist && leadslist?.filter((lead) => {
        const createdAt = new Date(lead.createdAt);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        const matchesSearchQuery =
            lead.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.position?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDateRange =
            (!from || createdAt >= from) && (!to || createdAt <= to);

        return matchesSearchQuery && matchesDateRange;
    });

    // Pagination logic
    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads && filteredLeads?.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(filteredLeads && filteredLeads?.length / leadsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleFromDateChange = (e) => {
        setFromDate(e.target.value);
        setCurrentPage(1); // Reset to the first page when the date is changed
    };

    const handleToDateChange = (e) => {
        setToDate(e.target.value);
        setCurrentPage(1); // Reset to the first page when the date is changed
    };
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to the first page when a search is initiated
    };
    const handleDelete = (id) => {
        let data = {
            id: id
        }
        dispatch(DeleteSingleCarrearApi(data, (resp) => {
            if (resp.status === true) {
                Notiflix.Notify.success("Blog Deleted Successfully");
                getleads();
            }
            else {
                Notiflix.Notify.failure(resp?.message);
            }
        }))
    }





    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Careers" />
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
                                    placeholder="Name/Email/IP/Position"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </Form>
                        </div>
                    </div>


                    <div className="d-flex justify-content-end gap-3 ms-lg-3">
                        <Form>
                            <Form.Label className='text-white fw-bold'>From</Form.Label>
                            <Form.Control
                                type="date"
                                value={fromDate}
                                onChange={handleFromDateChange}
                            />
                        </Form>
                        <Form>
                            <Form.Label className='text-white fw-bold'>To</Form.Label>
                            <Form.Control
                                type="date"
                                value={toDate}
                                onChange={handleToDateChange}
                            />
                        </Form>
                    </div>
                </div>
                <Row className="mt-6">
                    <Col md={12} xs={12}>
                        <Card>
                            <Table responsive className="text-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>S.No</th>
                                        <th>Date & Time</th>
                                        <th>IP Address</th>
                                        <th>Position Applied For </th>
                                        <th>Full Name</th>
                                        <th>Email Address</th>
                                        <th>Mobile Number</th>
                                        <th>Country</th>
                                        <th>State</th>
                                        <th>City</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLeads && currentLeads?.map((d, i) => {
                                        return (
                                            <tr key={i}>
                                                <td className="align-middle">{indexOfFirstLead + i + 1}</td>
                                                <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                                <td className="align-middle">{d.ipAddress}</td>
                                                <td className="align-middle text-dark">{d.position}</td>
                                                <td className="align-middle">{d.fullName}</td>
                                                <td className="align-middle">{d.email}</td>
                                                <td className="align-middle text-dark">{d.mobileNumber}</td>
                                                <td className="align-middle text-dark">{d.country}</td>
                                                <td className="align-middle text-dark">{d.state}</td>
                                                <td className="align-middle text-dark">{d.city}</td>

                                                {/* <td className="align-middle"><span className='deletelist' onClick={() => handleLeadsdet(d._id)}></span></td> */}
                                                <td className="align-middle"><span className='editlist' onClick={() => handleLeadsdet(d._id)}><i className="fe fe-eye" ></i></span><span className='deletelist' onClick={() => handleDelete(d._id)}><i className="fe fe-trash" ></i></span></td>
                                            </tr>
                                        )
                                    })}

                                </tbody>
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

export default PrivateRoute(Carear);

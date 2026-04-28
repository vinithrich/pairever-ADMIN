import { formatDate } from '@/helper/apiHelper';
import { GetAllTicketApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const UserList = () => {
    const [userdata, setUserData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        GetAllUsers();
    }, []);

    const GetAllUsers = async () => {
        setLoading(true);
        await dispatch(GetAllTicketApi((resp) => {
            setUserData(resp?.data || []);
            setLoading(false);
        }));
    };

    const handleGoback = () => router.back();
    const handleticketDetails = (id) => router.push(`/ticket-details/${id}`);

    // Handle search input
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    // Filter data based on search term
    const filteredData = userdata.filter((d) =>
        d?.venueEventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d?.bookinId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d?.payment_status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                <PageHeading heading="Ticket Details" />
            </div>
            <div className="d-flex justify-content-between w-100 mt-3">
                <Form className="d-flex align-items-center w-25">
                    <Form.Control
                        type="search"
                        placeholder="Search by Event Name, Booking ID, Payment Status"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </Form>
            </div>

            <Row className="mt-4">
                <Col md={12} xs={12}>
                    <Card>
                        <Table responsive className="text-nowrap mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>S.No</th>
                                    <th>Date & Time</th>
                                    <th>BookingId</th>
                                    <th>Event Name</th>
                                    <th>Payment Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((d, i) => (
                                    <tr key={i}>
                                        <td className="align-middle">{startIndex + i + 1}</td>
                                        <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                        <td className="align-middle">{d?.bookinId}</td>
                                        <td className="align-middle text-dark">{d?.venueEventName}</td>
                                        <td className={`align-middle ${d?.payment_status === "PAID" ? 'text-success' : 'text-danger'}`}>
                                            {d?.payment_status === "PAID" ? "Success" : "Failed"}
                                        </td>
                                        <td className="align-middle">
                                            <span className='deletelist' onClick={() => handleticketDetails(d?._id)}>
                                                <i className="fe fe-eye"></i>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {totalPages > 1 && (
                            <Pagination className="mt-3 justify-content-center">
                                <Pagination.First disabled={currentPage === 1} onClick={() => handlePageChange(1)} />
                                <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />

                                {[...Array(totalPages)].map((_, i) => (
                                    <Pagination.Item key={i} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
                                        {i + 1}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                                <Pagination.Last disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} />
                            </Pagination>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UserList;

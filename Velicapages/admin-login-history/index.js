import { formatDate } from '@/helper/apiHelper';
import { GetAllAdminHistoryApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const AdminLoginHistory = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleGoback = () => {
        router.back();
    };

    const GetAllAdminHistory = async () => {
        setLoading(true);
        await dispatch(GetAllAdminHistoryApi((resp) => {
            if (resp.status === true) {
                setLoading(false);
                setHistory(resp?.data || []);
                setFilteredHistory(resp?.data || []); // Initialize filtered data
            }
        }));
    };

    useEffect(() => {
        GetAllAdminHistory();
    }, []);

    // Handle search
    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = history.filter(
          (item) =>
            (item.email && item.email.toLowerCase().includes(value)) ||
            (item.ip_address && item.ip_address.includes(value)) ||
            (item.country && item.country.toLowerCase().includes(value))
        );
          
        setFilteredHistory(filtered);
        setCurrentPage(1);
    };

    const handleLeadsdet = (id) => {
        router.push(`/admin-login-history/${id}`);
    };

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Admin Login History" />
            </div>

            <div className="d-flex justify-content-between w-100 mt-3">
                <Form className="d-flex">
                    {/* <Col md={4}> */}

                        <Form.Control
                            type="search"
                            placeholder="Search by Email, IP, Country"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    {/* </Col> */}
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
                                    <th>Email</th>
                                    <th>IP Address</th>
                                    <th>Country</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((d, i) => (
                                    <tr key={d?._id || i}>
                                        <td className="align-middle">{startIndex + i + 1}</td>
                                        <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                        <td className="align-middle text-dark">{d?.email}</td>
                                        <td className="align-middle">{d?.ip_address}</td>
                                        <td className="align-middle text-dark">{d?.country}</td>
                                        <td className="align-middle">
                                            <span className='editlist' onClick={() => handleLeadsdet(d?._id)}>
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

export default AdminLoginHistory;

import { formatDate } from '@/helper/apiHelper';
import { GetAllUsersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import Notiflix from 'notiflix';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const UserList = () => {
    const [userdata, setUserData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        GetAllUsers();
    }, []);

    const GetAllUsers = async () => {
        setLoading(true);
        await dispatch(GetAllUsersApi((resp) => {
            if (resp.status === true) {
                setUserData(resp?.data);
                setFilteredData(resp?.data); // Initialize filtered data
            }
            setLoading(false);
        }));
    };

    // Handle Search
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setCurrentPage(1); // Reset to page 1 when searching

        if (query === "") {
            setFilteredData(userdata);
        } else {
            const filteredResults = userdata.filter(user =>
                user?.name?.toLowerCase().includes(query) ||
                user?.email?.toLowerCase().includes(query)
            );
            setFilteredData(filteredResults);
        }
    };

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleGoback = () => {
        router.back();
    };

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={handleGoback}></i>
                <PageHeading heading="User List" />
            </div>

            {/* Search Bar */}
            <div className="d-flex justify-content-between w-100 mt-3">
                <Form className="d-flex align-items-center">
                    <Form.Control
                        type="search"
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={handleSearch}
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
                                    <th>Username</th>
                                    <th>Email Address / Phone</th>
                                    <th>Register On</th>
                                    <th>Email Verified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((d, i) => (
                                        <tr key={d._id}>
                                            <td className="align-middle">{startIndex + i + 1}</td>
                                            <td className="align-middle text-dark">{d?.name}</td>
                                            <td className="align-middle">{d?.email || d?.phone}</td>
                                            <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                            <td className={`align-middle ${d?.isVerified ? 'text-success' : 'text-danger'}`}>
                                                {d?.isVerified ? "Verified" : "Unverified"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-4">
                                            No results found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {/* Pagination */}
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

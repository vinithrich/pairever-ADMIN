import { formatDate } from '@/helper/apiHelper';
import { DeleteAreaOfInterestApi, GetAllAreaofInterstApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import Notiflix from 'notiflix';
import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Form, Row, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const Index = () => {
    const [areaInterest, setAreaInterest] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const GetAllInterest = async () => {
        setLoading(true);
        await dispatch(GetAllAreaofInterstApi((resp) => {
            if (resp.status === true) {
                setAreaInterest(resp?.data);
            } else {
                console.error("Failed to fetch interest areas", resp);
            }
            setLoading(false);
        }));
    };

    useEffect(() => {
        GetAllInterest();
    }, []);

    // Search and Filter Logic
    const filteredData = areaInterest.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic for Filtered Data
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleDelete = (id) => {
        dispatch(DeleteAreaOfInterestApi({ id }, (resp) => {
            if (resp.status === true) {
                Notiflix.Notify.success("Area Of Interest Deleted Successfully");
                GetAllInterest();
            } else {
                Notiflix.Notify.failure(resp?.message);
            }
        }));
    };

    const showConfirmToast = (id) => {
        Notiflix.Confirm.show(
            "Confirm Action",
            "Are you sure you want to delete?",
            "Yes",
            "No",
            () => handleDelete(id),
            () => console.log("Cancelled!")
        );
    };

    return (
        <Container fluid className="p-6">
            <div className='go_back'>
                <i className="nav-icon fe fe-arrow-left-circle me-2 text-white" onClick={() => router.back()}></i>
                <PageHeading heading="Area Of Interest List" />
            </div>

            {/* Search Input */}
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Col>
            </Row>

            <Row className="mt-3">
                <Col md={12}>
                    <Card>
                        <Table responsive className="text-nowrap mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>S.No</th>
                                    <th>Date & Time</th>
                                    <th>Name</th>
                                    <th>Poster</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((d, i) => (
                                        <tr key={d._id}>
                                            <td className="align-middle">{startIndex + i + 1}</td>
                                            <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                            <td className="align-middle text-dark">{d?.name}</td>
                                            <td className="align-middle">{d?.image}</td>
                                            <td className="align-middle">
                                                <span className='editlist' onClick={() => router.push(`/area-of-interest/${d._id}`)}>
                                                    <i className="fe fe-eye"></i>
                                                </span>
                                                <span className='deletelist' onClick={() => showConfirmToast(d._id)}>
                                                    <i className="fe fe-trash"></i>
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            No results found.
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

export default Index;

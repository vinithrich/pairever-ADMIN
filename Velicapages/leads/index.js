
import { formatDate } from '@/helper/apiHelper';
import { GetLeadsApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import PrivateRoute from '@/helper/PrivateRoute';
import Papa from 'papaparse'; // For CSV export
import * as XLSX from 'xlsx'; // For Excel export
const Leads = () => {
    const [leadslist, setLeadsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [leadsPerPage] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();

    const getleads = async () => {
        dispatch(GetLeadsApi((resp) => {
            if (resp.status === true) {
                setLeadsList(resp.data);
            }
        }));
    };

    useEffect(() => {
        getleads();
    }, []);

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
    const handleFromDateChange = (e) => {
        setFromDate(e.target.value);
        setCurrentPage(1); // Reset to the first page when the date is changed
    };

    const handleToDateChange = (e) => {
        setToDate(e.target.value);
        setCurrentPage(1); // Reset to the first page when the date is changed
    };
    // Filtered leads based on the search query
    const filteredLeads = leadslist.filter((lead) => {
        const createdAt = new Date(lead.createdAt);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        const matchesSearchQuery =
            lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDateRange =
            (!from || createdAt >= from) && (!to || createdAt <= to);

        return matchesSearchQuery && matchesDateRange;
    });

    // Pagination logic
    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);


    // Export as CSV
    const exportCSV = () => {
        const csv = Papa.unparse(filteredLeads);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        a.click();
    };

    // Export as Excel
    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredLeads);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, 'leads.xlsx');
    };

    const handleAddBtn = async () => {
        try {
            router.push("/add-new-lead")
        } catch (error) {
            console.error(error);
        }
    };
    const maskEmail = (email) => {
        if (!email || !email.includes('@')) return email; // Return as is if invalid or missing email

        const [localPart, domain] = email.split('@');

        const maskedLocal = localPart.slice(0, 3) + 'xxxxxx';
        return `${maskedLocal}@${domain}`;
    };
    return (
        <Container fluid className="p-6">
            <div className='d-flex justify-content-between '>
                <div className='go_back'>
                    <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                    <PageHeading heading="Leads" />
                </div>
                <div>
                    <Button onClick={handleAddBtn} className='d-flex text-end  no-border' style={{ background: 'white', border: 'none', color: 'black' }}>
                        + Add New Lead
                    </Button>
                </div>
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
                                    placeholder="Name/Email/IP"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </Form>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center">
                        <Row className="mt-5">
                            <Col >
                                <Button variant="success" onClick={exportCSV}>Export as CSV</Button>
                                <Button variant="warning" onClick={exportExcel} className="ms-3">Export as Excel</Button>
                            </Col>
                        </Row>
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
                                        <th>IP Address</th>
                                        <th>Inquiry Date</th>
                                        <th>Name</th>
                                        <th>Email</th>

                                        {/* <th>Country</th>
                                        <th>Phone No</th>
                                        <th>Requirement</th> */}
                                        <th>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLeads.length > 0 ? (
                                        currentLeads.map((d, i) => (
                                            <tr key={d._id}>
                                                <td className="align-middle">{indexOfFirstLead + i + 1}</td>
                                                <td className="align-middle">{d.ipAddress}</td>
                                                <td className="align-middle text-dark">{formatDate(d.createdAt)}</td>
                                                <td className="align-middle">{d.name}</td>
                                                <td className="align-middle text-dark">{maskEmail(d.email)}</td>

                                                {/* <td className="align-middle text-dark">{d.country}</td>
                                                <td className="align-middle text-dark">{d.number}</td>
                                                <td className="align-middle text-dark">{d.service}</td> */}
                                                <td className="align-middle"><span className='deletelist' onClick={() => handleLeadsdet(d._id)}><i className="fe fe-eye"></i></span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No leads found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                            <Pagination className="justify-content-center mt-3 ">
                                <Pagination.Prev
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}

                                />
                                {[...Array(totalPages)].map((_, i) => (
                                    <Pagination.Item
                                        key={i}
                                        active={i + 1 === currentPage}
                                        onClick={() => paginate(i + 1)}
                                        className={i + 1 === currentPage ? 'custom-active' : 'custom-item'}
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

export default PrivateRoute(Leads);

import { formatDate } from "@/helper/apiHelper";
import { GetSingleScannedUsers } from "@/helper/Redux/ReduxThunk/Homepage";
import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
  Pagination,
  Spinner,
} from "react-bootstrap";
import { useDispatch } from "react-redux";

const ViewScannerUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const router = useRouter();
  const dispatch = useDispatch();

  const { id } = router.query;

  useEffect(() => {
    if (router.isReady && id) {
      fetchUsers();
    }
  }, [router.isReady, id]);

  const fetchUsers = async () => {
    setLoading(true);
    const obj = { email: id };
    await dispatch(
      GetSingleScannedUsers(obj, (resp) => {
        if (resp.status) {
          setUsers(resp?.data || []);
          setFilteredOffers(resp?.data || []); // ✅ sync filtered list too
        }
        setLoading(false);
      })
    );
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = users.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.email.toLowerCase().includes(value)
    );
    setFilteredOffers(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedData = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        ></i>
        <PageHeading heading="View Scanner Users" />
      </div>

      <Form className="mt-3">
        <Col md={4}>
          <Form.Control
            type="search"
            placeholder="Search by Name or Email"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Col>
      </Form>

      <Row className="mt-4">
        <Col md={12} xs={12}>
          <Card>
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <Table responsive className="text-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    <th>Date & Time</th>
                    <th>Name</th>
                    <th>Organisation Name</th>
                    <th>Booking Id</th>
                    <th>Venue Event Name</th>
                    <th>Venue Type</th>
                    <th>Verify Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((d, i) => (
                      <tr key={d?._id || i}>
                        <td className="align-middle">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </td>
                        <td className="align-middle text-dark">
                          {formatDate(d.scannedDate)}
                        </td>
                        <td className="align-middle">{d?.name}</td>
                        <td className="align-middle">{d?.organizationName}</td>
                        <td className="align-middle">{d?.bookinId}</td>
                        <td className="align-middle">{d?.venueEventName}</td>
                        <td className="align-middle">{d?.venueType}</td>
                        <td
                          className={`align-middle ${
                            !d?.verifyTicket ? "text-danger" : "text-success"
                          }`}
                        >
                          {!d?.verifyTicket ? "Not Yet Verified" : "Verified"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

            {totalPages > 1 && (
              <Pagination className="mt-3 justify-content-center">
                <Pagination.First
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                />
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i}
                    active={i + 1 === currentPage}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
                <Pagination.Last
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                />
              </Pagination>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewScannerUsers;

import { formatDate } from '@/helper/apiHelper';
import { DeleteOffersApi, DeleteScannedUsersApi, GetAllOffersApi, GetAllScannerUsersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import Notiflix from 'notiflix';
import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Form, Row, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const TotalScannerUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();
 
  const dispatch = useDispatch();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    await dispatch(
      GetAllScannerUsersApi((resp) => {
        if (resp.status) {
          setUsers(resp?.user || []);
          setFilteredOffers(resp?.user || []);
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
const handleview = (id) => router.push(`/total-scanner-users/${id}`);

  const handleDelete = (id) => {
    dispatch(
      DeleteScannedUsersApi({ id }, (resp) => {
        if (resp.status === true) {
          Notiflix.Notify.success("Offer Deleted Successfully");
          fetchUsers();
          
        } else {
          Notiflix.Notify.failure(resp?.message);
        }
      })
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        ></i>
        <PageHeading heading="Scanner Users" />
      </div>
      <Form className="mt-3 ">
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
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Date & Time</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Total Scanned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((d, i) => (
                  <tr key={d?._id || i}>
                    <td className="align-middle">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="align-middle text-dark">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="align-middle">{d?.name}</td>
                    <td className="align-middle">{d?.email}</td>
                    <td className="align-middle">{d?.count}</td>
                    <td className="align-middle">
                      <span
                        className="deletelist"
                        onClick={() => handleview(d?.email)}
                      >
                        <i className="fe fe-eye"></i>
                      </span>
                      <span
                        className="deletelist"
                        onClick={() => handleDelete(d?._id)}
                      >
                        <i className="fe fe-trash"></i>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

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

export default TotalScannerUsers;

import { formatDate } from '@/helper/apiHelper';
import { DeleteEventsApi, GetAllEventsApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import Notiflix from 'notiflix';
import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Form, Card, Table, Pagination } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

const UserList = () => {
    const [eventsdata, setEventsData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const GetAllEvents = async () => {
        setLoading(true);
        await dispatch(GetAllEventsApi((resp) => {
            if (resp.status === true) {
                setEventsData(resp?.data);
            }
            setLoading(false);
        }));
    };

    useEffect(() => {
        GetAllEvents();
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Filter events based on search query
    const filteredData = eventsdata.filter((event) =>
        event.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleLeadsDetail = (id) => {
        router.push(`/events/${id}`);
    };

  const handleDelete = (id) => {
    Notiflix.Confirm.show(
      "Confirm Delete",
      "Are you sure you want to delete this event?",
      "Yes",
      "No",
      async () => {
        // ✅ User clicked Yes
        const resp = await dispatch(
          DeleteEventsApi({ id: id }, (resp) => {
            if (resp?.status) {
              Notiflix.Notify.success(resp?.message);
        GetAllEvents();
            } else {
              Notiflix.Notify.failure(resp?.message);
            }
          })
        );
      },
      () => {
        // ❌ User clicked No
        Notiflix.Notify.info("Delete cancelled.");
      }
    );
  };
    return (
      <Container fluid className="p-6">
        <div className="go_back">
          <i
            className="nav-icon fe fe-arrow-left-circle me-2 text-white"
            onClick={handleGoBack}
          ></i>
          <PageHeading heading="Events List" />
        </div>

        <div className="d-flex justify-content-between w-100 mt-4">
          {/* Search Bar */}
          <Form className="d-flex align-items-center">
            <Form.Control
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </Form>
        </div>

        <Row className="mt-4">
          <Col md={12}>
            <Card>
              <Table responsive className="text-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    <th>Date & Time</th>
                    <th>Organization/Individual Name</th>
                    <th>Category</th>
                    <th>Contact Person</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((event, i) => (
                    <tr key={event._id}>
                      <td className="align-middle">{startIndex + i + 1}</td>
                      <td className="align-middle text-dark">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="align-middle text-dark">
                        {event?.organizationName}
                      </td>
                      <td className="align-middle">{event?.category}</td>
                      <td className="align-middle text-dark">
                        {event?.contactPerson}
                      </td>
                      <td className="align-middle">
                        {event?.status === "completed" ? (
                          <div className="approve-div">
                            <p>Approved</p>
                          </div>
                        ) : event?.status === "cancelled" ? (
                          <div className="reject-div">
                            <p>Rejected</p>
                          </div>
                        ) : (
                          <div className="pending-div">
                            <p>Pending</p>
                          </div>
                        )}
                      </td>
                      <td className="align-middle">
                        <span
                          className="editlist"
                          onClick={() => handleLeadsDetail(event._id)}
                        >
                          <i className="fe fe-eye"></i>
                        </span>
                        <span
                          className="deletelist"
                          onClick={() => handleDelete(event._id)}
                        >
                          <i className="fe fe-trash"></i>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
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

export default UserList;

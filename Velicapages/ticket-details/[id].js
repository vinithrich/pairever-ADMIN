import { PageHeading } from '@/widgets';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row, Container, Form, Card, Image } from 'react-bootstrap';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from 'react-redux';
import { GetSingleAdminHistoryApi, GetSingleTicketApi, GetSingleUsersApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useParams } from 'next/navigation';

const SingleAdminHistory = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const userid = router.query.id;
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);


    const handleGoback = () => router.back();



    const fetchUserData = async () => {
        if (!userid) return;
        const obj = {
            id: userid
        }
        setLoading(true);
        await dispatch(GetSingleTicketApi(obj, (resp) => {
            setHistoryData(resp?.data);
            setLoading(false);
        }));
    };
    useEffect(() => {
        fetchUserData();
    }, [userid]);

    return (
      <div>
        <Container fluid className="p-6">
          <div className="go_back">
            <i
              className="nav-icon fe fe-arrow-left-circle me-2 text-white"
              onClick={handleGoback}
            ></i>
            <PageHeading heading="Ticket Details" />
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <Row className="mb-8">
              <Col xl={12}>
                <Card>
                  <Card.Body>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4>Name:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.name}</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Email / Phone:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.email || historyData?.phone}
                        </h4>
                      </Col>
                    </Row>



                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Total Tickets:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.ticket_count}
                        </h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Remaining Tickets:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.email}</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Ticket Prize:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.prize}</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Payment Status:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.payment_status}
                        </h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Booking Id:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.bookinId}</h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">QR Code:</h4>
                      </Col>
                      <Col md={8}>
                        <Image
                          src={historyData?.qrCodeUrl}
                          alt="Description"
                          width={100}
                          height={100}
                        />
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">User Id:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.userId}</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Organisation Name:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.organizationName}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Contact Person:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.EventcontactPerson}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Contact Number:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.EventphoneNumber}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Event Name:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.venueEventName}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Venue Type:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.venueType}</h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Venue Address:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.venueAddress}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Venue Date:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.venueDate}</h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Venue Time:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.venuetime}</h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Venue Location:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">
                          {historyData?.venueLocation}
                        </h4>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <h4 className="col-sm-4 mb-0">Ticket Validity:</h4>
                      </Col>
                      <Col md={8}>
                        <h4 className="fw-normal">{historyData?.status}</h4>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    );
};

export default SingleAdminHistory;

import VenueModal from "@/components/VenueModal";
import { formatDate } from "@/helper/apiHelper";
import {
  ApproveRejectApi,
  GetSingleEventApi,
  GetTicketApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { PageHeading } from "@/widgets";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Notiflix from "notiflix";
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { RiEdit2Line } from "react-icons/ri";
import { useDispatch } from "react-redux";

const CustomEditor = dynamic(() => import("@/components/custom-editor"), {
  ssr: false,
});

const EventDetails = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [editorData, setEditorData] = useState("");
  const [categoryLst, setCategorylst] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [modalShow, setModalShow] = React.useState(false);
  const [modalShow1, setModalShow1] = React.useState(false);

  const [selectedVenue, setSelectedVenue] = useState("");
  const router = useRouter();
  const [eventsdata, setEventsData] = useState([]);
  const [eventsdetails, setEventsDetails] = useState([]);
  const [ticketdetails, setTicketDetails] = useState([]);
  const [ticketVenueData, setTicketVenueData] = useState([]);

  const [ticketData, setTicketData] = useState([]);
  const [eventimg, setEventimg] = useState([]);
  const loadingRef = useRef(false);

  const [venuedata, setVenueData] = useState([]);
  const eventId = router.query.id; // ✅ Extract the ID
  const venueId = eventsdetails?.map((o) => o?._id);

  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleUpdateEvents = (id) => {
    router.push(`/update-events/${id}`);
  };

  const handleGoback = () => {
    router.back();
  };

  // ===================Modal Venue Ticket API=========================
  const handleVenueClick = async (venueid) => {
    // if (loadingRef.current) return; // Prevent multiple calls
    // loadingRef.current = true; // Lock function to prevent duplicate requests

    setModalShow(true); // Open modal immediately

    const obj = {
      venueId: venueid,
      eventId: eventId,
    };
    try {
      await dispatch(
        GetTicketApi(obj, (resp) => {
          if (resp.status == true) {
            setTicketData(resp.tickets);
            setTicketVenueData(resp?.venueDetails);
          } else {
            setLeadsList([]);
          }
        })
      );
    } catch (error) {
      console.error("🔥 API Fetch Error:", error);
    } finally {
      loadingRef.current = false; // Unlock function after request completes
    }
  };


  const closeUpdateVenueClick = () => {
    setModalShow1(false);
  };
  const dispatch = useDispatch();
  // ===========================GetAll Events API==========================
  const GetAllEvents = async () => {
    if (!eventId) return; // Ensure eventId is valid before making the request
    setLoading(true);

    await dispatch(
      GetSingleEventApi(eventId, (resp) => {
        if (resp?.status === true) {
          setEventsData(resp.data);
          setEventimg(
            resp.data?.eventImages?.length ? resp.data.eventImages : []
          );
          setEventsDetails(
            resp.data?.venueDetails?.length ? resp.data.venueDetails : []
          );
          setTicketDetails(
            resp.data?.venueDetails?.length
              ? resp.data.venueDetails.map((o) => o?.ticket)
              : []
          );
        } else {
          console.warn("No valid response data received");
        }
      })
    );

    setLoading(false);
  };

  useEffect(() => {
    if (eventId) {
      GetAllEvents();
    }
  }, [eventId]); // Only trigger when eventId changes

  // ===================Approve/Reject API=========================
  const handleStatus = async (type) => {
    let params = {
      type: type,
      eventid: eventId,
    };

    await dispatch(
      ApproveRejectApi(params, (resp) => {
        if (resp?.status === true) {
          router.push("/events");

          Notiflix.Notify.success(resp?.message);
          setLoading(false);
        } else {
          Notiflix.Notify.failure(resp?.message);
          setLoading(false);
        }
      })
    );
  };

  return (
    <Container fluid className="p-6 event-id">
      <div className="approve-btn-head-div">
        <div className="go_back">
          <i
            className={`nav-icon fe fe-arrow-left-circle me-2 text-white`}
            onClick={handleGoback}
          ></i>
          <PageHeading heading="Event Overview" />
        </div>

        <div className="app-rej-btn-div">
          <Button
            className="upd-btn"
            onClick={() => handleUpdateEvents(eventId)}
          >
            <RiEdit2Line /> Edit
          </Button>
          {eventsdata?.status === "completed" ? (
            <p className="status_green">Approved</p>
          ) : eventsdata?.status === "cancelled" ? (
            <p className="status_red">Rejected</p>
          ) : (
            <>
              <button
                className="app-btn"
                onClick={() => handleStatus("completed")}
                disabled={
                  eventsdata?.status === "completed" ||
                  eventsdata?.status === "cancelled"
                }
              >
                Approve
              </button>
              <button
                className="rej-btn"
                onClick={() => handleStatus("cancelled")}
                disabled={
                  eventsdata?.status === "completed" ||
                  eventsdata?.status === "cancelled"
                }
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
      <Row className="mb-8">
        <Col xl={6} lg={6} md={12} xs={12}>
          <Card className="h-100">
            <Card.Body>
              <h3 className="mb-4 fw-bold text-black">
                Organization/Individual Details{" "}
              </h3>

              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Date & Time :
                </p>
                <Col md={8} xs={12}>
                  <p>{formatDate(eventsdata?.createdAt)}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Organization/individual name :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.organizationName}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">Category :</p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.category}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Contact person :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.contactPerson}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Phone Number :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.phoneNumber}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Account Number :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.accountNumber}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">BBAN :</p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.BBAN}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Business Documents :
                </p>
                <Col md={8} xs={12}>
                  <a
                    href={eventsdata?.businessDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  ID Document :
                </p>
                <Col md={8} xs={12}>
                  <a
                    href={eventsdata?.document}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} lg={6} md={12} xs={12}>
          <Card className="h-100">
            <Card.Body>
              <h3 className="mb-4 fw-bold text-black">Event Details </h3>
              {eventsdetails &&
                eventsdetails?.map((o) => (
                  <div key={o?._id}>
                    <Row className="mb-3 align-items-center">
                      <p className="col-sm-4 mb-0 fw-bold text-black">
                        Event Name:
                      </p>
                      <Col md={8} xs={12}>
                        <p>{o?.eventName}</p>
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <p className="col-sm-4 mb-0 fw-bold text-black">Time :</p>
                      <Col md={8} xs={12}>
                        <p>{o?.time}</p>
                      </Col>
                    </Row>
                  </div>
                ))}
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">Duration :</p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.duration}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">Age Limit :</p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.ageLimit}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">Language :</p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.language}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  About Event :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.aboutEvent}</p>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <p className="col-sm-4 mb-0 fw-bold text-black">
                  Terms & Conditions :
                </p>
                <Col md={8} xs={12}>
                  <p>{eventsdata?.terms_Condition}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* <PageHeading heading="Venue & Ticket Details" /> */}
      {/* <div className='go_back'>

                <PageHeading heading="Venue & Ticket Details" />
            </div> */}
      <Row className="mb-8">
        <Col xl={6} lg={6} md={12} xs={12}>
          <Card>
            <Card.Body>
              <h3 className="mb-4 fw-bold text-black">Flyer Banner </h3>
              <Row className="mb-3 align-items-center">
                {/* <p className='col-sm-4 mb-0 fw-bold text-black'>Flyer Image :</p> */}
                {eventimg.map((o, i) => {
                  return (
                    // <Col md={8} xs={12} key={i}>
                    <Col lg={4} md={6} sm={12} key={i}>
                      <img src={o} alt="flyer" width={200} height={120} />
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6} lg={6} md={12} xs={12}>
          <Card>
            <Card.Body>
              <h3 className="mb-4 fw-bold text-black">Venue Details</h3>

              {eventsdetails &&
                eventsdetails?.map((o, i) => (
                  <Row key={i} className="mb-3 align-items-center">
                    <p className="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-0 fw-bold text-black d-flex justify-content-center">
                      Venue {i + 1} :
                    </p>
                    <Col xl={4} lg={4} md={4} sm={4} xs={4}>
                      <p
                        style={{ cursor: "pointer" }}
                        className="d-flex justify-content-center"
                      >
                        {o?.venueName}
                      </p>
                    </Col>
                    <Col xl={4} lg={4} md={4} sm={4} xs={4}>
                      <div className="d-flex justify-content-center gap-3">
                        <Button
                          className="warning"
                          onClick={() => handleVenueClick(o?._id)}
                        >
                          View
                        </Button>
                        {/* <Button className="warning" onClick={() => handleUpdateVenueClick(o?._id)}>
                                                Update
                                            </Button> */}
                      </div>
                    </Col>
                  </Row>
                ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <VenueModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        selectedVenue={selectedVenue}
        eventsdetails={eventsdetails}
        ticketVenueData={ticketVenueData}
        ticketData={ticketData}
      />
      {/* <UpdateModal show={modalShow1}
                onHide={() => setModalShow1(false)}
                eventsdetails={eventsdetails}
                ticketData={ticketData}
              

            /> */}
    </Container>
  );
};

export default EventDetails;

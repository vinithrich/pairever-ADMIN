import { formatDate } from "@/helper/apiHelper";
import {
  GetSingleEventApi,
  UpdateEventsApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
import { PageHeading } from "@/widgets";
import { yupResolver } from "@hookform/resolvers/yup";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Notiflix from "notiflix";
import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { MdStars } from "react-icons/md";
import { useDispatch } from "react-redux";
import * as yup from "yup";

const CustomEditor = dynamic(() => import("@/components/custom-editor"), {
  ssr: false,
});

const UpdateEvents = () => {
  const [eventsDetails, setEventsDetails] = useState([]);
  const [flyerImages, setFlyerImages] = useState([]); // Manage existing and new flyer images
  const [editorData, setEditorData] = useState("");
  const [editorData1, setEditorData1] = useState("");
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const eventId = router.query.id;


const remainingTickets = eventsDetails.map((venue) =>
  venue.ticket.map((ticket) => ticket.remaining_Ticket)
);
const allRemainingTickets = remainingTickets.flat();

console.log("Remaining Tickets for each venue:", remainingTickets);
console.log("All Remaining Tickets:", allRemainingTickets);


  // Validation schema
  const schema = yup.object().shape({
    orgdate: yup.string().required("Organization date is required"),
    orgname: yup.string().required("Organization name is required"),
    orgcategory: yup.string().required("Organization category is required"),
    orgpersonname: yup.string().required("Contact person name is required"),
    orgphonenumber: yup.string().required("Phone number is required"),
    orgaccnumber: yup.string().required("Account number is required"),
    orgbban: yup.string().required("BBAN is required"),
    orgbussdocument: yup.string().optional(),
    orgidDocument: yup.string().optional(),
    eventname: yup.array().of(yup.string()).required("Event name is required"),
    eventtime: yup.array().of(yup.string()).required("Event time is required"),
    eventduration: yup.string().required("Event duration is required"),
    eventage: yup.string().required("Event age is required"),
    eventlang: yup.string().required("Event language is required"),
    flyerimage: yup.array().min(1, "At least one flyer image is required"),
    venueDetails: yup
      .array()
      .of(
        yup.object().shape({
          venueName: yup.string().required("Venue name is required"),
          address: yup.string().required("Venue address is required"),
          date: yup.string().required("Venue date is required"),
          location: yup.string().required("Venue location is required"),
          time: yup.string().required("Venue time is required"),
          ticket: yup
            .array()
            .of(
              yup.object().shape({
                team: yup.string().required("Ticket team is required"),
                price: yup.string().required("Ticket price is required"),
              })
            )
            .required("Tickets are required"),
        })
      )
      .required("Venue details are required"),
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      orgdate: "",
      orgname: "",
      orgcategory: "",
      orgpersonname: "",
      orgphonenumber: "",
      orgaccnumber: "",
      orgbban: "",
      orgbussdocument: "",
      orgidDocument: "",
      eventname: [],
      eventtime: [],
      eventduration: "",
      eventage: "",
      eventlang: "",
      flyerimage: [],
      venueDetails: [], // Initialize venue details
    },
  });

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImageFiles((prevImages) => [...prevImages, ...files]);
    setFlyerImages((prevImages) => [
      ...prevImages,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    // Update form state for flyer images
    setValue("flyerimage", [...flyerImages, ...files]); // Include existing images
  };

  const handleRemoveImage = (index) => {
    // Remove image from flyerImages state and also from the form data
    setFlyerImages((prevImages) => {
      const updatedImages = prevImages.filter((_, i) => i !== index);
      setValue("flyerimage", updatedImages); // Update form field to exclude the removed image
      return updatedImages;
    });
  };

  const GetAllEvents = async () => {
    if (!eventId) return;
    setLoading(true);

    await dispatch(
      GetSingleEventApi(eventId, (resp) => {
        if (resp?.status) {
          const data = resp.data || {};
          setEventsDetails(data.venueDetails || []);
          const initialImages = data.eventImages || [];
          setFlyerImages(initialImages); // Set initial flyer images
          setSelectedImageFiles([]); // Reset selected image files

          // Set editor content
          setEditorData(data.aboutEvent || "");
          setEditorData1(data.terms_Condition || "");

          // Fill form with current data
          const defaultValues = {
            orgdate: formatDate(data.createdAt) || "",
            orgname: data.organizationName || "",
            orgcategory: data.category || "",
            orgpersonname: data.contactPerson || "",
            orgphonenumber: data.phoneNumber || "",
            orgaccnumber: data.accountNumber || "",
            orgbban: data.BBAN || "",
            orgbussdocument: data.businessDocument || "",
            orgidDocument: data.document || "",
            eventname: data.venueDetails.map((o) => o.eventName),
            eventtime: data.venueDetails.map((o) => o.time),
            eventduration: data.duration || "",
            eventage: data.ageLimit || "",
            eventlang: data.language || "",
            flyerimage: data.eventImages || [],
            venueDetails: data.venueDetails.map((venue) => ({
              venueName: venue.venueName,
              address: venue.address,
              date: venue.date,
              location: venue.location,
              time: venue.time,
              ticket: venue.ticket.map((ticket) => ({
                team: ticket.team,
                price: ticket.price,
              })),
            })),
          };

          // Set the default values in the form
          Object.keys(defaultValues).forEach((key) =>
            setValue(key, defaultValues[key])
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
  }, [eventId]);

const onSubmit = async (data) => {
  setLoading(true);
  const formData = new FormData();

  // Attach both existing and newly added flyer images
  const combinedImages = [...flyerImages, ...selectedImageFiles]; // Combine both existing and new images
  combinedImages.forEach((image) => {
    formData.append("flyerimage", image);
  });

  // Collect venue details
const remainingTicketsIndex = { index: 0 }; // To keep track of position in allRemainingTickets

const venueDetailsArray = data.venueDetails.map((venue, venueIdx) => {
  return {
    ...venue,
    ticket: venue.ticket.map((ticket, ticketIdx) => {
      const remaining_Ticket = allRemainingTickets[remainingTicketsIndex.index];
      remainingTicketsIndex.index += 1; // move to next
      return {
        team: ticket.team,
        price: ticket.price,
        remaining_Ticket: remaining_Ticket !== undefined ? remaining_Ticket : 0,
        _id: ticket._id || undefined,
      };
    }),
  };
});

  // Log venueDetailsArray
  console.log("Venue Details Array:", venueDetailsArray);

  // Append venueDetails as JSON
  formData.append("venueDetails", JSON.stringify(venueDetailsArray));

  // Append other fields to FormData
  Object.keys(data).forEach((key) => {
    if (key !== "venueDetails") {
      // Avoid double submitting venueDetails
      formData.append(key, data[key]);
    }
  });

  // Append additional data
  formData.append("aboutEvent", editorData);
  formData.append("terms_Condition", editorData1);
  formData.append("eventId", eventId);

  // Log entire FormData content
  // Since FormData is not directly printable, we can iterate over it
  console.log("FormData contents:");
  for (let pair of formData.entries()) {
    console.log(pair[0] + ": ", pair[1]);
  }

  // Proceed with API call
  try {
    await dispatch(
      UpdateEventsApi(formData, (resp) => {
        if (resp.status === true) {
          Notiflix.Notify.success("Updated successfully.");
          router.push(`/events/${eventId}`);
        } else {
          Notiflix.Notify.warning("Update failed.");
        }
      })
    );
  } catch (error) {
    Notiflix.Notify.failure("An error occurred during the update.");
    console.error("Update error:", error);
  }

  setLoading(false);
};

  return (
    <Container fluid className="p-6 event-id">
      <div className="approve-btn-head-div">
        <div className="go_back">
          <i
            className={`nav-icon fe fe-arrow-left-circle me-2 text-white`}
            onClick={() => router.back()}
          ></i>
          <PageHeading heading="Event Overview" />
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row className="mb-8">
          <Col xl={6}>
            <Card className="h-100">
              <Card.Body>
                <h3 className="mb-4 fw-bold text-black">
                  Organization/Individual Details{" "}
                </h3>
                {[
                  "orgdate",
                  "orgname",
                  "orgcategory",
                  "orgpersonname",
                  "orgphonenumber",
                  "orgaccnumber",
                  "orgbban",
                  "orgbussdocument",
                  "orgidDocument",
                ].map((field, index) => (
                  <Row key={index} className="mb-3 align-items-center">
                    <p className="col-sm-4 mb-0 fw-bold text-black">
                      {field
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </p>
                    <Col md={8}>
                      <Controller
                        name={field}
                        control={control}
                        render={({ field }) => (
                          <Form.Control
                            type={
                              field === "orgphonenumber" ||
                              field === "orgaccnumber"
                                ? "number"
                                : "text"
                            }
                            {...field}
                          />
                        )}
                      />
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>
          </Col>
          <Col xl={6}>
            <Card className="h-100">
              <Card.Body>
                <h3 className="mb-4 fw-bold text-black">Event Details </h3>
                {eventsDetails.map((o, i) => (
                  <div key={o?._id}>
                    <Row className="mb-3 align-items-center">
                      <p className="col-sm-4 mb-0 fw-bold text-black">
                        Event {i + 1}:
                      </p>
                      <Col md={8}>
                        <Controller
                          name={`eventname.${i}`}
                          control={control}
                          render={({ field }) => (
                            <Form.Control type="text" {...field} />
                          )}
                        />
                      </Col>
                    </Row>
                    <Row className="mb-3 align-items-center">
                      <p className="col-sm-4 mb-0 fw-bold text-black">Time:</p>
                      <Col md={8}>
                        <Controller
                          name={`eventtime.${i}`}
                          control={control}
                          render={({ field }) => (
                            <Form.Control type="text" {...field} />
                          )}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
                <Row className="mb-3 align-items-center">
                  <p className="col-sm-4 mb-0 fw-bold text-black">Duration:</p>
                  <Col md={8}>
                    <Controller
                      name="eventduration"
                      control={control}
                      render={({ field }) => (
                        <Form.Control type="text" {...field} />
                      )}
                    />
                  </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                  <p className="col-sm-4 mb-0 fw-bold text-black">Age Limit:</p>
                  <Col md={8}>
                    <Controller
                      name="eventage"
                      control={control}
                      render={({ field }) => (
                        <Form.Control type="number" {...field} />
                      )}
                    />
                  </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                  <p className="col-sm-4 mb-0 fw-bold text-black">Language:</p>
                  <Col md={8}>
                    <Controller
                      name="eventlang"
                      control={control}
                      render={({ field }) => (
                        <Form.Control type="text" {...field} />
                      )}
                    />
                  </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                  <p className="col-sm-4 mb-0 fw-bold text-black">
                    About Event:
                  </p>
                  <Col md={8}>
                    <CustomEditor
                      handleEditorChange={setEditorData}
                      editorblogdata={editorData}
                    />
                  </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                  <p className="col-sm-4 mb-0 fw-bold text-black">
                    Terms & Conditions:
                  </p>
                  <Col md={8}>
                    <CustomEditor
                      handleEditorChange={setEditorData1}
                      editorblogdata={editorData1}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="mb-8">
          <Col xl={6}>
            <Card>
              <Card.Body>
                <h3 className="mb-4 fw-bold text-black">Flyer Banner</h3>
                <Row className="mb-3 align-items-center">
                  <Col md={8}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="form-control"
                    />
                    {errors.flyerimage && (
                      <p style={{ color: "red" }}>
                        {errors.flyerimage.message}
                      </p>
                    )}
                  </Col>
                </Row>
                <Row>
                  {flyerImages.map((img, index) => (
                    <Col
                      lg={4}
                      md={6}
                      sm={12}
                      key={index}
                      className="mb-3 position-relative"
                    >
                      <img
                        src={img}
                        alt={`flyer-${index}`}
                        width={200}
                        height={120}
                        className="img-fluid"
                      />
                      <Button
                        variant="danger"
                        className="position-absolute bottom-0 end-0"
                        onClick={() => handleRemoveImage(index)}
                      >
                        Remove
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={6}>
            <Card>
              <Card.Body>
                <h3 className="mb-4 fw-bold text-black">Venue Details</h3>
                {eventsDetails.map((venue, i) => (
                  <div key={venue._id}>
                    <h4 className="mb-4 fw-bold text-black">
                      <MdStars style={{ color: "#69043c" }} /> Venue {i + 1}
                    </h4>
                    {["venueName", "address", "date", "location", "time"].map(
                      (field, idx) => (
                        <Row className="mb-3 align-items-center" key={idx}>
                          <p className="col-sm-4 mb-0 fw-bold text-black">
                            {field
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                            :
                          </p>
                          <Col md={8}>
                            <Controller
                              name={`venueDetails.${i}.${field}`}
                              control={control}
                              render={({ field }) => (
                                <Form.Control type="text" {...field} />
                              )}
                            />
                          </Col>
                        </Row>
                      )
                    )}
                    {/* Add Ticket Details */}
                    <h5 className="mt-3">Ticket Details:</h5>
                    {venue.ticket.map((ticket, j) => (
                      <Row key={ticket._id} className="mb-3 align-items-center">
                        <Col md={6}>
                          <Controller
                            name={`venueDetails.${i}.ticket[${j}].team`}
                            control={control}
                            defaultValue={ticket.team}
                            render={({ field }) => (
                              <Form.Control
                                type="text"
                                {...field}
                                placeholder="Ticket Team"
                              />
                            )}
                          />
                        </Col>
                        <Col md={6}>
                          <Controller
                            name={`venueDetails.${i}.ticket[${j}].price`}
                            control={control}
                            defaultValue={ticket.price}
                            render={({ field }) => (
                              <Form.Control
                                type="number"
                                {...field}
                                placeholder="Ticket Price"
                              />
                            )}
                          />
                        </Col>
                      </Row>
                    ))}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div className="d-flex justify-content-center align-items-center w-100">
          <Button type="submit" className="bg-success p-2" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default UpdateEvents;

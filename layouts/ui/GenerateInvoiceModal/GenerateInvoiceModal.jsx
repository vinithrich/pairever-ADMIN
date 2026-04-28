import { NewGenerateInvoiceApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import Notiflix from "notiflix";

const tamilNaduDistricts = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivagangai",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const GenerateInvoiceModal = (props) => {
  const GSTNumber = props?.GSTNumber;
  const shipToadress = props?.shiptoaddress;
  const existingInvoices = props?.invoices || [];
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const submittedMonths = existingInvoices.map(
    (inv) => `${inv.year}-${inv.month}`
  );

  // Generate last 5 years dynamically
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const schema = yup.object().shape({
    shipTo: yup.string().required("Ship to is required"),
    year: yup.string().required("Select year is required"),
    month: yup.string().required("Select month is required"),
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipTo: props?.shiptoaddress || "",
      year: currentYear.toString(),
      month: "",
    },
  });

  const selectedYear = watch("year");

  useEffect(() => {
    if (props?.shiptoaddress) {
      setValue("shipTo", props.shiptoaddress);
    }
  }, [props?.shiptoaddress, setValue]);

  const onSubmit = async (data) => {
    const params = {
      shipTo: data.shipTo,
      GSTNumber: GSTNumber,
      month: data.month,
      year: data.year,
    };

    await dispatch(
      NewGenerateInvoiceApi(params, async (resp) => {
        if (resp.status === true) {
          Notiflix.Notify.success("Invoice Generated Succesfully");
          Notiflix.Confirm.show(
            "Invoice Generated Successfully ✅",
            `
          Do you want to view or download the invoice PDF?
          `,
            `🔎 View PDF`,
            `Download PDF`,
            function okCb() {
              window.open(resp.fileUrl, "_blank");
            },
            function cancelCb() {
              const a = document.createElement("a");
              a.href = resp.fileUrl;
              a.download = "invoice.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          );
          if (props.onInvoiceGenerated) {
            props.onInvoiceGenerated();
          }
          setLoading(false);
          props.onHide();
        } else {
          setLoading(false);
        }
      })
    );
  };

  return (
    <Modal {...props} size="lg" centered>
      <Modal.Header closeButton>
        <h3 className="mb-0 fw-bold" style={{ color: "#2b0b47" }}>
          Generate Invoice
        </h3>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Year */}
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0">Select Year :</Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors.year}>
                    <option value="" hidden>
                      Select year
                    </option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.year?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          {/* Month */}
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0">Select Month :</Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors.month}>
                    <option value="" hidden>
                      Select month
                    </option>
                    {months.map((m, index) => {
                      const value = `${m}`;
                      const isSubmitted = submittedMonths.includes(
                        `${selectedYear}-${m}`
                      );
                      const isFutureMonth =
                        selectedYear == currentYear &&
                        index > currentMonthIndex;

                      return (
                        <option
                          key={index}
                          value={value}
                          disabled={isSubmitted || isFutureMonth}
                        >
                          {m} {selectedYear}{" "}
                          {isSubmitted
                            ? `(Already Submitted ${selectedYear})`
                            : ""}
                          {isFutureMonth ? "(Future Month)" : ""}
                        </option>
                      );
                    })}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.month?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          {/* Ship To */}
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0">Ship to:</Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="shipTo"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Enter name/address"
                    {...field}
                    isInvalid={!!errors.shipTo}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.shipTo?.message}
              </Form.Control.Feedback>
            </Col>
          </Row>

          {/* Submit */}
          <Row className="mt-4">
            <Col className="text-end">
              {loading ? (
                <Button variant="primary" disabled>
                  <Spinner animation="border" size="sm" /> Generating...
                </Button>
              ) : (
                <Button variant="primary" type="submit">
                  Generate
                </Button>
              )}
            </Col>
          </Row>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default GenerateInvoiceModal;

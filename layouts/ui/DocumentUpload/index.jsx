import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as yup from "yup";

const DocumentUploadModal = (props) => {
  const GSTNumber = props?.GSTNumber;
  console.log("GSTNumber :>> ", GSTNumber);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 11 = Dec

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

  const previousMonths = months
    .map((month, index) => {
      const monthNumber = String(index + 1).padStart(2, "0"); // ✅ 01–12
      return {
        label: `${month} ${currentYear}`,
        value: `${currentYear}-${monthNumber}`,
        index,
      };
    })
    // ✅ keep only past months (before currentMonth)
    .filter((m) => m.index < currentMonth)
    .reverse();

  const schema = yup.object().shape({
    GST: yup.mixed().required("GST is required"),
    IT: yup.mixed().required("IT is required"),
    LWF: yup.mixed().required("LWF is required"),
    month: yup.string().required("month is required"),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      GST: "",
      IT: "",
      LWF: "",
      month: "",
    },
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("GST", data.GST);
    formData.append("IT", data.IT);
    formData.append("LWF", data.LWF);
    formData.append("month", data.month);
    formData.append("GSTNumber", GSTNumber);

    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
  };

  return (
    <Modal {...props} size="lg" centered>
      <Modal.Header closeButton>
        <h3 className="mb-0 fw-bold" style={{ color: "#2b0b47" }}>
          Upload Acknowledgement
        </h3>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Union */}
          <Row className="mb-3 align-items-center">
            <Form.Label className="col-sm-4 mb-0" htmlFor="blogurl">
              Select Month :
            </Form.Label>
            <Col md={8} xs={12}>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Form.Select
                    type="text"
                    {...field}
                    isInvalid={!!errors.categorytitle}
                  >
                    <option value="" selected hidden>
                      Select month
                    </option>
                    {previousMonths?.map((opt) => (
                      <option key={opt.value} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              {errors.categoryurl && (
                <Form.Control.Feedback type="invalid">
                  {errors.categoryurl.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          <Row className="mb-4">
            <Form.Label className="col-4">GST :</Form.Label>
            <Col lg={8}>
              <Controller
                name="GST"
                control={control}
                render={({ field: { onChange, onBlur, ref } }) => (
                  <Form.Control
                    type="file"
                    accept="application/pdf" // ✅ only PDF
                    onBlur={onBlur}
                    ref={ref}
                    onChange={(e) => onChange(e.target.files[0])} // ✅ store file object
                    isInvalid={!!errors.GST}
                  />
                )}
              />
              {errors.GST && (
                <Form.Control.Feedback type="invalid">
                  {errors.GST.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* Panjayat Name */}
          <Row className="mb-4">
            <Form.Label className="col-4">IT:</Form.Label>
            <Col lg={8}>
              <Controller
                name="IT"
                control={control}
                render={({ field: { onChange, onBlur, ref } }) => (
                  <Form.Control
                    type="file"
                    accept="application/pdf"
                    onBlur={onBlur}
                    ref={ref}
                    onChange={(e) => onChange(e.target.files[0])}
                    isInvalid={!!errors.IT}
                  />
                )}
              />
              {errors.IT && (
                <Form.Control.Feedback type="invalid">
                  {errors.IT.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* GST Number */}
          <Row className="mb-4">
            <Form.Label className="col-4">LWF :</Form.Label>
            <Col lg={8}>
              <Controller
                name="LWF"
                control={control}
                render={({ field: { onChange, onBlur, ref } }) => (
                  <Form.Control
                    type="file"
                    accept="application/pdf"
                    onBlur={onBlur}
                    ref={ref}
                    onChange={(e) => onChange(e.target.files[0])}
                    isInvalid={!!errors.LWF}
                  />
                )}
              />
              {errors.LWF && (
                <Form.Control.Feedback type="invalid">
                  {errors.LWF.message}
                </Form.Control.Feedback>
              )}
            </Col>
          </Row>

          {/* Submit */}
          <Row className="mt-4">
            <Col className="text-end">
              {loading ? (
                <Button variant="primary" disabled>
                  <Spinner animation="border" size="sm" /> Uploading...
                </Button>
              ) : (
                <Button variant="primary" type="submit">
                  Upload
                </Button>
              )}
            </Col>
          </Row>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default DocumentUploadModal;

import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Col, Row, Container, Form, Card } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { GetSinglePaymentApi } from "@/helper/Redux/ReduxThunk/Homepage";
import { formatDate } from "@/helper/apiHelper";

const SinglePaymentHistory = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const userid = router.query.id;

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoback = () => router.back();

  const schema = yup.object().shape({
    idType: yup.string().required("idType is required"),
    idValue: yup.string().required("idValue is required"),
    productId: yup.string().required("productId is required"),
    mpin: yup.string().required("mpin is required"),
    tpin: yup.string().required("tpin is required"),
    region: yup.string().required("region is required"),
    regionName: yup.string().required("regionName is required"),
    city: yup.string().required("city is required"),
  });

  const {
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const fetchUserData = async () => {
    if (!userid) return;
    const obj = { id: userid };
    setLoading(true);
    await dispatch(
      GetSinglePaymentApi(obj, (resp) => {
        setHistoryData(resp?.data);
        setLoading(false);
      })
    );
  };

  useEffect(() => {
    fetchUserData();
  }, [userid]);

  useEffect(() => {
    if (historyData) {
      reset({
        idType: historyData?.transactor?.idType || "",
        idValue: historyData?.transactor?.idValue || "",
        productId: historyData?.transactor?.productId || "",
        mpin: historyData?.transactor?.mpin || "",
        tpin: historyData?.transactor?.tpin || "",
        receiveridType: historyData?.sender?.idType || "",
        receiveridValue: historyData?.sender?.idValue || "",
        receiverproductId: historyData?.sender?.productId || "",
        serviceCode: historyData?.serviceCode || "",
        bearerCode: historyData?.bearerCode || "",
        language: historyData?.language || "",
        initiator: historyData?.initiator || "",
        transactionAmount: historyData?.transactionAmount || "",
        currency: historyData?.currency || "",
        externalReferenceId: historyData?.externalReferenceId || "",
        source: historyData?.source || "",
        remarks: historyData?.remarks || "",
        transactionMode: historyData?.transactionMode || "",
        txnStatus: historyData?.txnStatus || "",
        serviceRequestId: historyData?.serviceRequestId || "",
        mfsTenantId: historyData?.mfsTenantId || "",
        serviceFlow: historyData?.serviceFlow || "",
        message: historyData?.message || "",
        transactionId: historyData?.transactionId || "",
        originalServiceRequestId: historyData?.originalServiceRequestId || "",
        status: historyData?.status || "",
        createdAt: historyData?.createdAt
          ? formatDate(historyData.createdAt)
          : "",
      });
    }
  }, [historyData, reset]);

  return (
    <div>
      <Container fluid className="p-6">
        <div className="go_back">
          <i
            className="nav-icon fe fe-arrow-left-circle me-2 text-white"
            onClick={handleGoback}
          ></i>
          <PageHeading heading="Payment History Details" />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <Row className="mb-8">
            <Col xl={12}>
              <Card>
                <Card.Body>
                  {[
                    { label: "Date & Time", name: "createdAt" },
                    { label: "Transaction status", name: "status" },
                    { label: "bearerCode", name: "bearerCode" },
                    { label: "transactionAmount", name: "transactionAmount" },
                    { label: "currency", name: "currency" },
                    {
                      label: "externalReferenceId",
                      name: "externalReferenceId",
                    },
                    { label: "serviceRequestId", name: "serviceRequestId" },
                    { label: "mfsTenantId", name: "mfsTenantId" },
                    { label: "transactionId", name: "transactionId" },
                    {
                      label: "originalServiceRequestId",
                      name: "originalServiceRequestId",
                    },
                  ].map((field) => (
                    <Row className="mb-3 align-items-center" key={field.name}>
                      <Form.Label className="col-sm-4 mb-0">
                        {field.label}:
                      </Form.Label>
                      <Col md={8}>
                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field }) => (
                            <Form.Control
                              type="text"
                              placeholder={`Enter ${field.label}`}
                              {...field}
                            />
                          )}
                        />
                        {errors[field.name] && (
                          <span className="text-danger">
                            {errors[field.name]?.message}
                          </span>
                        )}
                      </Col>
                    </Row>
                  ))}

                  <h4>Sender</h4>

                  {[
                    { label: "idType", name: "receiveridType" },
                    { label: "idValue", name: "receiveridValue" },
                    { label: "productId", name: "receiverproductId" },
                  ].map((field) => (
                    <Row className="mb-3 align-items-center" key={field.name}>
                      <Form.Label className="col-sm-4 mb-0">
                        {field.label}:
                      </Form.Label>
                      <Col md={8}>
                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field }) => (
                            <Form.Control
                              type="text"
                              placeholder={`Enter ${field.label}`}
                              {...field}
                            />
                          )}
                        />
                        {errors[field.name] && (
                          <span className="text-danger">
                            {errors[field.name]?.message}
                          </span>
                        )}
                      </Col>
                    </Row>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default SinglePaymentHistory;

import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import {
  GetPaymentGatewayListApi,
  SavePaymentGatewayApi,
  UpdateActivePaymentGatewayApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const emptyGatewayForm = {
  gatewayId: "",
  provider: "Razorpay",
  accountName: "",
  razorpayAccountId: "",
  keyId: "",
  keySecret: "",
  webhookSecret: "",
  cashfreeAppId: "",
  cashfreeSecretKey: "",
  cashfreeApiVersion: "2023-08-01",
  mode: "Live",
  description: "",
  isActive: false,
};

const PROVIDERS = ["Razorpay", "Cashfree"];

const isCashfreeProvider = (provider) =>
  String(provider || "").toLowerCase() === "cashfree";

const getProviderCredentialLabel = (gateway) =>
  isCashfreeProvider(gateway?.provider) ? "App ID" : "Key ID";

const getProviderCredentialValue = (gateway) =>
  isCashfreeProvider(gateway?.provider)
    ? gateway?.cashfreeAppId || "-"
    : gateway?.keyId || "-";

const normalizeGateway = (gateway, index) => {
  const provider = gateway?.provider || gateway?.gateway || "Razorpay";
  const id =
    gateway?._id ||
    gateway?.id ||
    gateway?.gatewayId ||
    gateway?.razorpayAccountId ||
    gateway?.cashfreeAppId ||
    gateway?.appId ||
    gateway?.accountId ||
    `${provider.toLowerCase()}-${index + 1}`;

  return {
    ...gateway,
    id,
    accountName:
      gateway?.accountName ||
      gateway?.name ||
      gateway?.title ||
      `${provider} Account ${index + 1}`,
    provider,
    keyId: gateway?.keyId || gateway?.razorpayKeyId || gateway?.key_id || "-",
    razorpayAccountId:
      gateway?.razorpayAccountId || gateway?.accountId || gateway?.account_id || "",
    webhookSecret:
      gateway?.webhookSecret || gateway?.razorpayWebhookSecret || "",
    cashfreeAppId:
      gateway?.cashfreeAppId || gateway?.appId || gateway?.clientId || "",
    cashfreeSecretKey:
      gateway?.cashfreeSecretKey || gateway?.secretKey || gateway?.clientSecret || "",
    cashfreeApiVersion:
      gateway?.cashfreeApiVersion || gateway?.apiVersion || "2023-08-01",
    description: gateway?.description || gateway?.notes || "",
    mode: gateway?.mode || gateway?.environment || "Live",
    active:
      gateway?.active === true ||
      gateway?.isActive === true ||
      gateway?.status === "active",
    status: gateway?.status || (gateway?.isActive ? "active" : "inactive"),
    lastUpdated: gateway?.updatedAt || gateway?.createdAt || "",
  };
};

const formatDateTime = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const PaymentGatewayManagement = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [gateways, setGateways] = useState([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingGatewayId, setSavingGatewayId] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [gatewayForm, setGatewayForm] = useState(emptyGatewayForm);

  const handleGoBack = () => router.back();

  const activeGateway = useMemo(
    () => gateways.find((gateway) => gateway.active),
    [gateways]
  );

  const selectedGateway = useMemo(
    () => gateways.find((gateway) => gateway.id === selectedGatewayId),
    [gateways, selectedGatewayId]
  );

  const loadPaymentGateways = useCallback(async () => {
    setLoading(true);

    await dispatch(
      GetPaymentGatewayListApi((resp) => {
        if (resp?.status || resp?.success) {
          const list =
            resp?.data?.gateways ||
            resp?.data?.paymentGateways ||
            resp?.data ||
            resp?.gateways ||
            [];
          const normalizedList = Array.isArray(list)
            ? list.map(normalizeGateway)
            : [];

          setGateways(normalizedList);
          setSelectedGatewayId(
            normalizedList.find((gateway) => gateway.active)?.id ||
              normalizedList[0]?.id ||
              ""
          );
        } else {
          setGateways([]);
          setSelectedGatewayId("");
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch payment gateways"
          );
        }

        setLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    loadPaymentGateways();
  }, [loadPaymentGateways]);

  const fillGatewayForm = (gateway) => {
    if (!gateway) {
      setGatewayForm(emptyGatewayForm);
      return;
    }

    setGatewayForm({
      gatewayId: gateway.id || "",
      provider: gateway.provider || "Razorpay",
      accountName: gateway.accountName || "",
      razorpayAccountId: gateway.razorpayAccountId || "",
      keyId: gateway.keyId === "-" ? "" : gateway.keyId || "",
      keySecret: "",
      webhookSecret: gateway.webhookSecret || "",
      cashfreeAppId: gateway.cashfreeAppId || "",
      cashfreeSecretKey: "",
      cashfreeApiVersion: gateway.cashfreeApiVersion || "2023-08-01",
      mode: gateway.mode || "Live",
      description: gateway.description || "",
      isActive: Boolean(gateway.active),
    });
  };

  const handleFormChange = (event) => {
    const { name, type, checked, value } = event.target;

    setGatewayForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewGateway = () => {
    setSelectedGatewayId("");
    setGatewayForm(emptyGatewayForm);
  };

  const handleSaveGateway = async (event) => {
    event.preventDefault();

    if (!gatewayForm.accountName.trim()) {
      Notiflix.Notify.failure("Account name is required");
      return;
    }

    if (!isCashfreeProvider(gatewayForm.provider) && !gatewayForm.keyId.trim()) {
      Notiflix.Notify.failure("Razorpay Key ID is required");
      return;
    }

    if (
      isCashfreeProvider(gatewayForm.provider) &&
      !gatewayForm.cashfreeAppId.trim()
    ) {
      Notiflix.Notify.failure("Cashfree App ID is required");
      return;
    }

    setSavingDetails(true);

    await dispatch(
      SavePaymentGatewayApi(
        {
          gatewayId: gatewayForm.gatewayId,
          paymentGatewayId: gatewayForm.gatewayId,
          accountName: gatewayForm.accountName,
          razorpayAccountId: gatewayForm.razorpayAccountId,
          keyId: gatewayForm.keyId,
          keySecret: gatewayForm.keySecret,
          webhookSecret: gatewayForm.webhookSecret,
          cashfreeAppId: gatewayForm.cashfreeAppId,
          cashfreeSecretKey: gatewayForm.cashfreeSecretKey,
          cashfreeApiVersion: gatewayForm.cashfreeApiVersion,
          appId: gatewayForm.cashfreeAppId,
          secretKey: gatewayForm.cashfreeSecretKey,
          apiVersion: gatewayForm.cashfreeApiVersion,
          mode: gatewayForm.mode,
          description: gatewayForm.description,
          provider: gatewayForm.provider,
          gateway: gatewayForm.provider,
          isActive: Boolean(gatewayForm.isActive),
        },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(`${gatewayForm.provider} account details saved`);
            loadPaymentGateways();
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to save payment gateway details"
            );
          }

          setSavingDetails(false);
        }
      )
    );
  };

  const handleSetActive = async (gateway) => {
    if (!gateway?.id || gateway.active || savingGatewayId) {
      return;
    }

    setSavingGatewayId(gateway.id);

    await dispatch(
      UpdateActivePaymentGatewayApi(
        {
          gatewayId: gateway.id,
          paymentGatewayId: gateway.id,
          razorpayAccountId: gateway.razorpayAccountId || "",
          cashfreeAppId: gateway.cashfreeAppId || "",
          appId: gateway.cashfreeAppId || "",
          provider: gateway.provider,
          isActive: true,
        },
        (resp) => {
          if (resp?.status || resp?.success) {
            Notiflix.Notify.success(
              `${gateway.accountName} is now active payment gateway`
            );
            loadPaymentGateways();
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to update payment gateway"
            );
          }

          setSavingGatewayId("");
        }
      )
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
        ></i>
        <PageHeading heading="Payment Gateway Management" />
      </div>

      <Row className="mt-4">
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <h4 className="mb-0">Active Gateway</h4>
                {activeGateway ? <Badge bg="success">Live</Badge> : null}
              </div>

              {loading ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>Loading...</span>
                </div>
              ) : activeGateway ? (
                <>
                  <div className="fw-bold fs-4">{activeGateway.accountName}</div>
                  <div className="text-muted mt-1">{activeGateway.provider}</div>
                  <div className="border-top mt-4 pt-3">
                    <div className="text-muted small">
                      {getProviderCredentialLabel(activeGateway)}
                    </div>
                    <div className="fw-semibold">
                      {getProviderCredentialValue(activeGateway)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-muted small">Last Updated</div>
                    <div className="fw-semibold">
                      {formatDateTime(activeGateway.lastUpdated)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted">No active gateway selected.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Form className="d-flex flex-wrap align-items-end gap-3">
                <div className="flex-grow-1">
                  <Form.Label className="fw-bold">Switch Active Gateway Account</Form.Label>
                  <Form.Select
                    value={selectedGatewayId}
                    onChange={(event) => setSelectedGatewayId(event.target.value)}
                    disabled={loading || gateways.length === 0}
                  >
                    {gateways.length === 0 ? (
                      <option value="">No accounts found</option>
                    ) : (
                      gateways.map((gateway) => (
                        <option key={gateway.id} value={gateway.id}>
                          {gateway.provider} - {gateway.accountName}
                          {gateway.active ? " - Active" : ""}
                        </option>
                      ))
                    )}
                  </Form.Select>
                </div>

                <Button
                  type="button"
                  variant="outline-primary"
                  onClick={() => fillGatewayForm(selectedGateway)}
                  disabled={!selectedGateway || loading}
                >
                  Edit Details
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSetActive(selectedGateway)}
                  disabled={
                    !selectedGateway ||
                    selectedGateway.active ||
                    Boolean(savingGatewayId)
                  }
                >
                  {savingGatewayId ? "Updating..." : "Set Active"}
                </Button>

                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={loadPaymentGateways}
                  disabled={loading || Boolean(savingGatewayId)}
                >
                  Refresh
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} className="mb-4">
          <Card>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <h4 className="mb-0">Gateway Account Details</h4>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleNewGateway}
                  disabled={savingDetails}
                >
                  Add New
                </Button>
              </div>

              <Form onSubmit={handleSaveGateway}>
                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Label className="fw-bold">Provider</Form.Label>
                    <Form.Select
                      name="provider"
                      value={gatewayForm.provider}
                      onChange={handleFormChange}
                    >
                      {PROVIDERS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label className="fw-bold">Account Name</Form.Label>
                    <Form.Control
                      name="accountName"
                      value={gatewayForm.accountName}
                      onChange={handleFormChange}
                      placeholder={`${gatewayForm.provider} Account 1`}
                    />
                  </Col>

                  <Col md={4} className="mb-3">
                    <Form.Label className="fw-bold">Mode</Form.Label>
                    <Form.Select
                      name="mode"
                      value={gatewayForm.mode}
                      onChange={handleFormChange}
                    >
                      <option value="Live">Live</option>
                      <option value="Test">Test</option>
                    </Form.Select>
                  </Col>

                  {isCashfreeProvider(gatewayForm.provider) ? (
                    <>
                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Cashfree App ID</Form.Label>
                        <Form.Control
                          name="cashfreeAppId"
                          value={gatewayForm.cashfreeAppId}
                          onChange={handleFormChange}
                          placeholder="CF app id"
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Cashfree Secret Key</Form.Label>
                        <Form.Control
                          type="password"
                          name="cashfreeSecretKey"
                          value={gatewayForm.cashfreeSecretKey}
                          onChange={handleFormChange}
                          placeholder="Enter secret key"
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">API Version</Form.Label>
                        <Form.Control
                          name="cashfreeApiVersion"
                          value={gatewayForm.cashfreeApiVersion}
                          onChange={handleFormChange}
                          placeholder="2023-08-01"
                        />
                      </Col>
                    </>
                  ) : (
                    <>
                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Razorpay Account ID</Form.Label>
                        <Form.Control
                          name="razorpayAccountId"
                          value={gatewayForm.razorpayAccountId}
                          onChange={handleFormChange}
                          placeholder="acc_xxxxxxxxx"
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Key ID</Form.Label>
                        <Form.Control
                          name="keyId"
                          value={gatewayForm.keyId}
                          onChange={handleFormChange}
                          placeholder="rzp_live_xxxxxxxxx"
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Key Secret</Form.Label>
                        <Form.Control
                          type="password"
                          name="keySecret"
                          value={gatewayForm.keySecret}
                          onChange={handleFormChange}
                          placeholder="Enter key secret"
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Label className="fw-bold">Webhook Secret</Form.Label>
                        <Form.Control
                          type="password"
                          name="webhookSecret"
                          value={gatewayForm.webhookSecret}
                          onChange={handleFormChange}
                          placeholder="Enter webhook secret"
                        />
                      </Col>
                    </>
                  )}

                  <Col md={8} className="mb-3">
                    <Form.Label className="fw-bold">Description</Form.Label>
                    <Form.Control
                      name="description"
                      value={gatewayForm.description}
                      onChange={handleFormChange}
                      placeholder="Usage notes"
                    />
                  </Col>

                  <Col md={4} className="mb-3 d-flex align-items-end">
                    <Form.Check
                      type="checkbox"
                      name="isActive"
                      label="Make this account active"
                      checked={gatewayForm.isActive}
                      onChange={handleFormChange}
                    />
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleNewGateway}
                    disabled={savingDetails}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={savingDetails}>
                    {savingDetails ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Account</th>
                  <th>Provider</th>
                  <th>Credential</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      Loading payment gateways...
                    </td>
                  </tr>
                ) : gateways.length > 0 ? (
                  gateways.map((gateway, index) => (
                    <tr key={gateway.id}>
                      <td>{index + 1}</td>
                      <td className="fw-semibold">{gateway.accountName}</td>
                      <td>{gateway.provider}</td>
                      <td>
                        <div className="fw-semibold">
                          {getProviderCredentialValue(gateway)}
                        </div>
                        <div className="text-muted small">
                          {getProviderCredentialLabel(gateway)}
                        </div>
                      </td>
                      <td>{gateway.mode}</td>
                      <td>
                        {gateway.active ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td>{formatDateTime(gateway.lastUpdated)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => fillGatewayForm(gateway)}
                            disabled={savingDetails}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={gateway.active ? "outline-success" : "primary"}
                            disabled={gateway.active || Boolean(savingGatewayId)}
                            onClick={() => handleSetActive(gateway)}
                          >
                            {savingGatewayId === gateway.id
                              ? "Updating..."
                              : gateway.active
                              ? "Active"
                              : "Set Active"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No payment gateways found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentGatewayManagement;

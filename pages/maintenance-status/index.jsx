import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import {
  GetMaintenanceStatusApi,
  UpdateMaintenanceStatusApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const DEFAULT_MESSAGE = "App is under maintenance. Please try again later.";

const getMaintenanceStatusValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return Boolean(
    payload.maintenance_status ??
      payload.is_under_maintenance ??
      payload.maintenanceStatus ??
      payload.isUnderMaintenance
  );
};

const getMaintenanceMessageValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return payload.maintenance_message || payload.maintenanceMessage || "";
};

const MaintenanceStatusPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [currentStatus, setCurrentStatus] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [maintenanceStatus, setMaintenanceStatus] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_MESSAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMaintenanceStatus = useCallback(async () => {
    setIsLoading(true);

    await dispatch(
      GetMaintenanceStatusApi((resp) => {
        if (resp?.status) {
          const nextStatus = getMaintenanceStatusValue(resp?.data || resp);
          const nextMessage = getMaintenanceMessageValue(resp?.data || resp);

          setCurrentStatus(nextStatus);
          setCurrentMessage(nextMessage);
          setMaintenanceStatus(nextStatus);
          setMaintenanceMessage(nextMessage || DEFAULT_MESSAGE);
        } else {
          setCurrentStatus(false);
          setCurrentMessage("");
          setMaintenanceStatus(false);
          setMaintenanceMessage(DEFAULT_MESSAGE);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch maintenance status"
          );
        }

        setIsLoading(false);
      })
    );
  }, [dispatch]);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = maintenanceMessage.trim();

    if (maintenanceStatus && !trimmedMessage) {
      Notiflix.Notify.failure("Please enter maintenance message");
      return;
    }

    setIsSubmitting(true);

    await dispatch(
      UpdateMaintenanceStatusApi(
        {
          maintenance_status: maintenanceStatus,
          maintenance_message: trimmedMessage,
        },
        (resp) => {
          if (resp?.status) {
            const savedStatus =
              resp?.data && typeof resp.data === "object"
                ? getMaintenanceStatusValue(resp.data)
                : maintenanceStatus;
            const savedMessage =
              getMaintenanceMessageValue(resp?.data) || trimmedMessage;

            setCurrentStatus(savedStatus);
            setCurrentMessage(savedMessage);
            setMaintenanceStatus(savedStatus);
            setMaintenanceMessage(savedMessage || DEFAULT_MESSAGE);
            Notiflix.Notify.success(
              resp?.message || "Maintenance status updated successfully"
            );
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to update maintenance status"
            );
          }

          setIsSubmitting(false);
        }
      )
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Maintenance Status" />
      </div>

      <Row className="mt-4 justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="mb-4">
                <h4 className="mb-1">Manage App Maintenance</h4>
                <p className="text-muted mb-0">
                  Enable or disable app maintenance mode and update the message
                  shown to app users.
                </p>
              </div>

              <Alert
                variant={currentStatus ? "warning" : "success"}
                className="border"
              >
                <div className="small text-muted mb-1">Current status</div>
                <div className="fw-bold">
                  {isLoading
                    ? "Loading..."
                    : currentStatus
                      ? "Under maintenance"
                      : "Live"}
                </div>
                <hr className="my-3" />
                <div className="small text-muted mb-1">Current message</div>
                <div className="fw-bold text-break">
                  {isLoading ? "Loading..." : currentMessage || "Not available"}
                </div>
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Maintenance Mode</Form.Label>
                  <Form.Check
                    type="switch"
                    id="maintenance-status-switch"
                    label={maintenanceStatus ? "Enabled" : "Disabled"}
                    checked={maintenanceStatus}
                    onChange={(event) =>
                      setMaintenanceStatus(event.target.checked)
                    }
                    disabled={isLoading || isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Maintenance Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter message shown in the app"
                    value={maintenanceMessage}
                    onChange={(event) =>
                      setMaintenanceMessage(event.target.value)
                    }
                    disabled={isLoading || isSubmitting}
                  />
                  <Form.Text className="text-muted">
                    This message will be returned in the app update config API.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isLoading || isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Status"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fetchMaintenanceStatus}
                    disabled={isLoading || isSubmitting}
                  >
                    Refresh
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MaintenanceStatusPage;

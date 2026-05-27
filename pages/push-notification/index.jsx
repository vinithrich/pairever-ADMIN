import React, { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import { SendAdminPushApi } from "@/helper/Redux/ReduxThunk/Homepage";

const audienceTargets = [
  {
    value: "all",
    label: "All selected role",
    description: "Send to everyone in the selected role with a push token.",
  },
  {
    value: "free_coin_not_used",
    label: "Did not use free coin",
    description: "Users who still have not used their free coin offer.",
  },
  {
    value: "free_coin_used_no_deposit",
    label: "Used free coin, no deposit",
    description: "Users who used free coins but have not made a deposit yet.",
  },
  {
    value: "highest_deposit",
    label: "Highest deposit users",
    description: "Users with the highest successful deposit value.",
  },
  {
    value: "deposit_attempted",
    label: "Tried to deposit",
    description: "Users who started a deposit attempt.",
  },
  {
    value: "deposit_in_process",
    label: "Deposit in process",
    description: "Users with a pending or processing deposit.",
  },
];

const userAudienceValues = new Set(
  audienceTargets
    .map((target) => target.value)
    .filter((value) => value !== "all")
);

const PushNotificationPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audienceTarget: "all",
    roleTarget: "all",
    screen: "",
  });
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "roleTarget" && value !== "user"
        ? { audienceTarget: "all" }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = formData.title.trim();
    const body = formData.body.trim();
    const screen = formData.screen.trim();

    if (!title || !body) {
      Notiflix.Notify.failure("Please enter both title and message body");
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    await dispatch(
      SendAdminPushApi(
        {
          title,
          body,
          audienceTarget: formData.audienceTarget,
          userFilter: formData.audienceTarget,
          roleTarget: formData.roleTarget,
          ...(screen ? { screen } : {}),
        },
        (resp) => {
          const isSuccess = Boolean(resp?.success ?? resp?.status);

          if (isSuccess) {
            setResult({
              sent: resp?.sent ?? 0,
              failed: resp?.failed ?? 0,
            });
            Notiflix.Notify.success(resp?.message || "Push notification sent");
          } else {
            Notiflix.Notify.failure(
              resp?.message || "Failed to send push notification"
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
        <PageHeading heading="Push Notification" />
      </div>

      <Row className="mt-4 justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="mb-4">
                <h4 className="mb-1">Send Push Notification</h4>
                <p className="text-muted mb-0">
                  Broadcast a push notification to a selected role or user segment.
                </p>
              </div>

              {result ? (
                <Alert variant={result.failed > 0 ? "warning" : "success"}>
                  Sent: <b>{result.sent}</b> | Failed: <b>{result.failed}</b>
                </Alert>
              ) : null}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Enter notification title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="body"
                    placeholder="Enter notification message"
                    value={formData.body}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Role Target</Form.Label>
                  <Form.Select
                    name="roleTarget"
                    value={formData.roleTarget}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="all">All</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Audience Target</Form.Label>
                  <Form.Select
                    name="audienceTarget"
                    value={formData.audienceTarget}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {audienceTargets
                      .filter(
                        (target) =>
                          target.value === "all" ||
                          formData.roleTarget === "user"
                      )
                      .map((target) => (
                        <option key={target.value} value={target.value}>
                          {target.label}
                        </option>
                      ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.roleTarget === "user"
                      ? audienceTargets.find(
                          (target) => target.value === formData.audienceTarget
                        )?.description
                      : "User filters are available only when Role Target is User."}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Screen</Form.Label>
                  <Form.Control
                    type="text"
                    name="screen"
                    placeholder="Optional deep-link screen name"
                    value={formData.screen}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <Form.Text className="text-muted">
                    Optional. This will be sent as notification data.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Notification"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => {
                      setFormData({
                        title: "",
                        body: "",
                        audienceTarget: "all",
                        roleTarget: "all",
                        screen: "",
                      });
                      setResult(null);
                    }}
                  >
                    Clear
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

export default PushNotificationPage;

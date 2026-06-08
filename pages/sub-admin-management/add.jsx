import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Notiflix from "notiflix";
import * as apiHelper from "@/helper/apiHelper";

const ROLE_OPTIONS = [
  { value: "support", label: "Support" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "admin", label: "Admin" },
];

const ACCESS_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "userManagement", label: "User Management" },
  { key: "staffManagement", label: "Staff Management" },
  { key: "depositHistory", label: "Deposit History" },
  { key: "withdrawManagement", label: "Withdraw Management" },
  { key: "paymentsStructure", label: "Payments Structure" },
  { key: "paymentGateway", label: "Payment Gateway" },
  { key: "adBanner", label: "Ad Banner" },
  { key: "appUpdate", label: "App Update" },
  { key: "pushNotification", label: "Push Notification" },
  { key: "supportTickets", label: "Support Tickets" },
  { key: "reports", label: "Reports" },
  { key: "callHistory", label: "Call History" },
  { key: "chatAudit", label: "Chat Audit" },
  { key: "subAdminManagement", label: "Sub-Admin Management" },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  status: "active",
};

const CreateSubAdmin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [permissions, setPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccessCount = permissions.length;

  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((role) => role.value === formData.role)?.label || "",
    [formData.role]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (event) => {
    const { value, checked } = event.target;

    setPermissions((prev) =>
      checked ? [...prev, value] : prev.filter((permission) => permission !== value)
    );
  };

  const selectAllAccess = () => {
    setPermissions(ACCESS_OPTIONS.map((access) => access.key));
  };

  const clearAccess = () => {
    setPermissions([]);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Notiflix.Notify.failure("Please enter sub-admin name");
      return false;
    }

    if (!formData.email.trim()) {
      Notiflix.Notify.failure("Please enter email");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      Notiflix.Notify.failure("Please enter a valid email");
      return false;
    }

    if (!formData.role) {
      Notiflix.Notify.failure("Please select a role");
      return false;
    }

    if (formData.password.length < 6) {
      Notiflix.Notify.failure("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Notiflix.Notify.failure("Password and confirm password do not match");
      return false;
    }

    if (!permissions.length) {
      Notiflix.Notify.failure("Please give at least one access permission");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      roleName: roleLabel,
      status: formData.status,
      permissions,
      access: permissions,
    };

    setIsSubmitting(true);

    try {
      const response = await apiHelper.postRequest("createSubAdmin", payload);

      if (response?.status || response?.success) {
        Notiflix.Notify.success(response?.message || "Sub-admin created successfully");
        router.push("/sub-admin-management");
        return;
      }

      Notiflix.Notify.failure(response?.message || "Failed to create sub-admin");
    } catch (error) {
      Notiflix.Notify.failure(error?.message || "Failed to create sub-admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        ></i>
        <PageHeading heading="Create Sub-Admin" />
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col xl={5} lg={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">User Details</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter sub-admin name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select name="role" value={formData.role} onChange={handleChange}>
                    <option value="">Select role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Retype password"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={7} lg={12}>
            <Card>
              <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h5 className="mb-0">Access</h5>
                  <small className="text-muted">{selectedAccessCount} selected</small>
                </div>
                <div className="d-flex gap-2">
                  <Button type="button" variant="outline-primary" size="sm" onClick={selectAllAccess}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline-secondary" size="sm" onClick={clearAccess}>
                    Clear
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  {ACCESS_OPTIONS.map((access) => (
                    <Col md={6} key={access.key} className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id={`access-${access.key}`}
                        value={access.key}
                        checked={permissions.includes(access.key)}
                        onChange={handlePermissionChange}
                        label={access.label}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button type="button" variant="secondary" onClick={() => router.push("/sub-admin-management")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Sub-Admin"}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CreateSubAdmin;

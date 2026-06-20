import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import Notiflix from "notiflix";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import useUrlPageState from "@/hooks/useUrlPageState";
import { sortRows } from "@/helper/tableSort";
import * as apiHelper from "@/helper/apiHelper";

const PAGE_SIZE = 10;

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
  { key: "staffGifts", label: "Staff Gifts" },
  { key: "depositHistory", label: "Deposit History" },
  { key: "withdrawManagement", label: "Withdraw Management" },
  { key: "paymentsStructure", label: "Payments Structure" },
  { key: "paymentGateway", label: "Payment Gateway" },
  { key: "adBanner", label: "Ad Banner" },
  { key: "appUpdate", label: "App Update" },
  { key: "maintenanceStatus", label: "Maintenance Status" },
  { key: "pushNotification", label: "Push Notification" },
  { key: "supportTickets", label: "Support Tickets" },
  { key: "reports", label: "Reports" },
  { key: "callHistory", label: "Call History" },
  { key: "chatAudit", label: "Chat Audit" },
  { key: "subAdminManagement", label: "Sub-Admin Management" },
];

const INITIAL_EDIT_FORM = {
  name: "",
  email: "",
  role: "",
  status: "active",
};

const getRows = (response) =>
  response?.data?.docs ||
  response?.data?.items ||
  response?.data?.subAdmins ||
  response?.data ||
  response?.subAdmins ||
  [];

const SubAdminManagement = () => {
  const router = useRouter();
  const [subAdmins, setSubAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [editPermissions, setEditPermissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const fetchSubAdmins = useCallback(async () => {
    const queryString = new URLSearchParams({
      search: searchQuery,
      page: currentPage,
      limit: PAGE_SIZE,
    }).toString();

    setIsLoading(true);

    try {
      const response = await apiHelper.getRequest(`getSubAdminList?${queryString}`);

      if (response?.status || response?.success) {
        setSubAdmins(Array.isArray(getRows(response)) ? getRows(response) : []);
        setTotalPages(response?.pagination?.totalPages || response?.data?.totalPages || 1);
        return;
      }

      setSubAdmins([]);
      setTotalPages(1);
      Notiflix.Notify.failure(response?.message || "Failed to fetch sub-admins");
    } catch (error) {
      setSubAdmins([]);
      setTotalPages(1);
      Notiflix.Notify.failure(error?.message || "Failed to fetch sub-admins");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchSubAdmins();
  }, [fetchSubAdmins]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getAdminId = (admin) => admin?._id || admin?.id || "";

  const openEditModal = (admin) => {
    const permissions = admin.permissions || admin.access || [];
    const roleValue =
      ROLE_OPTIONS.find(
        (role) => role.value === admin.role || role.label === admin.roleName
      )?.value ||
      admin.role ||
      "";

    setEditingAdmin(admin);
    setEditForm({
      name: admin.name || admin.username || "",
      email: admin.email || "",
      role: roleValue,
      status: admin.status || (admin.isActive === false ? "inactive" : "active"),
    });
    setEditPermissions(Array.isArray(permissions) ? permissions : []);
  };

  const closeEditModal = () => {
    if (isSaving) {
      return;
    }

    setEditingAdmin(null);
    setEditForm(INITIAL_EDIT_FORM);
    setEditPermissions([]);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditPermissionChange = (event) => {
    const { value, checked } = event.target;

    setEditPermissions((prev) =>
      checked ? [...prev, value] : prev.filter((permission) => permission !== value)
    );
  };

  const validateEditForm = () => {
    if (!editForm.name.trim()) {
      Notiflix.Notify.failure("Please enter sub-admin name");
      return false;
    }

    if (!editForm.email.trim()) {
      Notiflix.Notify.failure("Please enter email");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
      Notiflix.Notify.failure("Please enter a valid email");
      return false;
    }

    if (!editForm.role) {
      Notiflix.Notify.failure("Please select a role");
      return false;
    }

    if (!editPermissions.length) {
      Notiflix.Notify.failure("Please give at least one access permission");
      return false;
    }

    return true;
  };

  const handleUpdateSubAdmin = async (event) => {
    event.preventDefault();

    if (!editingAdmin || !validateEditForm()) {
      return;
    }

    const subAdminId = getAdminId(editingAdmin);
    const roleLabel = ROLE_OPTIONS.find((role) => role.value === editForm.role)?.label || editForm.role;
    const payload = {
      id: subAdminId,
      adminId: subAdminId,
      subAdminId,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      roleName: roleLabel,
      status: editForm.status,
      permissions: editPermissions,
      access: editPermissions,
    };

    setIsSaving(true);

    try {
      const response = await apiHelper.postRequest("updateSubAdmin", payload);

      if (response?.status || response?.success) {
        Notiflix.Notify.success(response?.message || "Sub-admin updated successfully");
        setEditingAdmin(null);
        setEditForm(INITIAL_EDIT_FORM);
        setEditPermissions([]);
        fetchSubAdmins();
        return;
      }

      Notiflix.Notify.failure(response?.message || "Failed to update sub-admin");
    } catch (error) {
      Notiflix.Notify.failure(error?.message || "Failed to update sub-admin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubAdmin = async (admin) => {
    const subAdminId = getAdminId(admin);

    if (!subAdminId || deletingAdminId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${admin.name || admin.email || "this sub-admin"}?`
    );

    if (!isConfirmed) {
      return;
    }

    setDeletingAdminId(subAdminId);

    try {
      const response = await apiHelper.postRequest("deleteSubAdmin", {
        id: subAdminId,
        adminId: subAdminId,
        subAdminId,
      });

      if (response?.status || response?.success) {
        Notiflix.Notify.success(response?.message || "Sub-admin deleted successfully");

        if (subAdmins.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchSubAdmins();
        }

        return;
      }

      Notiflix.Notify.failure(response?.message || "Failed to delete sub-admin");
    } catch (error) {
      Notiflix.Notify.failure(error?.message || "Failed to delete sub-admin");
    } finally {
      setDeletingAdminId("");
    }
  };

  const sortedSubAdmins = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
      name: (admin) => admin.name || admin.username || "",
      email: (admin) => admin.email || "",
      role: (admin) => admin.roleName || admin.role || "",
      status: (admin) => admin.status || (admin.isActive === false ? "inactive" : "active"),
      permissions: (admin) => (admin.permissions || admin.access || []).length,
      createdAt: (admin) => admin.createdAt || "",
    };

    return sortRows(
      subAdmins.map((admin, index) => ({ ...admin, __index: index })),
      {
        ...sortConfig,
        getValue: (admin) => getValue[sortConfig.key]?.(admin, admin.__index) ?? "",
      }
    );
  }, [currentPage, sortConfig, subAdmins]);

  const paginate = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const renderStatus = (admin) => {
    const status = admin.status || (admin.isActive === false ? "inactive" : "active");
    const isActive = status === "active" || status === true;

    return (
      <Badge bg={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <PageHeading heading="Sub-Admin Management" />
        <Button onClick={() => router.push("/sub-admin-management/add")}>
          Add Sub-Admin
        </Button>
      </div>

      <div className="d-flex justify-content-between w-100 mt-4">
        <Form className="d-flex gap-3">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search name, email, or role"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </Form>
      </div>

      <Row className="mt-6">
        <Col md={12}>
          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th><SortableHeader label="S.No" sortKey="serialNumber" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Access" sortKey="permissions" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th><SortableHeader label="Created At" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedSubAdmins.length > 0 ? (
                  sortedSubAdmins.map((admin, index) => {
                    const permissions = admin.permissions || admin.access || [];

                    return (
                      <tr key={admin._id || admin.id || admin.email}>
                        <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td>{admin.name || admin.username || "-"}</td>
                        <td>{admin.email || "-"}</td>
                        <td>{admin.roleName || admin.role || "-"}</td>
                        <td>{Array.isArray(permissions) ? permissions.length : 0} permissions</td>
                        <td>{renderStatus(admin)}</td>
                        <td>
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => openEditModal(admin)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={deletingAdminId === getAdminId(admin)}
                              onClick={() => handleDeleteSubAdmin(admin)}
                            >
                              {deletingAdminId === getAdminId(admin) ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {isLoading ? "Loading sub-admins..." : "No Sub-Admins Found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
            />
          </Card>
        </Col>
      </Row>

      <Modal show={Boolean(editingAdmin)} onHide={closeEditModal} size="lg" centered>
        <Form onSubmit={handleUpdateSubAdmin}>
          <Modal.Header closeButton={!isSaving}>
            <Modal.Title>Edit Sub-Admin</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  >
                    <option value="">Select role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">Access</h5>
              <small className="text-muted">{editPermissions.length} selected</small>
            </div>

            <Row>
              {ACCESS_OPTIONS.map((access) => (
                <Col md={6} key={access.key} className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id={`edit-access-${access.key}`}
                    value={access.key}
                    checked={editPermissions.includes(access.key)}
                    onChange={handleEditPermissionChange}
                    disabled={isSaving}
                    label={access.label}
                  />
                </Col>
              ))}
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SubAdminManagement;

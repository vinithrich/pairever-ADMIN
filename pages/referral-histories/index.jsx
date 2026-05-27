import { PageHeading } from "@/widgets";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import TablePagination from "@/components/TablePagination";
import SortableHeader from "@/components/SortableHeader";
import { sortRows } from "@/helper/tableSort";
import { GetReferralHistoriesApi } from "@/helper/Redux/ReduxThunk/Homepage";
import Notiflix from "notiflix";

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

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value._id || value.id || "";
};

const getUserName = (user) => user?.name || user?.userName || "";

const getUserPhone = (user) => user?.phone || user?.userPhone || user?.mobile || "";

const getUserMemberId = (user) => user?.memberID || user?.memberId || "";

const getUserReferralCode = (user) =>
  user?.referralCode || user?.inviteCode || user?.code || "";

const getStatusBadge = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "credited") {
    return <span className="badge bg-success">Credited</span>;
  }

  if (normalizedStatus === "pending") {
    return <span className="badge bg-warning text-dark">Pending</span>;
  }

  if (normalizedStatus === "failed" || normalizedStatus === "rejected") {
    return <span className="badge bg-danger">{status}</span>;
  }

  return status ? <span className="badge bg-secondary">{status}</span> : "-";
};

const ReferralHistories = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [referralList, setReferralList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leadsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleGoBack = () => router.back();

  const getReferralDetails = useCallback(async () => {
    const queryParams = {
      search: searchQuery,
      page: currentPage,
      limit: leadsPerPage,
      status: statusFilter,
    };

    await dispatch(
      GetReferralHistoriesApi(queryParams, (resp) => {
        if (resp?.status) {
          setReferralList(resp.data || []);
          setTotalPages(resp.pagination?.totalPages || 1);
        } else {
          setReferralList([]);
          setTotalPages(1);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch referral histories"
          );
        }
      })
    );
  }, [currentPage, dispatch, leadsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    getReferralDetails();
  }, [getReferralDetails]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const paginate = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedReferrals = useMemo(() => {
    const getValue = {
      serialNumber: (_, index) => (currentPage - 1) * leadsPerPage + index + 1,
      inviter: (item) =>
        getUserName(item.inviter || item.inviterUser || item.inviterUserId) ||
        getIdValue(item.inviterUserId),
      invited: (item) =>
        getUserName(item.invitedUser || item.invited || item.invitedUserId) ||
        getIdValue(item.invitedUserId),
      inviterReferralCode: (item) =>
        item.inviterReferralCode ||
        getUserReferralCode(item.inviter || item.inviterUser),
      rewardCoins: (item) => item.rewardCoins ?? 0,
      status: (item) => item.status || "",
      createdAt: (item) => item.createdAt || "",
    };

    return sortRows(
      referralList.map((item, index) => ({ ...item, __index: index })),
      {
        ...sortConfig,
        getValue: (item) =>
          getValue[sortConfig.key]?.(item, item.__index) ?? "",
      }
    );
  }, [currentPage, leadsPerPage, referralList, sortConfig]);

  const renderUserCell = (user, fallbackId) => {
    const id = getIdValue(user) || fallbackId;
    const name = getUserName(user);
    const phone = getUserPhone(user);
    const memberID = getUserMemberId(user);
    const referralCode = getUserReferralCode(user);

    if (!name && !phone && !memberID) {
      return id || "-";
    }

    return (
      <div className="d-flex flex-column">
        {id ? (
          <Link href={`/user-management/${id}`} className="fw-semibold">
            {name || memberID || phone || id}
          </Link>
        ) : (
          <span className="fw-semibold">{name || memberID || phone}</span>
        )}
        <small className="text-muted">
          {[memberID, phone].filter(Boolean).join(" / ") || "-"}
        </small>
        {referralCode ? (
          <small className="text-muted">Code: {referralCode}</small>
        ) : null}
      </div>
    );
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
        ></i>
        <PageHeading heading="Referral Histories" />
      </div>

      <div className="d-flex justify-content-between w-100">
        <Form className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search name / phone / referral code"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Status</Form.Label>
            <ButtonGroup className="d-flex">
              <Button
                type="button"
                variant={statusFilter === "all" ? "primary" : "outline-primary"}
                onClick={() => handleStatusFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={
                  statusFilter === "credited" ? "primary" : "outline-primary"
                }
                onClick={() => handleStatusFilter("credited")}
              >
                Credited
              </Button>
              <Button
                type="button"
                variant={
                  statusFilter === "pending" ? "primary" : "outline-primary"
                }
                onClick={() => handleStatusFilter("pending")}
              >
                Pending
              </Button>
            </ButtonGroup>
          </div>
        </Form>
      </div>

      <Row className="mt-6">
        <Col md={12}>
          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>
                    <SortableHeader
                      label="S.No"
                      sortKey="serialNumber"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Inviter"
                      sortKey="inviter"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Invited User"
                      sortKey="invited"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Referral Code"
                      sortKey="inviterReferralCode"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Reward Coins"
                      sortKey="rewardCoins"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    <SortableHeader
                      label="Created At"
                      sortKey="createdAt"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedReferrals.length > 0 ? (
                  sortedReferrals.map((item, index) => {
                    const inviterUser =
                      item.inviter || item.inviterUser || item.inviterUserId;
                    const invitedUser =
                      item.invitedUser || item.invited || item.invitedUserId;

                    return (
                      <tr key={item._id || `${item.invitedUserId}-${index}`}>
                        <td>{(currentPage - 1) * leadsPerPage + index + 1}</td>
                        <td>
                          {renderUserCell(
                            inviterUser,
                            getIdValue(item.inviterUserId)
                          )}
                        </td>
                        <td>
                          {renderUserCell(
                            invitedUser,
                            getIdValue(item.invitedUserId)
                          )}
                        </td>
                        <td>
                          {item.inviterReferralCode ||
                            getUserReferralCode(item.inviter || item.inviterUser) ||
                            "-"}
                        </td>
                        <td>{item.rewardCoins ?? 0}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No referral histories found
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
    </Container>
  );
};

export default ReferralHistories;

import TablePagination from "@/components/TablePagination";
import Link from "next/link";
import useUrlPageState from "@/hooks/useUrlPageState";
import {
  GetAdminChatConversationsApi,
  GetAdminChatMessagesApi,
} from "@/helper/Redux/ReduxThunk/Homepage";
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
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
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

const getPersonName = (person) =>
  person?.name || person?.userName || person?.staffName || "-";

const getPersonMemberId = (person) =>
  person?.memberID || person?.memberId || person?.id || "";

const getPersonDetailId = (person) => person?._id || person?.id || "";

const renderPersonName = (person, type) => {
  const name = getPersonName(person);
  const id = getPersonDetailId(person);
  const href = type === "staff" ? `/staff-management/${id}` : `/user-management/${id}`;

  return id ? (
    <Link href={href} className="text-decoration-none fw-semibold">
      {name}
    </Link>
  ) : (
    <span className="fw-semibold">{name}</span>
  );
};

const getMessagePreview = (lastMessage) => {
  if (!lastMessage) return "-";

  if (lastMessage.messageType && lastMessage.messageType !== "text") {
    return `[${lastMessage.messageType}] ${lastMessage.message || ""}`.trim();
  }

  return lastMessage.message || "-";
};

const getPaginationTotalPages = (pagination) =>
  pagination?.totalPages ||
  pagination?.pages ||
  pagination?.totalPage ||
  pagination?.lastPage ||
  1;

const ChatAudit = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useUrlPageState();
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffId, setStaffId] = useState("");
  const [userId, setUserId] = useState("");
  const [staffMemberID, setStaffMemberID] = useState("");
  const [userMemberID, setUserMemberID] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesTotalPages, setMessagesTotalPages] = useState(1);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  const limit = 20;
  const messagesLimit = 50;

  const handleGoBack = () => router.back();

  const conversationQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit,
      search: searchQuery,
      staffId,
      userId,
      staffMemberID,
      userMemberID,
      fromDate,
      toDate,
    }),
    [
      currentPage,
      fromDate,
      searchQuery,
      staffId,
      staffMemberID,
      toDate,
      userId,
      userMemberID,
    ]
  );

  const fetchConversations = useCallback(async () => {
    setLoading(true);

    await dispatch(
      GetAdminChatConversationsApi(conversationQueryParams, (resp) => {
        if (resp?.status || resp?.success) {
          setConversations(Array.isArray(resp.data) ? resp.data : []);
          setTotalPages(getPaginationTotalPages(resp.pagination));
        } else {
          setConversations([]);
          setTotalPages(1);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch chat conversations"
          );
        }

        setLoading(false);
      })
    );
  }, [conversationQueryParams, dispatch]);

  const fetchMessages = useCallback(
    async (conversationId, page = 1) => {
      if (!conversationId) return;

      setMessagesLoading(true);

      await dispatch(
        GetAdminChatMessagesApi(
          conversationId,
          { page, limit: messagesLimit },
          (resp) => {
            if (resp?.status || resp?.success) {
              setMessages(Array.isArray(resp.data) ? resp.data : []);
              setMessagesPage(page);
              setMessagesTotalPages(getPaginationTotalPages(resp.pagination));
            } else {
              setMessages([]);
              setMessagesTotalPages(1);
              Notiflix.Notify.failure(
                resp?.message || "Failed to fetch chat messages"
              );
            }

            setMessagesLoading(false);
          }
        )
      );
    },
    [dispatch]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStaffId("");
    setUserId("");
    setStaffMemberID("");
    setUserMemberID("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const openMessages = (conversation) => {
    setSelectedConversation(conversation);
    setShowMessagesModal(true);
    fetchMessages(conversation._id, 1);
  };

  const closeMessages = () => {
    setShowMessagesModal(false);
    setSelectedConversation(null);
    setMessages([]);
    setMessagesPage(1);
    setMessagesTotalPages(1);
  };

  const paginate = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const paginateMessages = (page) => {
    if (
      page < 1 ||
      page > messagesTotalPages ||
      page === messagesPage ||
      !selectedConversation?._id
    ) {
      return;
    }

    fetchMessages(selectedConversation._id, page);
  };

  return (
    <Container fluid className="p-6">
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={handleGoBack}
        ></i>
        <PageHeading heading="Chat Audit" />
      </div>

      <Card className="mt-4">
        <Card.Body>
          <Form className="d-flex flex-wrap align-items-end gap-3">
            <div>
              <Form.Label className="fw-bold">Search</Form.Label>
              <Form.Control
                type="search"
                value={searchQuery}
                onChange={handleFilterChange(setSearchQuery)}
                placeholder="Name, member ID, message"
              />
            </div>

            <div>
              <Form.Label className="fw-bold">Staff ID</Form.Label>
              <Form.Control
                value={staffId}
                onChange={handleFilterChange(setStaffId)}
                placeholder="staff object id"
              />
            </div>

            <div>
              <Form.Label className="fw-bold">User ID</Form.Label>
              <Form.Control
                value={userId}
                onChange={handleFilterChange(setUserId)}
                placeholder="user object id"
              />
            </div>

            <div>
              <Form.Label className="fw-bold">Staff Member ID</Form.Label>
              <Form.Control
                value={staffMemberID}
                onChange={handleFilterChange(setStaffMemberID)}
                placeholder="staff member id"
              />
            </div>

            <div>
              <Form.Label className="fw-bold">User Member ID</Form.Label>
              <Form.Control
                value={userMemberID}
                onChange={handleFilterChange(setUserMemberID)}
                placeholder="user member id"
              />
            </div>

            <div>
              <Form.Label className="fw-bold">From Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={handleFilterChange(setFromDate)}
              />
            </div>

            <div>
              <Form.Label className="fw-bold">To Date</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={handleFilterChange(setToDate)}
              />
            </div>

            <Button type="button" variant="outline-secondary" onClick={clearFilters}>
              Clear
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Table responsive className="text-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Staff</th>
                  <th>User</th>
                  <th>Last Message</th>
                  <th>Unread</th>
                  <th>Last Chat Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Loading conversations...
                    </td>
                  </tr>
                ) : conversations.length > 0 ? (
                  conversations.map((conversation, index) => (
                    <tr key={conversation._id}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td>
                        <div>{renderPersonName(conversation.staff, "staff")}</div>
                        <div className="text-muted small">
                          {getPersonMemberId(conversation.staff)}
                        </div>
                      </td>
                      <td>
                        <div>{renderPersonName(conversation.user, "user")}</div>
                        <div className="text-muted small">
                          {getPersonMemberId(conversation.user)}
                        </div>
                      </td>
                      <td className="text-wrap" style={{ minWidth: "260px" }}>
                        <div>{getMessagePreview(conversation.lastMessage)}</div>
                        <div className="text-muted small text-capitalize">
                          {conversation.lastMessage?.senderType || "-"} /{" "}
                          {conversation.lastMessage?.messageType || "text"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Badge bg="secondary">
                            User {conversation.unreadForUser || 0}
                          </Badge>
                          <Badge bg="info">
                            Staff {conversation.unreadForStaff || 0}
                          </Badge>
                        </div>
                      </td>
                      <td>{formatDateTime(conversation.updatedAt)}</td>
                      <td>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => openMessages(conversation)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No conversations found
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

      <Modal show={showMessagesModal} onHide={closeMessages} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chat Messages</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedConversation ? (
            <div className="border-bottom pb-3 mb-3">
              <div className="fw-semibold">
                {renderPersonName(selectedConversation.user, "user")} with{" "}
                {renderPersonName(selectedConversation.staff, "staff")}
              </div>
              <div className="text-muted small">
                User: {getPersonMemberId(selectedConversation.user) || "-"} |
                Staff: {getPersonMemberId(selectedConversation.staff) || "-"}
              </div>
            </div>
          ) : null}

          {messagesLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" />
            </div>
          ) : messages.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`d-flex ${
                    message.senderType === "staff"
                      ? "justify-content-end"
                      : "justify-content-start"
                  }`}
                >
                  <div className="border rounded p-3" style={{ maxWidth: "75%" }}>
                    <div className="d-flex justify-content-between gap-3 mb-2">
                      <Badge
                        bg={message.senderType === "staff" ? "primary" : "success"}
                        className="text-capitalize"
                      >
                        {message.senderType || "user"}
                      </Badge>
                      <span className="text-muted small">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-muted small text-capitalize mb-1">
                      {message.messageType || "text"}
                    </div>
                    {message.fileUrl ? (
                      <a href={message.fileUrl} target="_blank" rel="noreferrer">
                        View attachment
                      </a>
                    ) : (
                      <div className="text-wrap">{message.message || "-"}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">No messages found</div>
          )}

          <TablePagination
            currentPage={messagesPage}
            totalPages={messagesTotalPages}
            onPageChange={paginateMessages}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={closeMessages}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ChatAudit;

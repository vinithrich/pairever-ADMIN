import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col, Card, Table, Form, Badge, Spinner } from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import { PageHeading } from "@/widgets";
import TablePagination from "@/components/TablePagination";
import { GetMultiAppUsersApi } from "@/helper/Redux/ReduxThunk/Homepage";
import styles from "./styles.module.scss";

const nf = new Intl.NumberFormat("en-IN");

// A stable colour per app id, so the same app looks the same in every row.
const APP_VARIANTS = ["primary", "danger", "success", "info", "warning", "dark", "secondary"];
const appVariant = (id) => {
  const n = Number(id);
  return APP_VARIANTS[(Number.isFinite(n) ? n : 0) % APP_VARIANTS.length];
};

const MultiAppUsers = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  // Page authorization & mount states
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  // Apps the backend knows AND that appear among multi-app users. Unregistered
  // ids (6, 7) are excluded by the API, since they have no name to show.
  const [availableApps, setAvailableApps] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [distribution, setDistribution] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Typing fires a request per keystroke, so responses can arrive out of order and an
  // older one overwrites the newer totals — that is how the header came to disagree
  // with the response. Only the newest request may write to state.
  const requestRef = useRef(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [appFilter, setAppFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    // Client-side PairEver context check
    const selectedApp = localStorage.getItem("selectedAdminApp") || "0";
    if (selectedApp !== "0" && selectedApp !== "pairever") {
      Notiflix.Notify.failure("Access Denied: Multi-App Users is restricted to PairEver admin only.");
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // One request 400ms after typing stops, instead of one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!authorized) return;

    const requestId = ++requestRef.current;
    setIsLoading(true);

    const params = {
      page: currentPage,
      limit: limit,
    };
    if (appFilter !== "all") {
      params.appId = appFilter;
    }
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    dispatch(
      GetMultiAppUsersApi(params, (res) => {
        // A slower earlier request must not clobber the newest one.
        if (requestId !== requestRef.current) return;

        if (res && res.status) {
          setUsers(res.data || []);
          setAvailableApps(res.availableApps || []);
          setDistribution(res.distribution || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalUsers(res.pagination?.total || 0);
        } else {
          Notiflix.Notify.failure(res?.message || "Failed to load multi-app users.");
          setUsers([]);
          setTotalUsers(0);
        }
        setIsLoading(false);
      })
    );
  }, [authorized, currentPage, appFilter, debouncedSearch, dispatch, limit]);

  const handleFilterChange = (e) => {
    setAppFilter(e.target.value);
    setCurrentPage(1);
  };

  if (!authorized) {
    return (
      <Container className="py-5 text-center">
        <h4>Verifying admin authorization...</h4>
      </Container>
    );
  }

  return (
    <Container fluid className="px-6 py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <PageHeading heading="Multi-App Users" />
        </Col>
      </Row>

      <div className="d-flex justify-content-between w-100 align-items-end mb-4">
        <Form className="d-flex flex-wrap gap-3 align-items-end w-100">
          <div>
            <Form.Label className="text-white fw-bold">Search</Form.Label>
            <Form.Control
              type="search"
              placeholder="Search Name / Phone"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: "220px" }}
            />
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Filter by Application</Form.Label>
            <Form.Select
              value={appFilter}
              onChange={handleFilterChange}
              style={{ minWidth: "220px" }}
            >
              <option value="all">All Applications</option>
              {availableApps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({nf.format(app.userCount ?? 0)})
                </option>
              ))}
            </Form.Select>
          </div>

          <div>
            <Form.Label className="text-white fw-bold">Rows</Form.Label>
            <Form.Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ minWidth: "100px" }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Form.Select>
          </div>
        </Form>
      </div>

      {/* How many people are in exactly N apps. Always the full picture, so it does
          not change when a single app is selected. */}
      {distribution.length > 0 && (
        <Row className="g-3 mb-4">
          {distribution.map((item) => (
            <Col key={item.appsCount} xs={6} sm={4} md={3} xl={2}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="py-3">
                  <div className="text-muted small">In {item.appsCount} apps</div>
                  <div className="fs-4 fw-bold">{nf.format(item.userCount)}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <div className="d-flex flex-wrap justify-content-between gap-2 px-3 py-3 border-bottom">
              <div className="fw-semibold text-white d-flex align-items-center gap-2">
                Showing {users.length} of {nf.format(totalUsers)}
                {isLoading && <Spinner animation="border" size="sm" />}
              </div>
              <div className="text-white-50">
                {appFilter === "all"
                  ? "Users registered in 2 or more applications"
                  : `Multi-app users registered in ${
                      availableApps.find((a) => a.id === appFilter)?.name || "this app"
                    }`}
              </div>
            </div>
            <Card.Body className="p-0">
              <div className={`table-responsive ${styles.tableResponsive}`}>
                <Table className="text-nowrap mb-0 align-middle" hover>
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Mobile Number</th>
                      <th>Number of Applications</th>
                      <th>Applications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          Loading multi-app users...
                        </td>
                      </tr>
                    ) : users.length > 0 ? (
                      users.map((user, idx) => (
                        <tr key={idx}>
                          <td className="fw-semibold">{user.name}</td>
                          <td>{user.phone}</td>
                          <td>
                            <Badge bg="light" text="dark">{user.appsCount} apps</Badge>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {user.applications.map((app) => (
                                <Badge key={app.id} bg={appVariant(app.id)} className="fw-normal">
                                  {app.name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          No multi-app users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MultiAppUsers;


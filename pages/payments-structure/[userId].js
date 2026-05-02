import { PageHeading } from "@/widgets";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  Col,
  Row,
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import Notiflix from "notiflix";
import {
  getSinglePaymentStructureApi,
  updatePaymentStructureApi,
} from "@/helper/Redux/ReduxThunk/Homepage";

const BATCH_STATUS_OPTIONS = ["Hot", "New", "Best Seller"];

const getBatchStatus = (item = {}) =>
  item.batchStatus || item.badgeStatus || item.adBatchStatus || "";

const ManageInvoice = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { userId } = router.query; // paymentStructure _id

  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
console.log("selectedItem",selectedItem)
  const [formData, setFormData] = useState({
    coin: "",
    amount: "",
    offerAmount: "",
    offerStatus: false,
    batchStatus: "",
    image: "",
    imageFile: null,
  });

  /* ================= FETCH SINGLE PAYMENT ================= */
  const fetchPayment = async () => {
    if (!userId) return;

    await dispatch(
      getSinglePaymentStructureApi(userId, (resp) => {
        if (resp?.status) {
          // API returns single object → convert to array for table
          setList(resp.data ? [resp.data] : []);
        } else {
          setList([]);
          Notiflix.Notify.failure(
            resp?.message || "Failed to fetch payment"
          );
        }
      })
    );
  };

  useEffect(() => {
    if (userId) {
      fetchPayment();
    }
  }, [userId]);

  /* ================= OPEN EDIT MODAL ================= */
  const openEditModal = (item) => {
    console.log("item------",item)
    setSelectedItem(item);
    setFormData({
      coin: item.coin || "",
      amount: item.amount || "",
      offerAmount: item.offerAmount || "",
      // backend stores string "true"/"false"
      offerStatus: item.offerStatus === "true",
      batchStatus: getBatchStatus(item),
      image: item.image || "",
      imageFile: null,
    });
    setShowModal(true);
  };

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      imageFile: e.target.files[0],
    });
  };

  /* ================= UPDATE PAYMENT ================= */
  const handleUpdate = async () => {
    if (!selectedItem?._id) return;

    const payload = new FormData();

    // 🔥 IMPORTANT: backend expects userId in body
    payload.append("userId", selectedItem._id);

    payload.append("coin", formData.coin);
    payload.append("amount", formData.amount);
    payload.append("offerAmount", formData.offerAmount);
    payload.append(
      "offerStatus",
      formData.offerStatus ? "true" : "false"
    );
    payload.append("batchStatus", formData.batchStatus);
    payload.append("badgeStatus", formData.batchStatus);

    if (formData.imageFile) {
      payload.append("image", formData.imageFile);
    } else if (formData.image) {
      payload.append("image", formData.image);
    }

    await dispatch(
      updatePaymentStructureApi(payload, (resp) => {
        console.log("payload",payload)
        if (resp?.status) {
          Notiflix.Notify.success("Payment updated successfully");
          setShowModal(false);
          fetchPayment(); // refresh
        } else {
          Notiflix.Notify.failure(
            resp?.message || "Update failed"
          );
        }
      })
    );
  };

  return (
    <Container fluid className="p-6">
      {/* HEADER */}
      <div className="go_back">
        <i
          className="nav-icon fe fe-arrow-left-circle me-2 text-white"
          onClick={() => router.back()}
        />
        <PageHeading heading="Manage Payments" />
      </div>

      {/* TABLE */}
      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Coin</th>
                  <th>Amount</th>
                  <th>Offer Amount</th>
                  <th>Status</th>
                  <th>Batch Status</th>
                  <th>Image</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {list.length > 0 ? (
                  list.map((item, i) => (
                    <tr key={item._id}>
                      <td>{i + 1}</td>
                      <td>{item.coin}</td>
                      <td>{item.amount}</td>
                      <td>{item.offerAmount}</td>
                      <td>
                        {item.offerStatus === "true" ? (
                          <span className="badge bg-success">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        {getBatchStatus(item) ? (
                          <span className="badge bg-info">
                            {getBatchStatus(item)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt="img"
                            width={40}
                            height={40}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* EDIT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Payment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Coin</Form.Label>
              <Form.Control
                name="coin"
                value={formData.coin}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Offer Amount</Form.Label>
              <Form.Control
                type="number"
                name="offerAmount"
                value={formData.offerAmount}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Check
              className="mt-2"
              type="checkbox"
              label="Offer Active"
              name="offerStatus"
              checked={formData.offerStatus}
              onChange={handleChange}
            />

            <Form.Group className="mt-3">
              <Form.Label>Batch Status</Form.Label>
              <Form.Select
                name="batchStatus"
                value={formData.batchStatus}
                onChange={handleChange}
              >
                <option value="">None</option>
                {BATCH_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageInvoice;

import { GetTicketApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { Col, Row, Table } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useDispatch } from 'react-redux';

const VenueModal = ({ ticketVenueData, eventsdetails, selectedVenue, ticketData, ...props }) => {
    const dispatch= useDispatch()
        const [loading, setLoading] = useState(false);

    const teams = [
        { team: "VIP", price: 100, totalTickets: 12, balanceTickets: 1 },
        { team: "First Class", price: 150, totalTickets: 20, balanceTickets: 5 },
        { team: "Second Class", price: 200, totalTickets: 30, balanceTickets: 10 }
    ];
    const o = ticketVenueData
  return (
      <div className='venue-modal'>
          <Modal
              {...props}
              size="md"
              aria-labelledby="contained-modal-title-vcenter"
              centered
             
          >
             
              <Modal.Body className='p-4'>
                  {/* {eventsdetails && eventsdetails.map((o, i) => ( */}
                      <div>
                  <Row className="mb-3 align-items-center">
                      <p className='col-sm-4 mb-0 fw-bold text-black'>Venue :</p>
                      <Col md={8} xs={12}>
                                  <strong>{o?.venueName}</strong>
                      </Col>
                  </Row>
                  <Row className="mb-3 align-items-center">
                      <p className='col-sm-4 mb-0 fw-bold text-black'>Address :</p>
                      <Col md={8} xs={12}>
                              <p className='mb-0'>{o?.address}</p>
                      </Col>
                  </Row>
                  <Row className="mb-3 align-items-center">
                      <p className='col-sm-4 mb-0 fw-bold text-black'>Date :</p>
                      <Col md={8} xs={12}>
                              <p className='mb-0'>{o?.date}</p>
                      </Col>
                  </Row>
                  <Row className="mb-3 align-items-center">
                      <p className='col-sm-4 mb-0 fw-bold text-black'>Location :</p>
                      <Col md={8} xs={12}>
                              <p className='mb-0'>{o?.location}</p>
                      </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                      <p className='col-sm-4 mb-0 fw-bold text-black'>No. of Teams :</p>
                      <Col md={8} xs={12}>
                              <p className='mb-0'>{ticketData?.length}</p>
                      </Col>
                      </Row>
                  </div>
                  {/* ))} */}
                  <Table responsive className="text-nowrap mb-0">
                      <thead className="table-light">
                          <tr>
                              <th>Team</th>
                            
                              <th>Price</th>
                              <th>Total Tickets</th>
                              <th>Balance Tickets</th>
                          </tr>
                      </thead>
                      <tbody>
                          {ticketData?.map((team, index) => (
                              <tr key={index}>
                                  <td className="align-middle text-center">{team?.team}</td>
                                  <td className="align-middle text-center">{team?.price}</td>
                               
                                  <td className="align-middle text-center">{team?.total_Ticket}</td>
                                  <td className="align-middle text-center">{team?.remaining_Ticket}</td>
                              </tr>
                          ))}
                      </tbody>
                  </Table>
                  <div className='d-flex justify-content-end mt-3'>
                      <Button onClick={props.onHide}>Close</Button>
                  </div>
              </Modal.Body>
              
          </Modal>
  
    </div>
  )
}

export default VenueModal
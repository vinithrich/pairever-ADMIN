import { yupResolver } from '@hookform/resolvers/yup';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { Col, Form, Row, Table } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import * as yup from "yup";

const UpdateModal = ({ show, onHide, eventsdetails, ticketData }) => {

     const schema = yup.object().shape({
         venue: yup.string().required("venue is required"),
         address: yup.string().required("address is required"),
         date: yup.string().required("date is required"),
         location: yup.string().required("location is required"),
         teams: yup.string().required("teams is required"),
         name: yup.string().required("Name is required"),
         name: yup.string().required("Name is required"),


     });
     const {
            handleSubmit,
            control,
            setValue,
            formState: { errors },
        } = useForm({
            resolver: yupResolver(schema),
            defaultValues: {
                venue: "",
                address:"" ,
                date: "",
                location: "",
                teams:"" ,
            }
        });
    //   useEffect(() => {
    //         if (aoi) {
    //             setValue("name", aoi?.name || "");
    //             setSelectedImage(aoi?.image || "");
    //             setSendImg(null); // Reset file selection
    //         }
    //     }, [aoi, setValue]);
  return (
      <div className='update-venue-modal'>
          <Modal
              show={show} onHide={onHide}
              size="md"
              aria-labelledby="contained-modal-title-vcenter"
              centered

          >

              <Modal.Body className='p-4'>
               
                      <div>
                          <Row className="mb-3 align-items-center">
                              <p className='col-sm-4 mb-0 fw-bold text-black'>Venue :</p>
                              <Col md={8} xs={12}>
                              <Controller
                                  name="venue"
                                  control={control}
                                  render={({ field }) => (
                                      <Form.Control
                                          type="text"
                                          {...field}
                                          isInvalid={!!errors.venue}
                                      />
                                  )}
                              />
                              {errors.name && <p style={{ color: 'red' }}>{errors.name.message}</p>}
                              </Col>
                          </Row>
                          <Row className="mb-3 align-items-center">
                              <p className='col-sm-4 mb-0 fw-bold text-black'>Address :</p>
                          <Col md={8} xs={12}>
                              <Controller
                                  name="address"
                                  control={control}
                                  render={({ field }) => (
                                      <Form.Control
                                          type="text"
                                          {...field}
                                          isInvalid={!!errors.address}
                                      />
                                  )}
                              />
                              </Col>
                          </Row>
                          <Row className="mb-3 align-items-center">
                              <p className='col-sm-4 mb-0 fw-bold text-black'>Date :</p>
                              <Col md={8} xs={12}>
                              <Controller
                                  name="date"
                                  control={control}
                                  render={({ field }) => (
                                      <Form.Control
                                          type="text"
                                          {...field}
                                          isInvalid={!!errors.date}
                                      />
                                  )}
                              />
                              </Col>
                          </Row>
                          <Row className="mb-3 align-items-center">
                              <p className='col-sm-4 mb-0 fw-bold text-black'>Location :</p>
                              <Col md={8} xs={12}>
                              <Controller
                                  name="location"
                                  control={control}
                                  render={({ field }) => (
                                      <Form.Control
                                          type="text"
                                          {...field}
                                          isInvalid={!!errors.location}
                                      />
                                  )}
                              />
                              </Col>
                          </Row>

                          <Row className="mb-3 align-items-center">
                              <p className='col-sm-4 mb-0 fw-bold text-black'>No. of Teams :</p>
                              <Col md={8} xs={12}>
                              <Controller
                                  name="teams"
                                  control={control}
                                  render={({ field }) => (
                                      <Form.Control
                                          type="text"
                                          {...field}
                                          isInvalid={!!errors.teams}
                                      />
                                  )}
                              />
                              </Col>
                          </Row>
                      </div>
   
                
                  <div className='d-flex justify-content-end mt-3'>
                      <Button onClick={onHide}>Close</Button>
                  </div>
              </Modal.Body>

          </Modal>

      </div>
  )
}

export default UpdateModal
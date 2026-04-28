// import node module libraries
import { formatDate } from '@/helper/apiHelper';
import { GetSingleCarearApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { PageHeading } from '@/widgets';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Col, Row, Card, Table, Form, Button, Spinner } from 'react-bootstrap';
import { useForm,Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import * as yup from "yup";


const CarearDetails = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [leaddet, setLeaddet] = useState("");
    const [selectedValue, setSelectedValue] = useState('Your Status');
    const [bgColor, setBgColor] = useState('');
    const { carear } = router.query;
    const [loading, setLoading] = useState(false);


    const getLeads = async () => {
        let param = {
            id: carear
        }
        await dispatch(GetSingleCarearApi(param, (resp) => {

            if (resp.status === true) {
                setLeaddet(resp?.data)
            }

        }))
    }
    useEffect(() => {
        getLeads();
    }, [carear])


    const handleGoback = () => {
        router.back();
    };

    const handleSelectChange = (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        setSelectedValue(event.target.value);
        setBgColor(selectedOption.style.backgroundColor);
    };

    const schema=yup.object().shape({
        carreerviewstatus: yup.string().required("Status is required"),
        careerviewcomments: yup.string().required("Comments is required"),
    })

    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            // faqs: [{ question: '', answer: '' }]
        }
    });

    const onSubmit = async (data) => {

        const formData = new FormData();
        formData.append("career_view_comments", data.careerviewcomments);
        formData.append("career_view_status", data.careerviewstatus);
   


        setLoading(true)
        await dispatch(AddPageMetaApi(formData, (resp) => {
            if (resp && resp.status == true) {
                // router.push("/page-list");
                Notiflix.Notify.success("Status Sumbitted Successfully");
                setLoading(false)
            }
            else {
                Notiflix.Notify.failure(resp?.message);
                setLoading(false)

            }
        }))

    };

    return (
        <Col xl={12} lg={12} md={12} xs={12} className="mb-6" style={{ padding: "30px" }}>
            {/* card */}
            <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Back to Careers" />
            </div>
            <Card>
                {/* card body */}
                <Card.Body>
                    {/* card title */}

                    {/* <span className="text-uppercase fw-medium text-dark fs-5 ls-2">Requirement</span>
                    <p className="mt-2 mb-6">{leaddet && leaddet.message}
                    </p> */}
                    <Row>



                        <Table striped bordered className="text-nowrap">
                            <tbody>
                                <tr>
                                    <td>IP Address</td>
                                    <td>{leaddet && leaddet.ipAddress}</td>
                                </tr>
                                <tr>
                                    <td>Date & Time</td>
                                    <td>{formatDate(leaddet && leaddet.createdAt)}</td>
                                </tr>
                                <tr>
                                    <td>Position Applied For</td>
                                    <td>{leaddet && leaddet.position}</td>
                                </tr>
                                <tr>
                                    <td>Full Name</td>
                                    <td>{leaddet && leaddet.fullName}</td>
                                </tr>
                                <tr>
                                    <td>Email Address</td>
                                    <td>{leaddet && leaddet.email}</td>
                                </tr>

                                <tr>
                                    <td>Mobile Number</td>
                                    <td>{leaddet && leaddet.mobileNumber}</td>
                                </tr>
                                <tr>
                                    <td>Country</td>
                                    <td>{leaddet && leaddet.country}</td>
                                </tr>
                                <tr>
                                    <td>State</td>
                                    <td>{leaddet && leaddet.state}</td>
                                </tr>

                                <tr>
                                    <td>City</td>
                                    <td>{leaddet && leaddet.city}</td>
                                </tr>
                                {/* <tr>
                                    <td>Current/Most Recent Employer
                                    </td>
                                    <td></td>
                                </tr> */}
                                <tr>
                                    <td>Experience Level</td>
                                    <td>{leaddet && leaddet.experienceLevel}</td>
                                </tr>
                                <tr>
                                    <td>Availability</td>
                                    <td>{leaddet && leaddet.availability}</td>
                                </tr>
                                <tr>
                                    <td>LinkedIn Profile URL</td>
                                    <td>{leaddet && leaddet.linkedInProfile}</td>
                                </tr>
                                <tr>
                                    <td>Resume/CV URL </td>
                                    <td>{leaddet && leaddet.resumeFile}</td>
                                </tr>
                                <tr>
                                    <td>How Did You Hear About Us?</td>
                                    <td>{leaddet && leaddet.hearAboutUs}</td>
                                </tr>

                           
                                {/* <tr>
                                    <td>Cover Letter URL</td>
                                    <td>{leaddet && leaddet.coverFile}</td>
                                </tr> */}
                                {/* <tr>
                                    <td>Status</td>
                                    <td>{leaddet && leaddet.coverFile}</td>
                                </tr> */}
                            </tbody>
                        </Table>

                    </Row>
                </Card.Body>
            </Card>

            <Card className="mt-5">
                <Card.Body>
                    <form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Col xs={6} className="mb-5">
                            <div className='d-flex gap-2 mb-5'>
                                <div>
                                    <h6 className="text-uppercase fs-5 ls-2 d-flex justify-content-center align-items-center mt-2">
                                        Status</h6>
                                </div>
                                <div className='mb-3'>
                                  
                                    <Controller
                    name='careerviewstatus'
                    control={control}
                    render={({ field }) =>
                      <>
                        <Form.Select aria-label="Default select example" value={selectedValue}
                                        onChange={handleSelectChange}
                                        style={{ backgroundColor: bgColor, color: selectedValue === "2" ? 'black' : 'white' }}>
                                        <option value="" selected hidden>Your Status</option>
                                        <option style={{ backgroundColor: 'green', color: 'white' }} >Selected</option>
                                        <option value="1" style={{ backgroundColor: '#3d3d3d', color: 'white' }}>Invalid</option>
                                        <option value="2" style={{ backgroundColor: '#ffe5a0', color: 'black' }}>In Review</option>
                                        <option value="3" style={{ backgroundColor: 'Red', color: 'white' }}>Rejected</option>
                                    </Form.Select>
                      </>
                    }
                  />
                                </div>
                            </div>
                            <Controller
                                            name="pageurl"
                                            control={control}
                                            render={({ field }) => (
                            <textarea rows="5" 
                            cols="130" 
                            {...field}
                            isInvalid={!!errors.careerviewcomments}>
                            </textarea>
                             )}
                             />
                        </Col>
                    </Row>
                    <div className='d-flex justify-content-end'>
                    {loading && <Button variant="primary" disabled style={{ background: '#383846', border: '#383846' }}>
                                            <Spinner animation="border" variant="light" size="sm"  />
                                        </Button>}
                                        {!loading &&
                                            <Button variant="primary" type="submit" style={{ background: '#383846', border: '#383846' }}>
                                              submit
                                            </Button>}
                    </div>
                    </form>
                </Card.Body>
            </Card>
        </Col>
    )
}

export default CarearDetails
import { formatDate } from '@/helper/apiHelper';
import { GetParticularLeadsApi } from '@/helper/Redux/ReduxThunk/Homepage';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Col, Row, Card, Table } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { PageHeading } from '@/widgets';
import Notiflix from 'notiflix';

const LeadsDetails = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [leaddet, setLeaddet] = useState(null);
    const [isAuthenticated, setAuthenticated] = useState(false);
    const { id } = router.query;

    // Fetch the lead details
    const getLeads = async () => {
        if (!id || !isAuthenticated) return; // Prevent fetching without authentication
        const param = { id };
        await dispatch(
            GetParticularLeadsApi(param, (resp) => {
                if (resp.status === true) {
                    setLeaddet(resp?.data?.data);
                } else {
                    console.error('Failed to fetch lead details', resp);
                }
            })
        );
    };

    useEffect(() => {
        const showAccessKeyPrompt = async () => {
            // Create a custom input modal
            Notiflix.Report.init({
                borderRadius: '8px',
                plainText: false, // Allow HTML content
            });

            // Show modal with custom HTML input
            Notiflix.Report.info(
                'Access Required',
                `
            <div style="margin-top: 10px;">
                <label for="accessKey" style="font-weight: bold; display: block; margin-bottom: 5px;">Enter Access Key:</label>
                <input type="password"  autocomplete="off"  aria-autocomplete="none" id="accessKey" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
            `,
                'Submit',
                async () => {
                    const inputValue = document.getElementById('accessKey').value;

                    // Validate the access key
                    try {
                        const response = await fetch('/api/validateAccessKey', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ accessKey: inputValue }),
                        });
                        const data = await response.json();

                        if (response.ok && data.success) {
                            setAuthenticated(true);

                            // Set a timeout for 1 hour
                            setTimeout(() => {
                                setAuthenticated(false);
                                Notiflix.Notify.warning(
                                    'Your session has expired. Please re-enter your access key.'
                                );
                            }, 20000); // 1 hour 3600000
                        } else {
                            Notiflix.Notify.failure(data.message || 'Invalid Access Key');
                            setAuthenticated(false);
                            showAccessKeyPrompt(); // Re-show prompt if validation fails
                        }
                    } catch (error) {
                        console.error('Error verifying access key:', error);
                        Notiflix.Notify.failure('Failed to validate access key.');
                        showAccessKeyPrompt(); // Re-show prompt on error
                    }
                }
            );
        };

        showAccessKeyPrompt();
    }, [id]);

    useEffect(() => {
        getLeads();
    }, [id, isAuthenticated]);

    const handleGoback = () => {
        router.back();
    };

    if (!isAuthenticated) {
        return null; // Prevent unauthorized content rendering
    }

    return (
        <Col xl={12} lg={12} md={12} xs={12} className="mb-6" style={{ padding: '30px' }}>
            <div className="go_back">
                <i
                    className={`nav-icon fe fe-arrow-left-circle me-2 text-white mb-3`}
                    onClick={handleGoback}
                ></i>
                <PageHeading heading="Back to Leads" />
            </div>
            <Card>
                <Card.Body>
                    <Row>
                        <Table striped bordered className="text-nowrap">
                            <tbody>
                                <tr>
                                    <td>Inquiry Date & Time</td>
                                    <td>{formatDate(leaddet && leaddet?.createdAt)}</td>
                                </tr>
                                <tr>
                                    <td>IP Address</td>
                                    <td>{leaddet && leaddet?.ipAddress}</td>
                                </tr>
                                <tr>
                                    <td>Device Type</td>
                                    <td>{leaddet && leaddet?.device}</td>
                                </tr>
                                <tr>
                                    <td>OS Type</td>
                                    <td>{leaddet && leaddet?.os}</td>
                                </tr>
                                <tr>
                                    <td>Browser Type</td>
                                    <td>{leaddet && leaddet?.browserName}</td>
                                </tr>
                                <tr>
                                    <td>Name</td>
                                    <td>{leaddet && leaddet?.name}</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>{leaddet && leaddet?.email}</td>
                                </tr>
                                <tr>
                                    <td>Country</td>
                                    <td>{leaddet && leaddet?.country}</td>
                                </tr>
                                <tr>
                                    <td>Phone Number</td>
                                    <td>{leaddet && leaddet?.number}</td>
                                </tr>
                                <tr>
                                    <td>Mode of Contact</td>
                                    <td>{leaddet && leaddet?.social_media}</td>
                                </tr>
                                <tr>
                                    <td>{leaddet && leaddet?.social_media}</td>
                                    <td>{leaddet && leaddet?.social_media_number}</td>
                                </tr>
                                <tr>
                                    <td>Service</td>
                                    <td>{leaddet && leaddet?.service}</td>
                                </tr>
                                <tr>
                                    <td>Sub Service</td>
                                    <td>{leaddet && leaddet?.sub_service}</td>
                                </tr>
                                <tr>
                                    <td>Monthly Budget</td>
                                    <td>{leaddet && leaddet?.budget}</td>
                                </tr>
                                <tr>
                                    <td>Lead From</td>
                                    <td>{leaddet && leaddet?.page_from_url}</td>
                                </tr>
                                <tr>
                                    <td>Lead Module</td>
                                    <td>{leaddet && leaddet?.page_from}</td>
                                </tr>
                                <tr>
                                    <td>Message</td>
                                    <td>{leaddet && leaddet?.message}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </Row>
                </Card.Body>
            </Card>
            {/* <Card className="mt-5">
                <Card.Body>
                    <Row>
                        <Col xs={6} className="mb-5">
                        <div className='d-flex justify-content-between mb-5'>
                            <div>
                            <h6 className="text-uppercase fs-5 ls-2 d-flex justify-content-center align-items-center">
                            Lead Status</h6>
                        </div>
                        <div>
                        <Form.Select aria-label="Default select example">
      <option style={{backgroundColor:'green',color:'white'}}>Completed</option>
      <option value="1" style={{backgroundColor:'#3d3d3d',color:'white'}}>Invalid Leads</option>
      <option value="2"style={{backgroundColor:'#ffe5a0',color:'black'}}>In Progress</option>
      <option value="3" style={{backgroundColor:'Red',color:'white'}}>Pending</option>
    </Form.Select>
    </div>
                        </div>
                            
                            <textarea rows="5" cols="130" ></textarea>
                           
                        </Col>
                        <div className='d-flex justify-content-end'>
                            <Button type='submit' style={{background:'#383846',border:'1px solid black'}}>Submit</Button>
                            </div>
                    </Row>
                </Card.Body>
            </Card> */}
        </Col>
    );
};

export default LeadsDetails;

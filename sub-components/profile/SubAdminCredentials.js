// import node module libraries
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { Col, Row, Card, Form, Button } from 'react-bootstrap';
import PatternLockComponent from './PatternLockComponent';
// import PatternLock from 'react-pattern-lock';
// const PatternLock = dynamic(() => import('react-pattern-lock'), { ssr: false });

const SubAdminCredentials = ({onDepartmentChange}) => {
    const [pattern, setPattern] = useState([]);
    const [confirmPattern, setConfirmPattern] = useState([]);
    const [isPatternSet, setIsPatternSet] = useState(false);
    const [error, setError] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePatternComplete = (pattern) => {
        setPattern(pattern);
        setIsPatternSet(true);
        setError('');
    };

    const handleConfirmPatternComplete = (confirmPattern) => {
        setConfirmPattern(confirmPattern);
        if (JSON.stringify(pattern) !== JSON.stringify(confirmPattern)) {
            setError('Patterns do not match');
        } else {
            setError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (JSON.stringify(pattern) === JSON.stringify(confirmPattern)) {
            alert('Form submitted successfully');
            // Perform your form submission logic here
        } else {
            setError('Patterns do not match');
        }
    };

    if (!isClient) {
        return null;
    }

    const handleChange = (e) => {
        onDepartmentChange(e.target.value);
    };
    return (
        <Col xl={6} lg={12} md={12} xs={12} className="mb-6">
            <Card>
                <Card.Body>
                    <div>
                        <Form>
                            <Row className="mb-3">
                                <label
                                    htmlFor="username"
                                    className="col-form-label form-label"
                                >
                                    Username
                                </label>
                                <div className="col-md-12 col-12">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="username"
                                        id="username"
                                        required
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="username"
                                    className="col-form-label form-label"
                                >
                                    Designation
                                </label>
                                <div className="col-md-12 col-12">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Designation"
                                        id="designation"
                                        required
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="email"
                                    className="col-form-label form-label"
                                >
                                    Email
                                </label>
                                <div className="col-md-12 col-12">
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Email"
                                        id="email"
                                        required
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label className="col-form-label form-label" htmlFor="newPassword">Password</label>
                                <Col md={12} xs={12}>
                                    <input type="password" className="form-control" placeholder="Enter password" id="newPassword" required />
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <label className="col-form-label form-label" htmlFor="confirmPassword">Confirm Password</label>
                                <Col md={12} xs={12}>
                                    <input type="password" className="form-control" placeholder="Retype Your Password" id="confirmPassword" required />
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <label className="col-form-label form-label" htmlFor="confirmPassword">Department</label>
                                <Col md={12} xs={12}>
                                    <select class="form-select form-select-lg mb-3" aria-label="Small select example" onChange={handleChange}>
                                        <option selected hidden>Your Department</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="sales">Sales</option>
                                        <option value="content">Content</option>
                                    </select>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <label className="col-form-label form-label" htmlFor="confirmPattern">Pattern</label>
                                <Col md={12} xs={12}>
                                    <PatternLockComponent onComplete={handlePatternComplete} isConfirm={false} />

                                </Col>
                            </Row>
                            {isPatternSet && (

                                <Row className="mb-3">
                                    <label className="col-form-label form-label" htmlFor="confirmPattern">Confirm Pattern</label>
                                    <Col md={12} xs={12}>
                                        <PatternLockComponent onComplete={handleConfirmPatternComplete} isConfirm={true} />
                                    </Col>
                                </Row>
                            )}
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            <Col md={{ offset: 4, span: 8 }} xs={12} className="mt-3">
                                <Button variant="primary" type="submit">
                                   Update
                                </Button>
                            </Col>
                        </Form>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    )
}

export default SubAdminCredentials
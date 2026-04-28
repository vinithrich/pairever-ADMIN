import { Col, Row, Container } from 'react-bootstrap';
import { PageHeading } from '@/widgets';
import {
    SubAdminCredentials,
    SubAdminPermissionLists,
} from '@/sub-components';
import { useState } from 'react';
import { useRouter } from 'next/router';

const AddAdmin = () => {
    const router = useRouter();
    const [selectedDepartment, setSelectedDepartment] = useState('');

    const handleDepartmentChange = (department) => {
        setSelectedDepartment(department);
    };
    const handleGoback = () => {
        router.back()
      }
    return (
        <Container fluid className="p-6">
                <div className='go_back'>
                <i className={`nav-icon fe fe-arrow-left-circle me-2 text-white`} onClick={handleGoback}></i>
                <PageHeading heading="Sub-Admin Details" />
                </div>
            <div className="py-6">
                <Row>
                    <SubAdminCredentials onDepartmentChange={handleDepartmentChange}/>
                    <SubAdminPermissionLists selectedDepartment={selectedDepartment} />

                </Row>
            </div>
        </Container>
    )
}
export default AddAdmin
// import node module libraries
import { Fragment, useEffect, useState } from "react";
import { Container, Col, Row } from 'react-bootstrap';

// import widget/custom components
import { StatRightTopIcon } from "@/widgets";
// import PrivateRoute from "@/helper/PrivateRoute";
// import sub components

// import required data files
import ProjectsStatsData from "@/data/dashboard/ProjectsStatsData";
import { useDispatch } from "react-redux";
import { GetDashBoardDetailsApi } from "@/helper/Redux/ReduxThunk/Homepage";

const Dashboard = () => {
    const dispatch = useDispatch();
    const [dashboardcountdata, setDashboardCountData] = useState({});
    const [previousCounts, setPreviousCounts] = useState({});

    useEffect(() => {
        const loadPreviousCounts = () => {
            if (typeof window !== "undefined") {
                const savedCounts = localStorage.getItem('dashboardCounts');
                return savedCounts ? JSON.parse(savedCounts) : {};
            }
            return {};
        };
        setPreviousCounts(loadPreviousCounts());
    }, []);
    useEffect(() => {
        const getDashboardCount = async () => {
            await dispatch(
              GetDashBoardDetailsApi((resp) => {
                if (resp.status === true) {
                  setDashboardCountData(resp?.data);
                  if (typeof window !== "undefined") {
                    localStorage.setItem(
                      "dashboardCounts",
                      JSON.stringify(resp.data)
                    );
                  }
                }
              })
            );
        };

        getDashboardCount();
    }, [dispatch]);



    return (
      <Fragment>
        <div className=" pb-21"></div>
        <Container fluid className="mt-n22 px-6">
          <Row className="my-4">
            <Col lg={12} className="mt-4 dashboard-home" >
              {ProjectsStatsData.map((item, index) => {
                return (
                  <div key={index}>
                    <StatRightTopIcon
                      info={item}
                      dashboardcountdata={dashboardcountdata}
                      previousCounts={previousCounts}
                    />
                  </div>
                );
              })}
            </Col>
            {/* <Col xl={6} lg={6} md={12} xs={12} className="mt-4">
                             <TasksPerformance1 dashboardcountdata={dashboardcountdata}/>
     
                         </Col> */}
          </Row>

          {/* <Row className="my-6">
                {ProjectsStatsData.map((item, index) => {
                        return (
                    <Col xl={6} lg={12} md={12} xs={12} className="mb-6 mb-xl-0"key={index}>
                    <StatRightTopIcon info={item} />
                </Col>
                      )
                    })}  

              
                    <Col xl={6} lg={12} md={12} xs={12}>
                        <TasksPerformance1 />

                    </Col>

                </Row> */}
        </Container>
      </Fragment>
    );
}
export default Dashboard;

// import node module libraries
import { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Container, Col, Row, Spinner } from 'react-bootstrap';

// import widget/custom components
import { StatRightTopIcon } from "@/widgets";
// import PrivateRoute from "@/helper/PrivateRoute";
// import sub components

// import required data files
import ProjectsStatsData from "@/data/dashboard/ProjectsStatsData";
import { useDispatch } from "react-redux";
import { GetDashBoardDetailsApi } from "@/helper/Redux/ReduxThunk/Homepage";

// The counts saved on the last visit, used as the "since last visit" baseline.
// Keyed per app: a single shared "dashboardCounts" entry compared this app's
// figures against whichever app was open before and invented huge jumps on
// every Switch App.
const countsKey = (app) => `dashboardCounts:${app}`;

const readSavedCounts = (app) => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(countsKey(app));
    const parsed = saved ? JSON.parse(saved) : null;
    // Anything that is not a real object of counts is discarded rather than read
    // as zero, which is what made every card claim the whole figure was gained.
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const saveCounts = (app, counts) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(countsKey(app), JSON.stringify(counts));
  } catch {
    // Private mode / quota: the dashboard still works, it just shows no deltas.
  }
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const [dashboardcountdata, setDashboardCountData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    // Which app the counts belong to. apiHelper puts this in the X-App-Name header,
    // so the figures are always scoped to the app selected in Switch App.
    const [selectedApp, setSelectedApp] = useState("0");
    // Read once per app, before any fetch overwrites the stored copy, so the cards
    // compare against what was on screen last time.
    const [previousCounts, setPreviousCounts] = useState(null);

    const readSelectedApp = () =>
        (typeof window !== "undefined" &&
            localStorage.getItem("selectedAdminApp")) || "0";

    const appLabel = (value) => {
        const key = String(value || "0").toLowerCase();
        return (
            {
                "0": "PairEver", pairever: "PairEver",
                "1": "Flamez", flamez: "Flamez",
                "2": "Bonding", bonding: "Bonding",
                "3": "HeyLove", heylove: "HeyLove",
                "4": "Doly", doly: "Doly",
                "5": "Bestie", bestie: "Bestie", best: "Bestie",
                "8": "Flirt Fling", flirtfling: "Flirt Fling",
            }[key] || `App ${value}`
        );
    };

    // Counts come straight from the API on every load. They are NOT cached in
    // localStorage: a stored copy went stale, was shared across apps, and drove a
    // "since last visit" delta that compared this app's numbers with another app's.
    const getDashboardCount = useCallback(async () => {
        setIsLoading(true);
        const app = selectedApp;
        await dispatch(
            GetDashBoardDetailsApi((resp) => {
                if (resp?.status === true) {
                    const fresh = resp?.data || {};
                    setDashboardCountData(fresh);
                    // Stored for the next visit to compare against. The figures on
                    // screen are always the ones the API just returned.
                    saveCounts(app, fresh);
                    setLastUpdated(new Date());
                }
                setIsLoading(false);
            })
        );
    }, [dispatch, selectedApp]);

    useEffect(() => {
        setSelectedApp(readSelectedApp());
    }, []);

    // Refetch whenever the chosen app changes — including a change made in another
    // tab (storage event) or while this tab was in the background.
    useEffect(() => {
        const sync = () => {
            const next = readSelectedApp();
            setSelectedApp((prev) => (prev === next ? prev : next));
        };
        window.addEventListener("storage", sync);
        window.addEventListener("focus", sync);
        return () => {
            window.removeEventListener("storage", sync);
            window.removeEventListener("focus", sync);
        };
    }, []);

    // Must run before getDashboardCount writes the new counts over the old ones.
    useEffect(() => {
        setPreviousCounts(readSavedCounts(selectedApp));
    }, [selectedApp]);

    useEffect(() => {
        getDashboardCount();
    }, [getDashboardCount, selectedApp]);

    return (
      <Fragment>
        <div className=" pb-21"></div>
        <Container fluid className="mt-n22 px-6">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-4">
            <div className="text-white">
              <span className="fw-bold fs-5">{appLabel(selectedApp)}</span>
              <span className="text-white-50 ms-2 small">
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString()}`
                  : "Loading..."}
              </span>
            </div>
            <Button
              variant="outline-light"
              size="sm"
              onClick={getDashboardCount}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
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

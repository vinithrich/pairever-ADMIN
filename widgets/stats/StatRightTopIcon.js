import { useRouter } from "next/router";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";

const StatRightTopIcon = ({ info, dashboardcountdata, previousCounts }) => {
  const router = useRouter();

  const getValueByPath = (source, path) => {
    if (!source || !path) {
      return undefined;
    }

    return path.split(".").reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key];
      }

      return undefined;
    }, source);
  };

  const getValueByPaths = (source, paths) => {
    const pathList = Array.isArray(paths) ? paths : [paths];

    for (const path of pathList) {
      const value = getValueByPath(source, path);

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return 0;
  };

  const getSafeNumber = (value) => {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const valuePaths = info.keyPaths || info.keyPath;
  const currentCount = getSafeNumber(getValueByPaths(dashboardcountdata, valuePaths));
  const previousCount = getSafeNumber(getValueByPaths(previousCounts, valuePaths));
  const difference = currentCount - previousCount;
  const formattedCurrentCount = `${info.prefix || ""}${currentCount.toLocaleString()}`;
  const formattedDifference = `${difference > 0 ? "+" : ""}${info.prefix || ""}${Math.abs(
    difference
  ).toLocaleString()}`;

  return (
    <div>
      <Card
        onClick={() => info.link && router.push(info.link)}
        className="mb-3"
        style={{ cursor: info.link ? "pointer" : "default" }}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-0" style={{ fontSize: "30px" }}>
                {info.title}
              </h4>
            </div>
            <div>
              <h1 className="fw-bold">{formattedCurrentCount}</h1>

              {difference > 0 && (
                <p className="text-success fw-semibold mb-1">
                  {formattedDifference} since last visit
                </p>
              )}

              {difference < 0 && (
                <p className="text-danger fw-semibold mb-1">
                  -{formattedDifference.replace(/^\+/, "")} since last visit
                </p>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

StatRightTopIcon.propTypes = {
  info: PropTypes.any.isRequired,
  dashboardcountdata: PropTypes.object.isRequired,
  previousCounts: PropTypes.object.isRequired,
};

export default StatRightTopIcon;

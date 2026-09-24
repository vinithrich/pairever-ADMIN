import { useRouter } from "next/router";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";

const StatRightTopIcon = ({
  info,
  dashboardcountdata,
  previousCounts,
  baselineLabel = "since last visit",
}) => {
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
  // A missing baseline is NOT zero. Treating it as zero made every card claim the
  // whole figure was gained "since last visit" — e.g. "+220,760 since last visit"
  // on a first load. Only compare when a real previous value was supplied.
  const rawPrevious = previousCounts
    ? getValueByPaths(previousCounts, valuePaths)
    : undefined;
  const hasBaseline =
    rawPrevious !== undefined && rawPrevious !== null && rawPrevious !== "";
  const previousCount = getSafeNumber(rawPrevious);
  const descriptionValue = info.descriptionPath
    ? getValueByPaths(dashboardcountdata, info.descriptionPath)
    : null;
  const description =
    info.description ||
    (descriptionValue
      ? `${info.descriptionPrefix || ""}${descriptionValue}${info.descriptionSuffix || ""}`
      : "");
  const difference = currentCount - previousCount;
  const formattedCurrentCount = `${info.prefix || ""}${currentCount.toLocaleString()}`;
  // Sign first, then the prefix: "+Rs 1,200" / "-Rs 1,200".
  const formattedDifference = `${difference > 0 ? "+" : "-"}${info.prefix || ""}${Math.abs(
    difference
  ).toLocaleString()}`;
  const showDifference =
    hasBaseline && !info.hideDifference && difference !== 0;

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

              {showDifference && (
                <p
                  className={`fw-semibold mb-1 ${
                    difference > 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formattedDifference}{" "}
                  <span className="fw-normal text-muted small">
                    {baselineLabel}
                  </span>
                </p>
              )}

              {description ? (
                <p className="text-muted fw-semibold mb-0">{description}</p>
              ) : null}
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
  // Absent on a first visit, when there is nothing to compare against yet.
  previousCounts: PropTypes.object,
  baselineLabel: PropTypes.string,
};

export default StatRightTopIcon;

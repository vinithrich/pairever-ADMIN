import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card, Table } from "react-bootstrap";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Categorical slots 1-3, dark-surface steps. Validated with the data-viz
// validator against surface #1a1a19: lightness band, chroma floor, CVD
// separation (worst adjacent ΔE 9.4 deutan), normal-vision floor (26.5) and
// contrast all PASS. Assigned in fixed order and never cycled — a series keeps
// its colour regardless of how many are on screen.
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70"];

const nfmt = (v) =>
  new Intl.NumberFormat("en-IN").format(Math.round(Number(v) || 0));

const INK = {
  primary: "#ffffff",
  secondary: "#c3c2b7",
  // Grid and axes stay recessive so the data is the loudest thing in the frame.
  grid: "rgba(255,255,255,0.08)",
};

const baseOptions = (extra = {}) => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    background: "transparent",
    fontFamily: "inherit",
    animations: { enabled: false },
  },
  theme: { mode: "dark" },
  grid: {
    borderColor: INK.grid,
    strokeDashArray: 0, // solid hairline — dashed grid reads as a threshold
    padding: { left: 8, right: 8 },
  },
  dataLabels: { enabled: false },
  // A legend is mandatory from two series up, so identity is never colour-alone.
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
    labels: { colors: INK.secondary },
    markers: { width: 10, height: 10, radius: 3 },
    itemMargin: { horizontal: 12 },
  },
  tooltip: { theme: "dark", shared: true, intersect: false },
  xaxis: {
    axisBorder: { color: INK.grid },
    axisTicks: { color: INK.grid },
    labels: { style: { colors: INK.secondary, fontSize: "12px" } },
  },
  yaxis: {
    labels: {
      style: { colors: INK.secondary, fontSize: "12px" },
      formatter: (v) => nfmt(v),
    },
  },
  ...extra,
});

// Trend over time, several series to tell apart -> multi-line, categorical colour.
// One axis only: every series is a count of people, so they share a scale.
export const TrendChart = ({ points = [], granularity = "day", title, subtitle }) => {
  const labels = points.map((p) =>
    granularity === "hour"
      ? `${p.bucket.slice(11, 13)}:00`
      : new Date(`${p.bucket}T00:00:00Z`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
  );

  const series = [
    { name: "Users joined", data: points.map((p) => p.joinedUsers) },
    { name: "Verified", data: points.map((p) => p.verifiedUsers) },
    { name: "Deposit users", data: points.map((p) => p.depositUsers) },
  ];

  const options = baseOptions({
    colors: SERIES_COLORS,
    stroke: { curve: "smooth", width: 2 },     // 2px lines
    markers: { size: points.length <= 14 ? 4 : 0, hover: { size: 6 } },
    xaxis: {
      ...baseOptions().xaxis,
      categories: labels,
      tickAmount: Math.min(labels.length, 12),
    },
  });

  const [showTable, setShowTable] = useState(false);

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div>
            <h5 className="mb-1">{title}</h5>
            {subtitle && <p className="text-muted small mb-3">{subtitle}</p>}
          </div>
          {points.length > 0 && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setShowTable((v) => !v)}
            >
              {showTable ? "Chart" : "Table"}
            </Button>
          )}
        </div>

        {points.length === 0 ? (
          <p className="text-muted text-center my-5">No activity in this period.</p>
        ) : showTable ? (
          // Every value in the chart is also readable here — a tooltip must never
          // be the only way to get at a number.
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <Table size="sm" className="mb-0 text-nowrap">
              <thead className="table-light">
                <tr>
                  <th>{granularity === "hour" ? "Hour" : "Date"}</th>
                  {series.map((sr) => (
                    <th key={sr.name} className="text-end">{sr.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, i) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {series.map((sr) => (
                      <td key={sr.name} className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {nfmt(sr.data[i])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Chart options={options} series={series} type="line" height={300} />
        )}
      </Card.Body>
    </Card>
  );
};

// Compare magnitude across apps, several measures -> grouped bars.
// Horizontal, because app names are words and read better on the left.
export const AppComparisonChart = ({ rows = [], title, subtitle }) => {
  // Biggest at the top: a comparison chart should read as a ranking.
  const ordered = [...rows].sort(
    (a, b) => (a.metrics?.joinedUsers || 0) - (b.metrics?.joinedUsers || 0)
  );
  const apps = ordered.map((r) => String(r.app?.name ?? r.app?.id ?? ""));
  const series = [
    { name: "Users joined", data: ordered.map((r) => r.metrics?.joinedUsers || 0) },
    { name: "Deposit users", data: ordered.map((r) => r.metrics?.depositUsers || 0) },
    { name: "Free-call users", data: ordered.map((r) => r.metrics?.freeCallUsers || 0) },
  ];

  const options = baseOptions({
    colors: SERIES_COLORS,
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,                 // 4px rounded data-end
        borderRadiusApplication: "end",  // anchored to the baseline
        columnWidth: "60%",
        barHeight: "70%",
      },
    },
    // 2px of surface between adjacent fills.
    stroke: { show: true, width: 2, colors: ["transparent"] },
    // Horizontal bars flip the axes: y carries the app names, x carries the
    // counts, so the number formatter belongs on x here.
    xaxis: {
      ...baseOptions().xaxis,
      categories: apps,
      labels: {
        style: { colors: INK.secondary, fontSize: "12px" },
        formatter: (v) => nfmt(v),
      },
    },
    yaxis: {
      labels: {
        style: { colors: INK.secondary, fontSize: "12px" },
        formatter: (v) => v,
        maxWidth: 160,
      },
    },
    tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: (v) => nfmt(v) } },
  });

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <h5 className="mb-1">{title}</h5>
        {subtitle && <p className="text-muted small mb-3">{subtitle}</p>}
        {rows.length === 0 ? (
          <p className="text-muted text-center my-5">No data to compare.</p>
        ) : (
          <Chart
            options={options}
            series={series}
            type="bar"
            height={Math.max(260, rows.length * 62)}
          />
        )}
      </Card.Body>
    </Card>
  );
};

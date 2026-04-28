import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TasksPerformance1 = ({ dashboardcountdata }) => {
  const [percentages, setPercentages] = useState({
    Token_sold: 0,
    balance: 0,
    events:0,
    users:0,
    deposit: 0,
    withdraw: 0,
  });

   const [barpercentages, setBarPercentages] = useState({
     deposit: 0,
     withdraw: 0,
   });
  const barChartCategories = ["USDT", "INR", "BNB", "POL"];
console.log('dashboardcountdata :>> ', dashboardcountdata);
  useEffect(() => {
    if (dashboardcountdata) {
      calculatePercentages(dashboardcountdata);
      calculatebarPercentage();
    }
  }, [dashboardcountdata]);

  const calculatePercentages = (data) => {
    console.log('data :>> ', data);
    const token_sold = Number(data?.totalTokensBought || 0);
    const balance = Number(data?.totalBookings || 0);
    const events = Number(data?.totalEvents || 0);
    const users = Number(data?.totalUsers || 0);

    


    const totalPie = token_sold + balance + events + users;


    setPercentages({
      Token_sold: totalPie ? ((token_sold / totalPie) * 100).toFixed(2) : 0,
      balance: totalPie ? ((balance / totalPie) * 100).toFixed(2) : 0,
      events: totalPie ? ((events / totalPie) * 100).toFixed(2) : 0,
      users: totalPie ? ((users / totalPie) * 100).toFixed(2) : 0,

     
    });
  };





console.log('percentages :>> ', percentages);
  const pieChartSeries = [
    Number(dashboardcountdata?.totalEvents || 0),
    Number(dashboardcountdata?.totalUsers || 0),
    Number(dashboardcountdata?.totalTokensBought || 0),
    Number(dashboardcountdata?.totalBookings || 0),
  ];


      const depositUSTD = Number(
        dashboardcountdata?.approvedDeposits?.USDT || 0
      );
      const depositINR = Number(dashboardcountdata?.approvedDeposits?.INR || 0);
      const depositBNB = Number(dashboardcountdata?.approvedDeposits?.BNB || 0);
      const depositPOL = Number(dashboardcountdata?.approvedDeposits?.POL || 0);

      const withdrawUSTD = Number(
        dashboardcountdata?.approvedwithdraw?.USDT || 0
      );
      const withdrawINR = Number(
        dashboardcountdata?.approvedwithdraw?.INR || 0
      );
      const withdrawBNB = Number(
        dashboardcountdata?.approvedwithdraw?.BNB || 0
      );
      const withdrawPOL = Number(
        dashboardcountdata?.approvedwithdraw?.POL || 0
      );


        const calculatebarPercentage = () => {
          const TotalDeposit =
            depositUSTD + depositINR + depositBNB + depositPOL;
            const TotalWithdraw =
              withdrawUSTD + withdrawINR + withdrawBNB + withdrawPOL;
       
       const TotalBarPercentage = TotalDeposit + TotalWithdraw;
            
       setBarPercentages({
         deposit: TotalBarPercentage
           ? ((TotalDeposit / TotalBarPercentage) * 100).toFixed(2)
           : 0,
         withdraw: TotalBarPercentage
           ? ((TotalWithdraw / TotalBarPercentage) * 100).toFixed(2)
           : 0,
       });
      };
   const barChartSeries = [
     {
       name: "Deposit",
       data: [depositUSTD, depositINR, depositBNB, depositPOL],
     },
     {
       name: "Withdraw",
       data: [withdrawUSTD, withdrawINR, withdrawBNB, withdrawPOL],
     },
   ];

  const pieChartOptions = {
    chart: { type: "pie" },
    labels: ["Total Events", "Total Users", "Token Sold", "Total Appointments"],
    colors: ["#ffee00ff", "#c300ffff", "#00BFFF", "#FF8C00"],
    responsive: [{ breakpoint: 480, options: { chart: { height: 280 } } }],
  };

   const barChartOptions = {
     chart: {
       type: "bar",
       height: 350,
       stacked: false,
     },
     plotOptions: {
       bar: {
         horizontal: false,
         columnWidth: "45%",
       },
     },
     colors: ["#28a745", "#dc3545"],
     xaxis: {
       categories: barChartCategories,
       title: { text: "Currency" },
     },
     legend: {
       position: "bottom",
     },
     dataLabels: {
       enabled: true,
     },
     tooltip: {
       y: {
         formatter: (val) => `${val}`,
       },
     },
   };

  return (
    <Card className="h-98">
      <Card.Body>
        <h4 className="mb-4 text-center">Statistics Overview</h4>

        <div className="mb-5">
          <Chart
            options={pieChartOptions}
            series={pieChartSeries}
            type="pie"
            height={300}
          />
          <div className="d-flex justify-content-around mt-4">
            <div className="text-center">
              <h1 className="fw-bold">{percentages.events}%</h1>
              <p>Total Events</p>
            </div>
            <div className="text-center">
              <h1 className="fw-bold">{percentages.users}%</h1>
              <p>Total Users</p>
            </div>

            <div className="text-center">
              <h1 className="fw-bold">{percentages.Token_sold}%</h1>
              <p>Token Sold</p>
            </div>
            <div className="text-center">
              <h1 className="fw-bold">{percentages.balance}%</h1>
              <p>Total Bookings</p>
            </div>
          </div>
        </div>

        <h4 className="mb-4 text-center text-bold">Deposit Withdraw Statistics </h4>

        <div className="mb-4">
          <Chart
            options={barChartOptions}
            series={barChartSeries}
            type="bar"
            height={300}
          />
          <div className="d-flex justify-content-around mt-4">
            <div className="text-center">
              <h1 className="fw-bold">{barpercentages.deposit}%</h1>
              <p>Total Deposit</p>
            </div>
            <div className="text-center">
              <h1 className="fw-bold">{barpercentages.withdraw}%</h1>
              <p>Total Withdraw</p>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TasksPerformance1;

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const data = {
  labels: ["January", "February", "March", "April", "May"],
  datasets: [
    {
      label: "Engagement",
      data: [65, 59, 80, 81, 56],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Social Media Engagement",
    },
  },
};

const AnalyticsDashboard = () => {
  return (
    <div className="analytics-dashboard">
      <Bar data={data} options={options} />
    </div>
  );
};

export default AnalyticsDashboard;

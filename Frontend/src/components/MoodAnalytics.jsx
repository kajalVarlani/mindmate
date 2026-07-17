import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./MoodAnalytics.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MoodAnalytics({ journals = [] }) {
  if (!journals || journals.length === 0) {
    return (
      <div className="mood-analytics-empty">
        <p>Write your first reflection to visualize your mood insights.</p>
      </div>
    );
  }

  // Count occurrences of each mood
  const moodCounts = {
    happy: 0,
    sad: 0,
    anxious: 0,
    calm: 0,
    angry: 0,
  };

  journals.forEach((j) => {
    const m = j.mood?.toLowerCase();
    if (moodCounts[m] !== undefined) {
      moodCounts[m]++;
    }
  });

  const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);

  const moodLabels = {
    happy: "😊 Happy",
    sad: "😔 Sad",
    anxious: "😟 Anxious",
    calm: "😌 Calm",
    angry: "😡 Angry",
  };

  const moodColors = {
    happy: "#FFD166", // Warm Yellow
    sad: "#118AB2",   // Sky Blue
    anxious: "#8338EC", // Lavender Purple
    calm: "#06D6A0",  // Mint Green
    angry: "#EF476F",  // Coral Rose
  };

  const activeMoods = Object.keys(moodCounts).filter((m) => moodCounts[m] > 0);
  const dataValues = activeMoods.map((m) => moodCounts[m]);
  const backgroundColors = activeMoods.map((m) => moodColors[m]);
  const labels = activeMoods.map((m) => moodLabels[m]);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.1)",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll render a custom premium legend below/beside for better aesthetics
      },
      tooltip: {
        backgroundColor: "rgba(26, 26, 46, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(104, 96, 230, 0.3)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const val = context.raw;
            const percentage = ((val / total) * 100).toFixed(0);
            return ` ${context.label}: ${val} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "75%",
  };

  return (
    <div className="mood-analytics-card">
      <h3 className="analytics-title">Mood Spectrum</h3>
      <div className="chart-container-wrapper">
        <div className="chart-wrapper">
          <Doughnut data={data} options={options} />
          <div className="chart-center-text">
            <span className="center-count">{total}</span>
            <span className="center-label">Entries</span>
          </div>
        </div>
      </div>

      <div className="mood-legend">
        {activeMoods.map((mood) => {
          const count = moodCounts[mood];
          const pct = ((count / total) * 100).toFixed(0);
          return (
            <div key={mood} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: moodColors[mood] }}
              />
              <span className="legend-name">{moodLabels[mood]}</span>
              <span className="legend-value">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

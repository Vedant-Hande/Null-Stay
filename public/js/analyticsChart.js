document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.chartData === "undefined") return;

  const titles = window.chartData.titles || [];
  const ratings = window.chartData.ratings || [];
  const reviews = window.chartData.reviews || [];

  const ratingsCtx = document.getElementById("ratingsChart");
  if (ratingsCtx) {
    new Chart(ratingsCtx, {
      type: "bar",
      data: {
        labels: titles,
        datasets: [{
          label: "Average Rating",
          data: ratings,
          backgroundColor: "rgba(255, 56, 92, 0.75)",
          borderColor: "rgba(255, 56, 92, 1)",
          borderWidth: 1.5,
          borderRadius: 12,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            grid: {
              color: "rgba(0, 0, 0, 0.04)"
            },
            ticks: {
              stepSize: 1,
              font: { size: 11, weight: "500" }
            }
          },
          x: {
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  const reviewsCtx = document.getElementById("reviewsChart");
  if (reviewsCtx) {
    new Chart(reviewsCtx, {
      type: "bar",
      data: {
        labels: titles,
        datasets: [{
          label: "Total Reviews",
          data: reviews,
          backgroundColor: "rgba(37, 99, 235, 0.75)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1.5,
          borderRadius: 12,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.04)"
            },
            ticks: {
              precision: 0,
              font: { size: 11, weight: "500" }
            }
          },
          x: {
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
});

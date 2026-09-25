const calculateAvgRating = (reviews) => {
  if (!reviews || reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  return (total / reviews.length).toFixed(1);
};

export default calculateAvgRating;

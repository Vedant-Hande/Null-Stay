// Reviews Modal Logic
function showAllReviews() {
    document.getElementById('reviewsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReviews() {
    document.getElementById('reviewsModal').classList.add('hidden');
    document.body.style.overflow = '';
}

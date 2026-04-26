// Reviews Modal Logic
function showAllReviews() {
    document.getElementById('reviewsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReviews() {
    document.getElementById('reviewsModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Photos Modal Logic
function showPhotosModal() {
    document.getElementById('photosModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePhotosModal() {
    document.getElementById('photosModal').classList.add('hidden');
    document.body.style.overflow = '';
}

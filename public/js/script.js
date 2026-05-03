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

// Airbnb Style Search Bar Logic
document.addEventListener("DOMContentLoaded", () => {
    const searchPill = document.getElementById('searchPill');
    const expandedSearch = document.getElementById('expandedSearch');
    const backdrop = document.getElementById('searchBackdrop');

    if (searchPill && expandedSearch && backdrop) {
        // Open Search
        searchPill.addEventListener('click', () => {
            backdrop.classList.remove('hidden');
            expandedSearch.classList.remove('hidden');
            
            // Allow CSS transitions to play
            setTimeout(() => {
                backdrop.classList.add('opacity-100');
                expandedSearch.classList.add('opacity-100', 'scale-100');
                expandedSearch.classList.remove('scale-95');
                searchPill.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
            }, 10);
        });

        // Close Search function
        const closeSearch = () => {
            backdrop.classList.remove('opacity-100');
            expandedSearch.classList.remove('opacity-100', 'scale-100');
            expandedSearch.classList.add('scale-95');
            searchPill.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
            
            setTimeout(() => {
                backdrop.classList.add('hidden');
                expandedSearch.classList.add('hidden');
            }, 300);
        };

        // Close on backdrop click
        backdrop.addEventListener('click', closeSearch);

        // Close on scroll (classic Airbnb)
        window.addEventListener('scroll', () => {
            if (!expandedSearch.classList.contains('hidden')) {
                closeSearch();
            }
        });
    }

    // User Dropdown Logic
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !userDropdown.classList.contains('opacity-0');
            if (isOpen) {
                userDropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                userDropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            } else {
                userDropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                userDropdown.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                userDropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            }
        });
    }
});

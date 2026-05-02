// --- Scrapbook Modal Logic ---
const modal = document.getElementById('scrapbookModal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');

function openScrapbook(title, location, date, imgUrl) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalLocation').innerHTML = `<i class="fa-solid fa-location-dot mr-1 text-airbnb"></i> ${location}`;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalImg').src = imgUrl;
    
    modal.classList.remove('hidden');
    // small delay to allow display block to apply before transition
    setTimeout(() => {
        modal.classList.add('modal-show');
        modalContent.classList.add('modal-content-show');
    }, 10);
}

function closeModal() {
    modal.classList.remove('modal-show');
    modalContent.classList.remove('modal-content-show');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

if(closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}
if(modal) {
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });
}


// --- Interactive Map Logic (Leaflet) ---
const toggleMapBtn = document.getElementById('toggleMapBtn');
const treeContainer = document.getElementById('treeContainer');
const mapContainer = document.getElementById('mapContainer');
let map = null;
let mapVisible = false;

// Custom map marker icon
let customIcon;
if(typeof L !== 'undefined') {
    customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class='bg-airbnb text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white'><i class="fa-solid fa-house"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

if(toggleMapBtn) {
    toggleMapBtn.addEventListener('click', () => {
        mapVisible = !mapVisible;
        
        if(mapVisible) {
            // Show Map
            toggleMapBtn.innerHTML = '<i class="fa-solid fa-sitemap"></i> <span>Tree View</span>';
            treeContainer.classList.add('hidden');
            mapContainer.classList.remove('hidden');
            
            setTimeout(() => { mapContainer.classList.remove('opacity-0'); }, 50);

            if(!map) {
                // Initialize map centered between US and Europe/Asia
                map = L.map('map', { zoomControl: false }).setView([30, -20], 2);
                
                // Add a beautiful dark/clean tile layer (CartoDB Positron)
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                // Add Coordinates for Past Trips
                const trips = [
                    { name: "Skyline Penthouse", coords: [40.7128, -74.0060], loc: "New York" },
                    { name: "Oceanfront Villa", coords: [34.0259, -118.7798], loc: "Malibu" },
                    { name: "Tropical Estate", coords: [-8.3405, 115.0920], loc: "Bali" },
                    { name: "Alpine Cabin", coords: [46.8182, 8.2275], loc: "Swiss Alps" }
                ];

                // Add markers
                trips.forEach(trip => {
                    L.marker(trip.coords, {icon: customIcon})
                     .bindPopup(`<b>${trip.name}</b><br>${trip.loc}`)
                     .addTo(map);
                });

                // Draw connecting flight lines
                const latlngs = [
                    trips[0].coords, // NY
                    trips[1].coords, // Malibu
                    trips[2].coords  // Bali
                ];
                const latlngs2 = [
                    trips[0].coords, // NY
                    trips[3].coords  // Swiss Alps
                ];

                L.polyline(latlngs, {color: '#ff385c', weight: 3, dashArray: '5, 10'}).addTo(map);
                L.polyline(latlngs2, {color: '#ff385c', weight: 3, dashArray: '5, 10'}).addTo(map);
            } else {
                map.invalidateSize();
            }
        } else {
            // Show Tree
            toggleMapBtn.innerHTML = '<i class="fa-solid fa-globe"></i> <span>Globe View</span>';
            mapContainer.classList.add('opacity-0');
            setTimeout(() => { 
                mapContainer.classList.add('hidden'); 
                treeContainer.classList.remove('hidden');
            }, 500);
        }
    });
}


// --- Export & Share Logic (html2canvas) ---
const shareBtn = document.getElementById('shareBtn');
if(shareBtn) {
    shareBtn.addEventListener('click', () => {
        // Show a loading state on button
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Capturing...';
        
        const container = document.getElementById('exportContainer');
        
        // Ensure we are in tree view before capturing
        if(mapVisible) toggleMapBtn.click();

        setTimeout(() => {
            html2canvas(container, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'My-NullStay-Legacy.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                shareBtn.innerHTML = originalText;
            }).catch(err => {
                console.error("Export failed", err);
                shareBtn.innerHTML = originalText;
                alert("Oops! Failed to capture image.");
            });
        }, 500); // give time for UI updates
    });
}


// --- AI Drafting Logic ---
const draftBtn = document.getElementById('draftBranchBtn');
const suggestionsList = document.getElementById('aiSuggestionsList');

if(draftBtn) {
    draftBtn.addEventListener('click', () => {
        // Show loading state
        draftBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-airbnb"></i> Analyzing preferences...';
        
        setTimeout(() => {
            // Create new suggestion node HTML
            const newNodeHTML = `
                <li>
                    <div class="w-56 md:w-64 cursor-pointer relative z-10 bg-white p-2 rounded-xl transition-all duration-500 hover:-translate-y-2 group scale-0 animate-pop-in">
                        <div class="block">
                            <div class="aspect-square w-full relative overflow-hidden rounded-xl mb-3 border-2 border-blue-300 shadow-sm">
                                <div class="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded z-30 shadow-sm uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-sparkles"></i> AI Drafted</div>
                                <img src="https://images.unsplash.com/photo-1542314831-c6a4d14cdce8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" class="object-cover h-full w-full group-hover:scale-105 transition duration-500">
                            </div>
                            <div class="flex flex-col text-left px-1">
                                <div class="flex flex-row justify-between items-start">
                                    <div class="font-semibold text-base text-gray-900 truncate pr-2">Santorini, Greece</div>
                                </div>
                                <div class="font-light text-neutral-500 text-sm truncate">Cliffside Cave House</div>
                                <div class="font-bold text-blue-500 text-xs mt-1">Based on new preferences</div>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            
            // Append to the suggestions row
            suggestionsList.insertAdjacentHTML('beforeend', newNodeHTML);
            
            // Add animation class logic
            setTimeout(() => {
                suggestionsList.lastElementChild.querySelector('div').classList.remove('scale-0');
                suggestionsList.lastElementChild.querySelector('div').classList.add('scale-100');
            }, 50);

            // Reset button
            draftBtn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i> Branch Added';
            setTimeout(() => {
                draftBtn.innerHTML = '<i class="fa-solid fa-plus bg-rose-50 text-airbnb p-2 rounded-full text-sm"></i> Draft Future Branch';
            }, 3000);

        }, 1500); // Fake AI loading delay
    });
}

/* filepath: /c:/xampp/htdocs/GPS_TRACKER/script.js */

let map;
let marker;
let pathCoordinates = [];
let polyline;
let lastLatitude = null;
let lastLongitude = null;
let streetViewLayer;
let trackingMode = false; // Mode tracking
let historyData = []; // Array to store history data

const channelID = '2828225';
const readAPIKey = '7WHK02942ZS2MFP3';

function initMap() {
    const initialLocation = [-6.1751, 106.8650]; // Jakarta, Indonesia
    map = L.map('map').setView(initialLocation, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(initialLocation).addTo(map)
        .bindPopup('Current Location')
        .openPopup();

    polyline = L.polyline(pathCoordinates, { color: 'red' }).addTo(map);

    // Inisialisasi street view layer
    streetViewLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google'
    });

    // Ambil data GPS dari ThingSpeak setiap 5 detik
    setInterval(updateLocation, 5000);

    // Tambahkan event listener untuk tombol
    document.getElementById('focusPlotter').addEventListener('click', focusOnPlotter);
    document.getElementById('toggleStreetView').addEventListener('click', toggleStreetView);
    document.getElementById('toggleTracking').addEventListener('click', toggleTracking);
    document.getElementById('downloadHistory').addEventListener('click', toggleDownloadMenu);
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('toggleHistoryMenu').addEventListener('click', toggleSidebar);
    document.getElementById('menuHistory').addEventListener('click', showHistory);
    document.getElementById('menuMaps').addEventListener('click', showMap);

    // Event listener untuk menutup menu dropdown ketika mengklik di luar menu
    document.addEventListener('click', closeDownloadMenuOnClickOutside);

    // Event listener untuk mengatur visibilitas elemen berdasarkan ukuran layar
    window.addEventListener('resize', handleResize);
    handleResize(); // Panggil sekali untuk mengatur visibilitas awal
}

function updateLocation() {
    // Mengambil data dari ThingSpeak API
    fetch(`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`)
        .then(response => response.json())
        .then(data => {
            console.log("Data from ThingSpeak:", data); // Tambahkan log ini
            if (data.feeds.length > 0) {
                const feed = data.feeds[0];
                const latitude = parseFloat(feed.field1);
                const longitude = parseFloat(feed.field2);

                // Periksa apakah koordinat berubah
                if (latitude !== lastLatitude || longitude !== lastLongitude) {
                    // Update marker
                    const newLocation = [latitude, longitude];
                    marker.setLatLng(newLocation);

                    // Update history track
                    const historyItem = document.createElement("li");
                    historyItem.innerHTML = `
                        <span>Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}</span>
                        <span class="history-time">${new Date().toLocaleTimeString()}</span>
                    `;
                    document.getElementById("historyList").appendChild(historyItem);

                    // Simpan data history
                    historyData.push({
                        latitude: latitude.toFixed(4),
                        longitude: longitude.toFixed(4),
                        time: new Date().toLocaleTimeString()
                    });

                    if (trackingMode) {
                        // Update path hanya jika tracking mode aktif
                        pathCoordinates.push(newLocation);
                        polyline.setLatLngs(pathCoordinates);
                    }

                    // Simpan koordinat terbaru
                    lastLatitude = latitude;
                    lastLongitude = longitude;
                }
            }
        })
        .catch(error => console.error("Error fetching GPS data from ThingSpeak: ", error));
}

function focusOnPlotter() {
    if (lastLatitude !== null && lastLongitude !== null) {
        map.setView([lastLatitude, lastLongitude], 14);
    }
}

function toggleStreetView() {
    if (map.hasLayer(streetViewLayer)) {
        map.removeLayer(streetViewLayer);
    } else {
        map.addLayer(streetViewLayer);
    }
}

function toggleTracking() {
    trackingMode = !trackingMode;
    if (trackingMode) {
        document.getElementById('toggleTracking').textContent = 'STOP TRACKING';
    } else {
        document.getElementById('toggleTracking').textContent = 'TRACKING';
        // Clear the path when tracking is stopped
        pathCoordinates = [];
        polyline.setLatLngs(pathCoordinates);
        document.getElementById("historyList").innerHTML = '';
    }
}

function toggleDownloadMenu(event) {
    event.stopPropagation(); // Prevent the click event from bubbling up to the document
    const downloadMenu = document.getElementById('downloadMenu');
    downloadMenu.style.display = downloadMenu.style.display === 'block' ? 'none' : 'block';
}

function closeDownloadMenuOnClickOutside(event) {
    const downloadMenu = document.getElementById('downloadMenu');
    const downloadButton = document.getElementById('downloadHistory');
    if (downloadMenu.style.display === 'block' && !downloadButton.contains(event.target)) {
        downloadMenu.style.display = 'none';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.display === 'block') {
        sidebar.style.display = 'none';
    } else {
        sidebar.style.display = 'block';
    }
}

function showHistory() {
    const history = document.getElementById('history');
    const map = document.getElementById('map');
    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('container');
    history.style.display = 'block';
    map.style.display = 'none';
    sidebar.style.display = 'none';
    container.classList.add('history-only'); // Tambahkan kelas untuk menyembunyikan tombol lainnya
}

function showMap() {
    const history = document.getElementById('history');
    const map = document.getElementById('map');
    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('container');
    history.style.display = 'none';
    map.style.display = 'block';
    sidebar.style.display = 'none';
    container.classList.remove('history-only'); // Hapus kelas untuk menampilkan tombol lainnya
}

function handleResize() {
    const width = window.innerWidth;
    const history = document.getElementById('history');
    const map = document.getElementById('map');
    const sidebar = document.getElementById('sidebar');
    const historyMenuButton = document.getElementById('toggleHistoryMenu');
    const container = document.getElementById('container');

    if (width > 768) {
        // Tampilan besar: tampilkan peta dan history bersama
        history.style.display = 'block';
        map.style.display = 'block';
        sidebar.style.display = 'none';
        historyMenuButton.style.display = 'none';
        container.classList.remove('history-only'); // Hapus kelas untuk menampilkan tombol lainnya
    } else {
        // Tampilan kecil: tampilkan hanya peta, sembunyikan history
        history.style.display = 'none';
        map.style.display = 'block';
        historyMenuButton.style.display = 'block';
    }
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("History Data", 10, 10);
    let row = 20;
    historyData.forEach((data, index) => {
        doc.text(`${index + 1}. Latitude: ${data.latitude}, Longitude: ${data.longitude}, Time: ${data.time}`, 10, row);
        row += 10;
    });
    doc.save("history_data.pdf");
}

function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(historyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "History Data");
    XLSX.writeFile(workbook, "history_data.xlsx");
}

// Panggil fungsi initMap untuk memulai peta
window.onload = initMap;
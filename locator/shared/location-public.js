import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { db } from './firebase.js';
import { LOCATION_PATH } from './config.js';
import { loadGoogleMaps } from './maps.js';

const statusMessage = document.querySelector('#status-message');
const locationContent = document.querySelector('#location-content');
const latitude = document.querySelector('#latitude');
const longitude = document.querySelector('#longitude');
const accuracy = document.querySelector('#accuracy');
const updatedAt = document.querySelector('#updated-at');
const mapElement = document.querySelector('#map');

let map;
let marker;

function isActiveLocation(location) {
  return Boolean(
    location &&
      location.active === true &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      typeof location.updatedAt === 'number' &&
      typeof location.expiresAt === 'number' &&
      location.expiresAt > Date.now(),
  );
}

function showInactive() {
  statusMessage.textContent = 'Jorge is not sharing his location right now.';
  locationContent.classList.add('hidden');
}

async function showActive(location) {
  statusMessage.textContent = 'Jorge is sharing his live location.';
  locationContent.classList.remove('hidden');

  latitude.textContent = String(location.lat);
  longitude.textContent = String(location.lng);
  accuracy.textContent = typeof location.accuracy === 'number' ? `${location.accuracy} meters` : 'Unavailable';
  updatedAt.textContent = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(location.updatedAt));

  const position = { lat: location.lat, lng: location.lng };
  const maps = await loadGoogleMaps();

  if (!map) {
    map = new maps.Map(mapElement, {
      center: position,
      zoom: 18,
      clickableIcons: false,
      fullscreenControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });
    marker = new maps.Marker({ map, position, title: 'Jorge Ranilla' });
  } else {
    map.setCenter(position);
    marker.setPosition(position);
  }
}

onValue(ref(db, LOCATION_PATH), (snapshot) => {
  const location = snapshot.val();

  if (!isActiveLocation(location)) {
    showInactive();
    return;
  }

  showActive(location).catch(() => {
    statusMessage.textContent = 'Jorge is sharing his live location.';
    locationContent.classList.add('hidden');
  });
});

'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration) {
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }
}
class Cycling extends Workout {
    type = "Cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcPace();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Running extends Workout {
    type = "Running";

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcSpeed();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// Applcaition artictecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField)
    }
    // Methods
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("Couldn't get the position");
            })
        } else alert("Couldn't get the geolocation please check your gps");
    }
    _loadMap(pos) {
        const { latitude } = pos.coords;
        const { longitude } = pos.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling click on map
        this.#map.on('click', this._showForm.bind(this))
    }
    _showForm(mapEv) {
        this.#mapEvent = mapEv;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const postiveNumber = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        // Get data from from
        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // If workout cycling , create cycling object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // check if data is valid
            if (!validInputs(cadence, distance, duration) || !postiveNumber(distance, duration, cadence))
                return alert("Input have to be positive numbers");
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // If workout running , create running object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // check if data is valid
            if (!validInputs(elevation, distance, duration) || !postiveNumber(distance, duration))
                return alert("Input have to be positive numbers");

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        this.#workouts.push(workout);
        // Add new object to array
        // Render workout on map as marker
        this.renderWorkoutMarker(workout);
    }
    renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`
                }))
            .setPopupContent(`${workout.distance} `)
            .openPopup();
    }

}


const app = new App();




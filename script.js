'use strict';

class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescrition() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth() + 1]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescrition();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
class Running extends Workout {
    type = "running";

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescrition();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
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
    #mapZoomLevel = 13;
    constructor() {
        // get the user position
        this._getPosition();
        // get the local data
        this._getLocalStorage();
        // set the event listener
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling click on map
        this.#map.on('click', this._showForm.bind(this))
        // looping the workout
        this.#workouts.forEach(work => {
            this._renderWorkout(work)
            this._renderWorkoutMarker(work)
        })
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
    _hideForm() {
        inputDistance.value = inputDistance.value = inputCadence.value = inputElevation.value = "";
        form.classList.add('hidden')
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
        // Add new object to array
        this.#workouts.push(workout);
        // Render workout
        this._renderWorkout(workout);
        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // hide and clear the form
        this._hideForm();

        // set the local storage
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
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
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description} `)
            .openPopup();
    }
    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--running" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `

        if (workout.type === 'running') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit"></span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`
        }

        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            /li>`
        }

        form.insertAdjacentHTML('afterend', html);
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        })

        // using public interface
        workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        if (!data) return;

        this.#workouts = data;

    }
    reset() {
        localStorage.removeItem('workouts');
    }

}


const app = new App();
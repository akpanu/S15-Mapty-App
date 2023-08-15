'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// global variables
// let map;
// let mapEvent;

// Parent class declaration
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  // object sonstructor
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    //prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  // _click() {
  //   this.clicks++;
  // }
}
class Running extends Workout {
  type = `running`;
  constructor(coords, distance, duration, cadence) {
    // use super as first statement when calling
    // parent class constructor. it sets the this keyword
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = `cycling`;
  constructor(coords, distance, duration, elevationGain) {
    // use super as first statement when calling
    // parent class constructor. it sets the this keyword
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // convert to hour
    return this.speed;
  }
}
const running1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 5.2, 24, 254);
//
console.log(`Value of running and cylcing objects:`);
console.log(running1);
console.log(cycling1);

////////////////////////////////
///APPLICATION ARCHITECTURE/////
class App {
  // private class properties
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // get user's postion
    this._getPosition();

    // get user's info from local storage
    this._getLocalStorage();

    // attach event handlers
    form.addEventListener(`submit`, this._newWorkout.bind(this));
    inputType.addEventListener(`change`, this._toggleElevationForm);
    containerWorkouts.addEventListener(`click`, this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      alert(`Location is accessible`);
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Location not accessible`);
        }
      );
    }
  }

  _loadMap(position) {
    // console.log(`the value of this keyword is: `, this);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(
    //   `Coordinates of my current location: Lat: ${latitude}, Long: ${longitude}`
    // );
    console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Positioning marker at click point
    this.#map.on(`click`, this._showForm.bind(this));

    // L.marker([51.5, -0.09])

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ``;
    inputDistance.focus();
    form.style.display = `none`;
    form.classList.add(`hidden`);
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationForm() {
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  _newWorkout(e) {
    e.preventDefault();
    // valid input checker helper method
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    // all positive numbers checker helper method
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // 1. get data from from
    const type = inputType.value;
    const duration = +inputDuration.value; // + sign converst to number automatically
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 2. check if it is valid

    // if workout running, create running object
    if (type === `running`) {
      const cadence = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Inputs have to be positive numbers`);
      // if values are valid
      workout = new Running([lat, lng], distance, duration, cadence);
      // this.#workouts.push(workout);
    }

    // if workout cycling, create cycling object
    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`Inputs have to be positive numbers`);
      // if values are valid
      workout = new Cycling([lat, lng], distance, duration, elevation);
      // this.#workouts.push(workout);
    }
    // add workout to workout array
    this.#workouts.push(workout);

    // render workout on the map as marker
    this._renderWorkoutMarker(workout);

    // render workout list on side bar on web page
    this._renderWorkout(workout);

    // clear input fields and hide form
    this._hideForm();

    // set new workouts into local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === `running`) {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    }
    if (workout.type === `cycling`) {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return; // if there is no workout element then return
    console.log(`Element clicked is: `, workoutEl);
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    // available on all map objects
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout._click();
  } // end method _moveToPopup

  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  } // end method _setLocalStorage;

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem(`workouts`));
    // console.log('The data in local storage is', data);
    if (!data) return;

    // restore data from local storage into empty workouts array
    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      // this._renderWorkoutMarker(work).bind(this);
    });

    // this.#workouts.forEach(work2 => this._renderWorkoutMarker(work2));

    // containerWorkouts.addEventListener(`click`, this._moveToPopup.bind(this));

    console.log(`Loaded workouts`, this.#workouts);
  } // end method _getLocalStorage;
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// creating a new App object
const app1 = new App();

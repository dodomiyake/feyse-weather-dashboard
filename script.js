// Create an empty array to store searched cities or retrieve existing data from localStorage
var cities = JSON.parse(localStorage.getItem('cities')) || [];

// Attach a click event listener to the search button
$("#search-button").on("click", function (event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Retrieve the entered city name from the input box
  var city = $("#search-input").val().trim();

  // Define the API key for OpenWeatherMap
  var APIKey = "f05ce3ea0316fc22f85e295dddf3a196";

  // Construct the URL for querying weather data using OpenWeatherMap API
  var queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}`;
  var forecastQuery = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${APIKey}`;

  // Perform a Fetch API call to retrieve weather data
  fetch(queryURL)
    .then(handleResponse)
    .then(function (data) {
      // Extract and trim the city name from the input, then add it to the cities array
      cities.push({ name: city, data: data });

      // Save the updated cities array to localStorage
      localStorage.setItem('cities', JSON.stringify(cities));

      // Invoke the renderButtons function to update the displayed city buttons
      renderButtons();

      // Render the current weather information for the clicked city
      renderCurrentWeather(data);
    })
    .catch(function (error) {
      // Handle errors, such as city not found
      console.error(error);
      // Alert the user about the error and prompt them to input a correct city
      alert("City not found. Please enter a valid city name.");
    });

  // Perform a Fetch API call to retrieve forecast data
  fetch(forecastQuery)
    .then(handleResponse)
    .then(renderForecast)
    .catch(function (error) {
      // Handle errors, such as city not found
      console.error(error);
    });

  // Reset the input field after a successful search
  $("#search-input").val("");
});

// Function to handle response and check for errors
function handleResponse(response) {
  // Check if the response status is OK (200)
  if (response.ok) {
    // Extract JSON data from the response
    return response.json();
  } else {
    // If response status is not OK, handle the error
    throw new Error("City not found");
  }
}

// Function to render current weather information
function renderCurrentWeather(data) {
  // Clear the existing content in the "today" container
  $("#today").empty();

  // Log the retrieved data to the console
  console.log(data);

  // Format the current date
  var now = dayjs().format("DD/MM/YYYY");
  var cityName = $("<h2>").addClass("fw-bold");
  var weatherIcon = data.weather[0].icon;
  var iconImg = `https://openweathermap.org/img/wn/${weatherIcon}.png`;
  var weatherImg = $("<img>").attr("src", iconImg);

  cityName.text(`${data.name} (${now})`);

  var weatherDiv = $("<div>").addClass("d-flex");

  weatherDiv.append(cityName, weatherImg);

  $("#today").append(weatherDiv);

  // Convert the temperature to Celsius
  var tempC = data.main.temp - 273.15;

  var temp = $("<div>").addClass("temperature mb-4");
  var wind = $("<div>").addClass("wind mb-4");
  var humidity = $("<div>").addClass("humidity mb-4");

  temp.text(`Temp: ${tempC.toFixed(2)}°C`);
  wind.text(`Wind: ${data.wind.speed} KPH`);
  humidity.text(`Humidity: ${data.main.humidity}%`);

  $("#today").append(temp);
  $("#today").append(wind);
  $("#today").append(humidity);
}

// Function to render forecast information
function renderForecast(data) {
  // Clear the existing content in the "forecast" container
  $("#forecast").empty();

  var forecastHeader = $("<h5>").addClass("fw-bold").text("5-Day Forecast:");
  $("#forecast").append(forecastHeader);

  // Create a new row for the forecast items
  var forecastRow = $("<div>").addClass("row");

  // Loop through the forecast items
  for (var i = 1; i < data.list.length; i += 8) {
    var forecastItem = data.list[i];
    console.log(data.list[i]);

    // Create a new list item for each forecast item
    var forecastList = $("<li>").addClass("list-group-item col-md-2 mx-3 mb-3 p-3 bg-dark text-white");
    var forecastWind = $("<div>").addClass("windEl").text(`Wind: ${forecastItem.wind.speed} KPH`);
    var forecastHum = $("<div>").addClass("humidityEl").text(`Humidity: ${forecastItem.main.humidity}%`);

    // Format the forecast date
    var forecastDate = dayjs(forecastItem.dt_txt).add(1, 'day').format("DD/MM/YYYY");
    var forecastIcon = forecastItem.weather[0].icon;
    var forecastIconImg = `https://openweathermap.org/img/wn/${forecastIcon}.png`;
    var forecastImg = $("<img>").attr("src", forecastIconImg);
    var forecastTempC = (forecastItem.main.temp - 32) * 0.6;

    // Log temperature information to the console
    console.log(forecastTempC);
    console.log(forecastItem.main.temp);

    // Set the content for each forecast item
    forecastList.append($("<h6>").text(forecastDate));
    forecastList.append(forecastImg);
    forecastList.append($("<div>").text(`Temp: ${forecastTempC.toFixed(2)}°C`));
    forecastList.append(forecastWind);
    forecastList.append(forecastHum);

    // Append the forecast item to the forecast row
    forecastRow.append(forecastList);
  }

  // Append the forecast row to the forecast container
  $("#forecast").append(forecastRow);
}

// Function to render buttons for each searched city
function renderButtons() {
  // Clear the existing city buttons to avoid duplicates
  $("#history").empty();

  // Loop through the array of searched cities
  for (var i = 0; i < cities.length; i++) {
    // Create a new list item and anchor tag for each city
    var list = $("<li>");
    var aList = $("<a>");

    // Add Bootstrap classes to the list item and anchor tag
    list.addClass("list-group-item border-0 mb-4 p-0");
    aList.addClass("btn btn-secondary w-100");

    // Set the text content of the anchor tag to the current city
    aList.text(cities[i].name);

    // Append the anchor tag to the list item, then append the list item to the history container
    list.append(aList);
    $("#history").append(list);

    // Attach a click event listener to the anchor tag
    aList.on("click", function (event) {
      // Prevent the default anchor tag behavior
      event.preventDefault();

      // Find the clicked city's data from the cities array
      var clickedCity = cities.find(city => city.name === $(this).text());

      // Check if forecast data is available in localStorage
      var storedForecast = JSON.parse(localStorage.getItem(clickedCity.name + '_forecast'));

      if (storedForecast) {
        // If forecast data is available, render it directly
        renderForecast(storedForecast);
      } else {
        // If forecast data is not available, fetch it and then render
        fetchForecastData(clickedCity.name);
      }
    });
  }

  // Function to fetch forecast data for a city
  function fetchForecastData(cityName) {
    var APIKey = "f05ce3ea0316fc22f85e295dddf3a196";
    var forecastQuery = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=imperial&appid=${APIKey}`;

    fetch(forecastQuery)
      .then(handleResponse)
      .then(function (data) {
        // Save the forecast data to localStorage
        localStorage.setItem(cityName + '_forecast', JSON.stringify(data));
        // Render the forecast data
        renderForecast(data);
      })
      .catch(function (error) {
        // Handle errors, such as city not found
        console.error(error);
      });
  }

  // Create and append the "Clear History" button dynamically
  var clearHistoryButton = $("<button>")
    .attr("id", "clear-history")
    .addClass("btn btn-danger mt-3")
    .text("Clear History");

  $("#history").append(clearHistoryButton);

  // Attach a click event listener to the clear history button
  clearHistoryButton.on("click", function (event) {
    // Prevent the default button behavior
    event.preventDefault();

    // Clear the local storage and update the displayed city buttons
    localStorage.removeItem('cities');
    cities = [];
    renderButtons();
  });
}

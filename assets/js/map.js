//Global variables for script
var autocomplete;
var map;
var mapMarkers = [];
var markerLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var markerLabelIndex = 0;

//Initialise map object for display, default Paris, call function to search for city
function initMap() {

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 52.32886, lng: -0.903578 },
        zoom: 11
    });

    //Function called to initialise auto complete search function for city
    searchCity();
}

//Search function for cities, using autocomplete from Google Places API -- adapted from https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-hotelsearch
function searchCity() {

    autocomplete = new google.maps.places.Autocomplete(document.getElementById("city"), {
        types: ['(cities)']
    });
    autocomplete.addListener('place_changed', citySelected);
}

// Function to get city details and zoom to city  -- adapted from https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-hotelsearch
function citySelected() {

    //Variable to store city selected
    var city = autocomplete.getPlace();

    //Functions to clear tables and markers if new city selected
    removeMarkers();
    clearTable();
    resetAttraction();

    //Function to pan map to city selected
    if (city.geometry) {
        map.panTo(city.geometry.location);
        map.setZoom(12);
    }
    else {
        document.getElementById("city").placeholder = 'Enter a valid city';
    }
}

// Function to initialise search for attractions
function attractionSelect(option) {

    // Functions to clear tables and markers if new attraction selected
    removeMarkers();
    clearTable();

    //Call to get attractions based on selection
    getAttractions(option);
}


// Function to get attractions within a specified city -- adapted from https://developers.google.com/maps/documentation/javascript/examples/place-search
function getAttractions(type) {

    //Variable to set parameters for search of attraction
    var attractionAreaType = {
        bounds: map.getBounds(),
        types: [type]
    };

    var attractions = new google.maps.places.PlacesService(map);

    //Function to search for attractions, based on bounds and type, using nearbySearch
    attractions.nearbySearch(attractionAreaType, function(results, status) {
        //Error handling to be incorporated
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            //Call to populate table function using results from nearby search together with type
            populateTable(type, results);
        }
        else {
            document.getElementById("table").innerHTML = `No data available.`;
            alert("There was an error, results not available because of: " + status);
        }
    });
}

// Function to create markers on map with info display on click -- adapted from https://developers.google.com/maps/documentation/javascript/markers
function createMapMarker(attraction) {

    //Initialise marker with label according to position in label string and push to array
    var marker = new google.maps.Marker({
        label: markerLabels[markerLabelIndex++ % markerLabels.length],
        position: attraction.geometry.location,
        map: map,
    });
    mapMarkers.push(marker);

    //Event listener for infowindows when click on marker, sets content of infowindow
    google.maps.event.addListener(marker, 'click', function() {
        var info = new google.maps.InfoWindow();
        info.setContent(`<h6>${attraction.name}</h6>
                <p>Address: ${attraction.formatted_address}</p>
                <p>Phone: ${attraction.international_phone_number}</p>`);
        info.open(map, this);
    });
}


// Function to remove the markers from the map and clear array - adapted from https://jsfiddle.net/upsidown/b5r4nm3s/.
function removeMarkers() {

    for (var i = 0; i < mapMarkers.length; i++) {
        mapMarkers[i].setMap(null);
    }
    mapMarkers = [];
    markerLabelIndex = 0;
}

// Function to display search results in table and call for markers to be created on map
function populateTable(attractionType, data) {

    var category = document.getElementById("table");

    // Table variables
    var attractionHeaders = `<tr><th>#</th><th>Name</th><th>Rating</th><th>Phone Number</th><th>Website</th></tr>`;
    var tableRow = ``;

    var service = new google.maps.places.PlacesService(map);

    //Execution of setInterval to overcome Over Query Limit for requests to Google Places API -- adapted from https://medium.com/@eric.stermer/setinterval-simply-put-is-a-timed-loop-652eb54bd5f8
    var i = 0;
    var intervalId = setInterval(function() {

        if (i === data.length) {
            clearInterval(intervalId);
        }
        else {

            //Variable parameters of fields to return from request
            var placeRequest = {
                placeId: data[i].place_id,
                fields: ['name', 'formatted_address', 'international_phone_number', 'website', 'geometry', 'rating']
            };

            //Request to Places API, populate of table rows
            service.getDetails(placeRequest, function(place, status) {

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // Statements to catch undefined results from Places Library for better table results
                    if(place.rating===undefined){
                        place.rating = "N/A";
                    }
                    if(place.international_phone_number===undefined){
                        place.international_phone_number = "N/A";
                    }
                    if(place.website===undefined){
                        place.website = "N/A";
                    }

                    //Populate table with each result, corrected for undefined responses
                    tableRow += `<tr class="table-light"><td><a class="table-link" href="#citySelector">${markerLabels[markerLabelIndex]}<a></td><td>${place.name}</td><td>${place.rating}</td><td>${place.international_phone_number}</td><td><a target="_blank" aria-label="Website" rel="noopener" href=${place.website}><button class="btn btn-warning btn-sm">Link</button></a></td></tr>`;
                    createMapMarker(place);
                }
                else {
                    category.innerHTML = `No data available`;
                    alert("There was an error with data retrieval because of: " + status);
                }

                //Print results to html
                category.innerHTML = `<table class="table">${attractionHeaders}${tableRow}</table>`;
            });

            i++;
        }
    }, 300);
}

// Function to clear data from table
function clearTable() {

    var category = document.getElementById("table");
    category.innerHTML = ``;
}

// Function to reset attractionSelector if new city is chosen -- addapted from https://www.formget.com/reset-form-fields-using-javascript/
function resetAttraction(){
      document.getElementById("selectorForm").reset();
}

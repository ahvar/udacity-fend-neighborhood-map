"use strict";

// *******************************
// *         DATA MODEL          *
// *******************************
var locations = [
	{
		name: 'Coffee Tree',
		address: 'Av Enrique Ramirez y Av Camelinas',
		lat: 19.6889285,
		lng: -101.1581993,
		info: 'Coffee house',
		tags: ['coffee', 'refreshment', 'Morelia']
	},
	{
		name: 'Sherbrooke Coffee & Tea Suc. Altozano',
		address: 'Juan Pablo II',
		lat: 19.67581432,
		lng: -101.1824002,
		info: 'Coffee Clouds',
		tags: ['coffee', 'clouds', 'morelia']
	},
	{
		name: 'Bosque Cuahutemoc',
		address: 'Morelia, Michoacan de Ocampo, Morelos, Mich., Mexico',
		lat: 19.697991,
		lng: -101.180381,
		info: 'Statue of Cuahutemoc',
		tags: ['statues', 'history']
	},
	{
		name: 'Hotel Boutique Casa Madero',
		address: 'Av Francisco 1. Madero Ote 137, Centro, Centro Historico, 58000 Morelia, Mich., Mexico',
		lat: 19.703539,
		lng: -101.181069,
		info: '5-Star hotel in Morelia historic district',
		tags: ['hotel', 'historic', 'sleep']
	},
	{
		name: 'Hotel de la soledad',
		address: 'Ignacio Zaragoza 90, Centro, 58000 Morelia, Mich., Mexico',
		lat: 19.703658,
		lng: -101.192996,
		info: 'Five star hotel in Morelia, Michoacan',
		tags: ['hotel', 'morelia']
	}

];

// *******************************
// *         MAPS                *
// *******************************
var moreliaMap = {
	map: {},
	infoWindow: new google.maps.InfoWindow(), // reusable info window
	options: {
		center: { lat: 19.705950, lng: -101.194982},
		zoom: 12
	},
	infoWindowContent: '<div class="info-window"><div class="window-title">%title%</div><div class="window-description">%description%</div></div>',
	init: function(viewmodel) {
		moreliaMap.map = new google.maps.Map(document.getElementById('map'), moreliaMap.options);
		// shows markers depending on which loads faster - view model or google map
		if (viewmodel.initialized && !viewmodel.hasMarkers) viewmodel.showMarkers();
	}
};

// *******************************
// *         LOCATION            *
// *******************************
var Location = function(data, parent) {
	// info from provided data model
	this.name = ko.observable(data.name);
	this.info = ko.observable(data.info);
	this.address = ko.observable(data.address);
	this.tags = ko.observableArray(data.tags);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);

	// if this location has extra info via ajax
	this.initialized = ko.observable(false);

	// google maps marker
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(data.lat, data.lng),
		icon: 'img/marker.png'
	});

	// click handler for google maps marker
	google.maps.event.addListener(marker, 'click', (function(location, parent) {
		return function() {
			// tell viewmodel to show this location
			parent.showLocation(location);
		};
	}) (this, parent));
	this.marker = marker;
};

// *******************************
// *        FILTER               *
// *******************************
var Filter = function(data) {
	this.name = ko.observable(data.name);
	this.on = ko.observable(true);
};

// *******************************
// *          VIEW MODEL         *
// *******************************
var ViewModel = function() {
	var self = this;
	self.searchFilter = ko.observable('');
	self.currentLocation = ko.observable();
	self.initialized = false;
	self.hasMarkers = false;
	self.connectionError = ko.observable(false);

	// *******************************
	// *            INIT             *
	// *******************************
	self.init = function() {
		var tempTagArr = [];
		var tempFilterArr = [];

		// create container for locations
		self.locationList = ko.observableArray([]);

		// loop through locations array and convert to ko object
		locations.forEach(function(location) {
			self.locationList.push(new Location(location, self));

			// loop through tags for each location and add to self.filters
			location.tags.forEach(function(tag){
				// if current tag is not already a filter, add to self.filters
				if (tempTagArr.indexOf(tag) < 0) {
						tempTagArr.push(tag);
				}
			});
		});

		// loop through tags and make filter objects from them
		tempTagArr.forEach(function(tag){
			tempFilterArr.push(new Filter({name: tag}));
		});

		 

		
		self.filters = ko.observableArray(tempFilterArr);

	
		self.currentFilters = ko.computed(function() {
			var tempCurrentFilters = [];

			// loop through filters and get all filters that are on
			ko.utils.arrayForEach(self.filters(), function(filter){
				if (filter.on()) tempCurrentFilters.push(filter.name());
			});

			return tempCurrentFilters;
		});

		// array of locations to be shown based on currentFilters
		self.filteredLocations = ko.computed(function() {
			var tempLocations = ko.observableArray([]);
			var returnLocations = ko.observableArray([]);

			// apply filter
			ko.utils.arrayForEach(self.locationList(), function(location){
				var locationTags = location.tags();

				// loop through all tags for a location and
				// determine if any are also a currently applied filter
				var intersections = locationTags.filter(function(tag){
					return self.currentFilters().indexOf(tag) != -1;
				});

				// if one or more tags for a location are in a filter, add it
				if (intersections.length > 0) tempLocations.push(location);
			});

			var tempSearchFilter = self.searchFilter().toLowerCase();

			// if there is no additional text to search for, return filtered locations
			if (!tempSearchFilter){
				returnLocations = tempLocations();
			}
			// if user is also searching via text box, apply text filter
			else{
				returnLocations = ko.utils.arrayFilter(tempLocations(), function(location) {
		        	return location.name().toLowerCase().indexOf(tempSearchFilter) !== -1;
		        });
			}

			// hide/show correct markers based on list of current locations
			self.filterMarkers(returnLocations);
			return returnLocations;

		});

		// if no markers have been shown, show them
		if (!self.hasMarkers) self.showMarkers();
		self.initialized = true;
	};

	// *******************************
	// *          FUNCTIONS          *
	// *******************************

	// shows/hides correct map markers
	self.filterMarkers = function(filteredLocations) {
		ko.utils.arrayForEach(self.locationList(), function(location){
			if (filteredLocations.indexOf(location) === -1) {
				location.marker.setVisible(false);
			}
			else{
				location.marker.setVisible(true);
			}
		});
	};

	// turns filter on or off
	// called when filter is clicked in view
	self.toggleFilter = function(filter) {
		filter.on(!filter.on());
	};

	// show the currently selected location
	// called when list item or map marker is clicked
	self.showLocation = function(location) {
		// set info window content and show it
		moreliaMap.infoWindow.setContent(moreliaMap.infoWindowContent.replace('%title%', location.name()).replace('%description%', location.address()));
		moreliaMap.infoWindow.open(moreliaMap.map, location.marker);

		// set the old marker icon back
		if (self.currentLocation()) self.currentLocation().marker.setIcon('img/marker.png');

		// set new marker to selected icon
		location.marker.setIcon('img/marker_selected.png');

		// reset error status
		self.connectionError(false);

		// if location does not have additional info via ajax
		if (!location.initialized()) {

			// call to get initial information
			$.ajax({
				//url:'https://api.foursquare.com/v2/venues/search?v=20161016&ll='+place.lat()+'%2C%20'+place.lng()+'&query=coffee&intent=checkin&client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2'
				url: 'https://api.foursquare.com/v2/venues/search?ll='+location.lat()+','+location.lng()+'&intent=match&name='+location.name()+'&client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2&v=20161016'			
			})
			.done(function(data){
				var venue = data.response.venues[0];
				console.log(venue); 

				//set fetched info as properties of Location object
				location.id = ko.observable(venue.id);

				if (venue.hasOwnProperty('url')) {
					location.url = ko.observable(venue.url);
				}
				//if (venue.hasOwnProperty('contact') && venue.contact.hasOwnProperty('formattedPhone')) {
				//	location.phone = ko.observable(venue.contact.formattedPhone);
				//}

				// use id to get photo
				$.ajax({
					//url:'https://api.foursquare.com/v2/venues/search?v=20161016&ll='+place.id()+'/photos?client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2'
					url: 'https://api.foursquare.com/v2/venues/'+location.id()+'/photos?client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2&v=20161016'
				})
				.done(function(data){
					// set first photo url as the location photo property
					var photos = data.response.photos.items;
					location.photo = ko.observable(photos[0].prefix + 'width400' + photos[0].suffix);
					location.initialized(true);

					// set current location and scroll user to information
					self.currentLocation(location);
					self.scrollTo('#info-container');
				})
				.fail(function(err) {
					// if there is an error, set error status and scroll user to the info
					self.connectionError(true);
					self.scrollTo('#info-container');
				});

			})
			.fail(function(err) {
				// if there is an error, set error status and scroll user to the info
				self.connectionError(true);
				self.scrollTo('#info-container');
			});
		}
		// if location has already fetched data
		else {
			// set current location and scroll user to information
			self.currentLocation(location);
			self.scrollTo('#info-container');
		}
	};

	// helper function to scroll user to specified element
	// el is a string representing the element selector
	self.scrollTo = function(el) {
		$('html, body').animate({ scrollTop: $(el).offset().top }, "slow");
	};

	// show marker for each location
	self.showMarkers = function() {
		ko.utils.arrayForEach(self.locationList(), function(location){
			location.marker.setMap(moreliaMap.map);
		});

		self.hasMarkers = true;
	};
};


// *******************************
// *            SETUP            *
// *******************************

// empty view model
var viewmodel = new ViewModel();

// listener for view model initialization
$( document ).ready(function() {
	viewmodel.init();
	ko.applyBindings(viewmodel);

	// resize map and reset center when window size changes
	$(window).on('resize', function() {
		google.maps.event.trigger(moreliaMap.map, 'resize');
		moreliaMap.map.setCenter(moreliaMap.options.center);
	});
});

google.maps.event.addDomListener(window, 'load', moreliaMap.init(viewmodel));

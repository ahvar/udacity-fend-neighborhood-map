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
var gMap = {
	map: {},
	infoWindow: new google.maps.InfoWindow(), // reusable info window
	options: {
		center: { lat: 19.705950, lng: -101.194982},
		zoom: 12
	},
	infoWindowContent: '<div class="info-window"><div class="window-title">%title%</div><div class="window-description">%description%</div></div>',
	init: function(vm) {
		gMap.map = new google.maps.Map(document.getElementById('map'), gMap.options);
		// shows markers depending on which loads faster - vm or google map
		if (vm.initialized && !vm.hasMarkers) vm.showMarkers();
	}
};

// *******************************
// *         LOCATION            *
// *******************************
var Place = function(data, parent) {
	// info from provided data model
	this.name = ko.observable(data.name);
	this.info = ko.observable(data.info);
	this.address = ko.observable(data.address);
	this.tags = ko.observableArray(data.tags);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);

	// if this place has extra info via ajax
	this.initialized = ko.observable(false);

	// google maps marker
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(data.lat, data.lng),
		icon: 'img/marker.png'
	});

	// click handler for google maps marker
	google.maps.event.addListener(marker, 'click', (function(place, parent) {
		return function() {
			// tell viewmodel to show this place
			parent.showPlace(place);
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
	self.currentPlace = ko.observable();
	self.initialized = false;
	self.hasMarkers = false;
	self.connectionError = ko.observable(false);

	// *******************************
	// *            INIT             *
	// *******************************
	self.init = function() {
		var tempTagArr = [];
		var tempFilterArr = [];

		// create container for places
		self.placeList = ko.observableArray([]);

		// loop through places array and convert to ko object
		locations.forEach(function(place) {
			self.placeList.push(new Place(place, self));

			// loop through tags for each place and add to self.filters
			place.tags.forEach(function(tag){
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

		// array of places to be shown based on currentFilters
		self.filteredPlaces = ko.computed(function() {
			var tempPlaces = ko.observableArray([]);
			var returnPlaces = ko.observableArray([]);

			// apply filter
			ko.utils.arrayForEach(self.placeList(), function(place){
				var placeTags = place.tags();

				// loop through all tags for a place and
				// determine if any are also a currently applied filter
				var intersections = placeTags.filter(function(tag){
					return self.currentFilters().indexOf(tag) != -1;
				});

				// if one or more tags for a place are in a filter, add it
				if (intersections.length > 0) tempPlaces.push(place);
			});

			var tempSearchFilter = self.searchFilter().toLowerCase();

			// if there is no additional text to search for, return filtered places
			if (!tempSearchFilter){
				returnPlaces = tempPlaces();
			}
			// if user is also searching via text box, apply text filter
			else{
				returnPlaces = ko.utils.arrayFilter(tempPlaces(), function(place) {
		        	return place.name().toLowerCase().indexOf(tempSearchFilter) !== -1;
		        });
			}

			// hide/show correct markers based on list of current places
			self.filterMarkers(returnPlaces);
			return returnPlaces;

		});

		// if no markers have been shown, show them
		if (!self.hasMarkers) self.showMarkers();
		self.initialized = true;
	};

	// *******************************
	// *          FUNCTIONS          *
	// *******************************

	// shows/hides correct map markers
	self.filterMarkers = function(filteredPlaces) {
		ko.utils.arrayForEach(self.placeList(), function(place){
			if (filteredPlaces.indexOf(place) === -1) {
				place.marker.setVisible(false);
			}
			else{
				place.marker.setVisible(true);
			}
		});
	};

	// turns filter on or off
	// called when filter is clicked in view
	self.toggleFilter = function(filter) {
		filter.on(!filter.on());
	};

	// show the currently selected place
	// called when list item or map marker is clicked
	self.showPlace = function(place) {
		// set info window content and show it
		gMap.infoWindow.setContent(gMap.infoWindowContent.replace('%title%', place.name()).replace('%description%', place.address()));
		gMap.infoWindow.open(gMap.map, place.marker);

		// set the old marker icon back
		if (self.currentPlace()) self.currentPlace().marker.setIcon('img/marker.png');

		// set new marker to selected icon
		place.marker.setIcon('img/marker_selected.png');

		// reset error status
		self.connectionError(false);

		// if place does not have additional info via ajax
		if (!place.initialized()) {

			// call to get initial information
			$.ajax({
				//url:'https://api.foursquare.com/v2/venues/search?v=20161016&ll='+place.lat()+'%2C%20'+place.lng()+'&query=coffee&intent=checkin&client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2'
				url: 'https://api.foursquare.com/v2/venues/search?ll='+place.lat()+','+place.lng()+'&intent=match&name='+place.name()+'&client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2&v=20161016'			
			})
			.done(function(data){
				var venue = data.response.venues[0];
				console.log(venue); 

				//set fetched info as properties of Place object
				place.id = ko.observable(venue.id);

				if (venue.hasOwnProperty('url')) {
					place.url = ko.observable(venue.url);
				}
				//if (venue.hasOwnProperty('contact') && venue.contact.hasOwnProperty('formattedPhone')) {
				//	place.phone = ko.observable(venue.contact.formattedPhone);
				//}

				// use id to get photo
				$.ajax({
					//url:'https://api.foursquare.com/v2/venues/search?v=20161016&ll='+place.id()+'/photos?client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2'
					url: 'https://api.foursquare.com/v2/venues/'+place.id()+'/photos?client_id=PNBRN4E4DHEVQYRLIAH4V5J5F34NXPJZR5KXKZE5KPRN5L2D&client_secret=KBTAM03M11ENMURLL1T3QP1IU1YGCNTNUH1GPYN2RBXDCHA2&v=20161016'
				})
				.done(function(data){
					// set first photo url as the place photo property
					var photos = data.response.photos.items;
					place.photo = ko.observable(photos[0].prefix + 'width400' + photos[0].suffix);
					place.initialized(true);

					// set current place and scroll user to information
					self.currentPlace(place);
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
		// if place has already fetched data
		else {
			// set current place and scroll user to information
			self.currentPlace(place);
			self.scrollTo('#info-container');
		}
	};

	// helper function to scroll user to specified element
	// el is a string representing the element selector
	self.scrollTo = function(el) {
		$('html, body').animate({ scrollTop: $(el).offset().top }, "slow");
	};

	// show marker for each place
	self.showMarkers = function() {
		ko.utils.arrayForEach(self.placeList(), function(place){
			place.marker.setMap(gMap.map);
		});

		self.hasMarkers = true;
	};
};


// *******************************
// *            SETUP            *
// *******************************

// empty view model
var vm = new ViewModel();

// listener for view model initialization
$( document ).ready(function() {
	vm.init();
	ko.applyBindings(vm);

	// resize map and reset center when window size changes
	$(window).on('resize', function() {
		google.maps.event.trigger(gMap.map, 'resize');
		gMap.map.setCenter(gMap.options.center);
	});
});

google.maps.event.addDomListener(window, 'load', gMap.init(vm));

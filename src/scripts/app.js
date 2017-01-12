'use strict';

/******************************************
/*******************MODEL********************
/* Domain-specific data and information
/* about locations of interest in Morelia, MX
*******************************************/

var locations = [
    {
    title: "Acueducto de Morelia",
    lat: 19.699203,
    lng: -101.15678,
    streetAddress: "Avenue Acueducto 1464, Chapultepec Nte. 58260",
    cityAddress: "Morelia, Michoacan",
    url: "http://morelianas.com/morelia/monumentos/acueducto-de-morelia/",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['monuments', 'architecture', 'aqueduct', 'landmark', 'historic']
    }, 
    {
    title: "Catedral de Morelia",
    lat: 19.705950,
    lng: -101.194982,
    streetAddress: "Avenue Francisco I. Madero Pte S/N, Centro, 58000",
    cityAddress: "Morelia, Michoacan",
    url: "http://morelianas.com/morelia/edificios/catedral-de-morelia/",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['cathedral', 'church', 'building', 'historic', 'architecture', 'landmark', 'center', 'catholic']
    }, 
    {
    title: "Estadio Morelos",
    lat: 29.192834,
    lng: -108.150102,
    streetAddress: "Libramiento Poniente s/n, Leandro Valle, 58147",
    cityAddress: "Morelia, Michoacan",
    url: "https://en.wikipedia.org/wiki/Estadio_Morelos",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['stadium', 'soccer', 'futbol', 'sports']
    }, 
    {
    title: "Monumento ecuestre de Jose Maria Morelos",
    lat: 19.0786,
    lng: -102.3554,
    streetAddress: "Janitzio",
    cityAddress: "Morelia, Michoacan",
    url: "http://morelianas.com/morelia/monumentos/monumento-ecuestre-de-jose-maria-morelos/",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['sculpture', 'horse', 'monument', 'historic', 'statue', 'Jose Maria Morelos']
    }, 
    {
    title: "Antiguo Palacio de Justicia",
    lat: 25.7349,
    lng: -100.3094,
    streetAddress: "Portal Allende 267, Centro Historico",
    cityAddress: "Morelia, Michoacan",
    url: "http://morelianas.com/morelia/museos/antiguo-palacio-justicia/",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['government', 'historic', 'palace', 'court', 'justice', 'legal', 'museum', 'culture']
    }
];

/*
 * A map of Morelia, Michoacan, MX
 */
var morelia = {
    map: {},
    infowindow: new google.maps.Infowindow(),
    options: {
        center: {
            lat: 19.7060,
            lng: -101.1950
        },
        zoom: 12
    },
    infoWindowContent: '<div class = "info-window"><div class="window-title">%title%</div><div class="window-description">%description%</div></div>',
    init: function(vm) {
        morelia.map = new google.maps.Map(document.getElementById('morelia'),map.options);
        if (vm.initialized && !vm.markersDropped) vm.showMarkers();
    }
};    


/*********************************************************************
/************************** LOCATION *********************************
/* This global object creates several knockout observables defining
/* a specific point of interest. Observables notify potential subscribers
/* whenever a value changes. The location object is used by the view model 
**********************************************************************/

var Location = function(model, parent) {

    // Object properties
    this.title = ko.observable(model.title);
    this.lat = ko.observable(model.lat);
    this.lng = ko.observable(model.lng);
    this.streetAddress = ko.observable(model.streetAddress);
    this.cityAddress = ko.observable(model.cityAddress);
    this.url = ko.observable(model.url);
    this.tags = ko.observable(model.tags);

    this.initialized = ko.observable(false);

    // create a new marker 
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(model.lat, model.lng),
        icon: 'images/situation-pin.png'
    });

    google.maps.event.addListener(marker, 'click', (function(location, parent) {
        return function() {
            parent.showLocation(location);
        };
    })(this, parent));

    this.marker = marker;
};


var Select = function(search) {
    this.word = ko.observable(search.title);
    this.is = ko.observable(true);
};

/*********************************************************************
//************************** VIEW MODEL *******************************
**********************************************************************/

var ViewModel = function() {
    var self = this;

    // view model properties
    self.selectWord = ko.observable('');
    self.selectedLocation = ko.observable();
    self.initialized = false;
    self.markersDropped = false;
    self.networkProblem = ko.observable(false);

    self.init = function() {
        var searchWordsArray = [];
        var currentDropDown = [];

        /*create an array to hold locations of interest to user*/
        self.selectedLocationArray = ko.observableArray([]);

        locations.forEach(function(location) {
            self.selectedLocationArray.push(new Location(location, self));

            location.tags.forEach(function(tag) {
                if(searchWordsArray.indexOf(tag) < 0) {
                    searchWordsArray.push(tag);
                }
            });
        });

        searchWordsArray.forEach(function(tag) {
            currentDropDown.push(new Select({title: tag}));
        });

       // start here

        self.searchWords = ko.observableArray(currentDropDown);

        self.currSearchWords = ko.computed(function() {
            var thisSearchWordArray = [];
            ko.utils.arrayForEach(self.searchWords(), function(select) {
                if (select.is()) thisSearchWordArray.push(select.name());
            });
            return thisSearchWordArray;
        });

        self.listOfSelectLocations = ko.computed(function() {

            var searchLocationArray = ko.observableArray([]);
            var userSelectedLocations = ko.observableArray([]);

            ko.utils.arraysForEach(self.selectedLocationArray(), function(location) {
                var locationTags = location.tags();
                // loop through all tags for a place and
                // determine if any are also a currently applied filter
                var matches = locationTags.filter(function(tag){
                    return self.currentSearchWords().indexOf(tag) != -1;
                });

                // if one or more tags for a place are in a filter, add it
                if (matches.length > 0) searchLocationArray.push(location);
            });

            var tempSearchFilter = self.searchFilter().toLowerCase();

            // if there is no additional text to search for, return filtered places
            if (!tempSearchFilter){
                userSelectedLocations = searchLocationArray;
            }
            // if user is also searching via text box, apply text filter
            else{
                userSelectedLocations = ko.utils.arrayFilter(searchLocationArray, function(location) {
                    return location.title().toLowerCase().indexOf(tempSearchFilter) !== -1;
                });
            }

            self.selectMarkers(userSelectedLocations);
            return userSelectedLocations;

        });

        if (!self.markersDropped) {
            self.dropMarkers();
            self.initialized = true;
        }
    };






    /*
     * loops through the array of locations passed into the function
     * and searches for this location in the selectedLocationArray
     * if match found, the marker property is set to visible
     */
    self.selectMarkers = function(selectedLocations) {
        ko.utils.arrayForEach(self.selectedLocationArray, function(location){
            if (listOfSelectLocations.indexOf(location) === -1){
                location.marker.setVisible(false);
            } else {
                location.marker.setVisible(true);
            }
        });
    };

    /*
     * Allows user to filter the locations in the view
     */
    self.toggleSelect = function(select) {
        select.is(!select.is());
    };

    self.displayLocation = function(location) {
        morelia.infoWindow.setContent(morelia.infoWindowContent.replace('%title%', location.title()).replace('%description%', location.streetAddress()));
        morelia.infoWindow.open(morelia.map, location.marker);

        if (self.currentLocation()) {
            self.currentLocation().marker.setIcon('images/situation-pin.png');
        }

        location.marker.setIcon('images/situation-pin.png');

        // assign the current city to the selectedCity variable
        var selectedCity = location.cityAddress.value();


        self.networkProblem(false);

        // store the location-list html element in the $nytElem variable
        var $nytElem = $("#location-list");

        if (!location.initialized()) {

            $.ajax({
        
                url: 'http://api.nytimes.com/svc/semantic/v2/articlesearch.json'+location.lat()+','+location.lng()+'&intent=match&name='+location.title()
            })
            .done(function(data){
                var attraction = data.response.locations[0];

                location.id = ko.observable(attraction.id);

                if (attraction.hasOwnProperty('url')) {
                    attraction.url = ko.observable(attraction.url);
                }
                if (attraction.hasOwnProperty('contact') && attraction.contact.hasOwnProperty('formattedPhone')) {
                    location.phone = ko.observable(attraction.contact.formattedPhone);
                }

                // use id to get photo
                $.ajax({
                    url: 'http://api.nytimes.com/svc/semantic/v2/articlesearch.json'+location.id()
                })
                .done(function(data){
                    // set first photo url as the place photo property
                    var photos = data.response.photos.items;
                    location.photo = ko.observable(photos[0].prefix + 'width400' + photos[0].suffix);
                    location.initialized(true);

                    // set current place and scroll user to information
                    self.currentlocation(location);
                    self.scrollTo('#info-container');
                })
                .fail(function(err) {
                    // if there is an error, set error status and scroll user to the info
                    self.networkProblem(true);
                    self.scrollTo('#info-container');
                });
            })
            .fail(function(err){
                self.networkProblem(true);
                self.scrollTo('#info-container');
            });
        } 
        else {
            self.currentLocation(location);
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
        ko.utils.arrayForEach(self.currentLocations(), function(location){
            location.marker.setMap(morelia.map);
        });

        self.hasMarkers = true;
    };
};


var vm = new viewmodel();

$(document).ready(function() {
    vm.init();
    ko.applyBindings(vm);

    $(window).on('resize', function() {
        google.maps.event.trigger(morelia.map, 'resize');
        morelia.map.setCenter(morelia.options.center);
    });
});

google.maps.event.addDomListener(window, 'load', morelia.init(vm));
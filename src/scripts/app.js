'use strict';
/******************************************
******************MODEL********************
domain-specific data and information
about locations of interest in Morelia, MX
*******************************************/
// map
var morelia;

// an array of locations
var locations = [
  {   
    title: "Acueducto de Morelia",
    lat: 19.699203, 
    lng: -101.15678,
    streetAddress: "",
    cityAddress: "Morelia, MX",
    url: "",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['monuments','architecture','aqueduct']
  },
  {   
    title: "Catedral de Morelia",
    lat: 19.705950, 
    lng: -101.194982,
    streetAddress: "",
    cityAddress: "",
    url: "",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['cathedral','church',]
  },
  {   
    title: "Estadio Morelos",
    lat: 29.192834, 
    lng: -108.150102,
    streetAddress: "",
    cityAddress: "",
    url: "",
    id: "",
    visible: ko.observable(true),
    boolTest: true,
    tags: ['stadium','soccer','futbol']
  }  
];

//an array of markers
var markers = [];


var morelia = {
  map: {},
  infowindow: new google.maps.InfoWindow(),
  options: {
    center: {19.7060,-101.1950},
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.BOTTOM_CENTER,
      mapTypeIds: [google.maps.MapTypeId.ROADMAP],
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.LEFT_CENTER
      }
    }
  },
  infoWindowContent: '<div class = "info-window"><div class="window-title">%title%</div><div class="window-description">%description%</div></div>',
  init: function(viewmodel) {
    morelia.map = new google.maps.Map(document.getElementById('morelia'), morelia.options);
    if(viewmodel.initialized && !viewmodel.withMarkers) viewmodel.showMarkers();
  }
};


/*********************************************************************
//************************** VIEW MODEL *******************************
// this function accepts a single location from the model and ties it
// to the view via knockout observables 
**********************************************************************/

var Location = function(model,parent) {

  // the observables hold values and can notify potential subscribers whenever
  // that value changes. Observables are created with special factory subscriptions
  // that knockout manages behind the scenes.
  this.title = ko.observable(model.title);
  this.lat = ko.observable(model.lat);
  this.lng = ko.observable(model.lng);
  this.streetAddress = ko.observable(model.streetAddress);
  this.cityAddress = ko.observable(model.cityAddress);
  this.url = ko.observable(model.url);
  this.tags = ko.observable(model.tags);

  this.start = ko.observable(false);

  // create a new marker 
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(model.lat,model.lng),
    icon: 'src/images/situation-pin.png'
  });

  google.maps.event.addListener(marker,'click',(function(location,parent){
    return function() {
      parent.showLocation(location);
    };
  })(this,parent));

  //by making this a property, the marker for each location can be easily accessed 
  this.marker = marker;
};


var select = function(search) {
  this.word = ko.observable(search.name);
  this.is = ko.observable(true);
};

var viewmodel = function() {
  var self = this;
  self.selectWord = ko.observable('');
  self.selectedLocation = ko.observable();
  self.start = false;
  self.markersDropped = false;
  self.networkProblem = ko.observable(false);

  self.init = function() {
    var searchWordsArray = [];
    var currentDropDown = [];

    /*create an array to hold locations as the user is searching*/
    self.selectedLocationArray = ko.observableArray([]);

    /* 
     * Use a nested for loop to make a KO observable for each
     * location and loop through the tags for each location
     * and add them to the list of search words
     */
    var allLocations = locations;
    for (var i = 0; i < allLocations.length; i++) {
      self.selectedLocationArray.push(new Location(allLocations[i], self));
      // if the tag doesn't already exists within the array of search words then push
      for (var j = 0; i < allLocations[i].tags.length; j++) {
        if(searchWordsArray.indexOf(allLocations[i].tags[j]) < 0) {
          searchWordsArray.push(allLocations[i].tags[j]);
        }
      }
    }

    for(var k = 0; k < searchWordsArray.length; k++) {
      searchWordsArray.push(new Select({word: searchWordsArray[k]}));
    }

    self.searchWords = ko.observableArray(currentDropDown);

    self.currSearchWords = ko.computed(function() {
      var thisSearchWordArray = [];
      ko.utils.arrayForEach(self.searchWords(), function(select) {
        if(select.is()) thisSearchWordArray.push(select.name());
      });
      return thisSearchWordArray;
    });

    self.listOfSelectLocations = ko.computed(function(){

      var searchLocationArray = ko.observableArray([]);
      var userSelectedLocations = ko.observableArray([]);
      /* 
       * Use nested for loop to go through the array of
       * of locations and put the associated tags into 
       * a separate array called locationSearchWords.
       * Loop through this array and assign matching words
       * to matches variable.
       */
      var matches;
      for(var i = 0; i < self.selectedLocationArray.length; i++) {
        var locationSearchWords = self.selectedLocationArray[i].tags();
        for(var j = 0; locationSearchWords.length; j++) {
          matches = self.currSearchWords().indexOf(locationSearchWords[j]) != -1;
            return matches;
        }
        if(matches.length > 0) {
            searchLocationArray.push(self.selectedLocationArray[i]);
        }
      }

      var wordSelectionArray = self.selectWord().toLowerCase();

      if(!wordSelectionArray) {
        userSelectedLocations = searchLocationArray();
      } else {
        userSelectedLocations = ko.utils.arrayFilter(searchLocationArray(),function(location) {
          return location.title().toLowerCase().indexOf(wordSelectionArray) !== -1;
        });
      }

      self.selectMarkers(userSelectedLocations);
      return userSelectedLocations;

    });

    if(!self.markersDropped) {
      self.dropMarkers();
      self.start = true;
    }
  };

  /*
   * loops through the array of locations passed into the function
   * and searches for this location in the selectedLocationArray
   * if match found, the marker property is set to visible
   */
  self.selectMarkers = function(selectedLocations) {
    var locationIndex;
    for(var m = 0; m < selectedLocations.length; m++) {
      if(self.selectedLocationArray.indexOf(selectedLocations[m]) === -1) {
        locationIndex = self.selectedLocationArray.indexOf(selectedLocations[m]);
        self.selectedLocationArray[locationIndex].marker.setVisible(false);
      } else {
        locationIndex = self.selectedLocationArray.indexOf(selectedLocations[m]);
        self.selectedLocationArray[locationIndex].marker.setVisible(true);
      }
    }
  };

  /*
   * Allows user to filter the locations in the view
   */
  self.toggleSelect = function(select) {
    select.is(!select.is());
  };

  self.displayLocation = function(location) {
    morelia.infoWindow.setContent(morelia.infoWindowContent.replace('%title%',location.title()).replace('%description%',location.streetAddress()));
    morelia.infoWindow.open(morelia.map,location.marker);

    if(self.currentLocation()) {
      self.currentLocation().marker.setIcon('images/situation-pin.png');
    }  

    location.marker.setIcon('images/situation-pin.png');

    // assign the current city to the selectedCity variable
    var selectedCity = location.cityAddress.value();


    self.networkProblem(false);
    
    // store the location-list html element in the $nytElem variable
    var $nytElem = $("#location-list");


    if(!location.start()) {
      //store nyt url in variable nytURL
      var nytURL = "http://api.nytimes.com/svc/semantic/v2/articlesearch.json";

      //add parameter for country and api key to nytURL
      nytURL =+  $.param({
        'q': selectedCity,
        'api-key': "e82157a4c7cd48d68abae0a7452a48aa",
        'fq': "Tourist",
        'sort': "newest"
      });

      //request data
      $.ajax({
        url: nytURL,
        dataType: 'json'
      })
      .done(function(data) {

        var articles = data.response.docs[0];
        //append each article url to the all articles element
        $.each(articles,function(index,element) {
          $nytElem.append('<li class="article">' + '<a href= "'+element.web_url+'">' + selectedCity + '</a>'+
            '</li>');
        });
        //set the view model's current location property to the location
        location.start(true);
        self.currentLocation(location);
        self.scrollTo("#location-list");
      }).fail(function(error) {
        self.networkProblem(true);
        self.scrollTo("#location-list");
      });
    } else {
      self.currentLocation(location);
      self.scrollTo("#location-list");
    } 

  };

  self.scrollTo = function(e1) {
    $('html,body').animate({scrollTop:$(e1).offset().top},"slow");
  };

  self.dropMarkers = function(){
    for(var n = 0; self.selectedLocationArray.length; n++) {
      self.selectedLocationArray[n].marker.setMap(morelia.map);
    }
    self.markersDropped = true;
  }

};

      allLocations[i]
        var lat = locations[i].lat;
        var lng = locations[i].lng;
        var position = {"lat":lat,"lng":lng};
        var title = locations[i].title;
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          id: i
        });
  }
}



function populateInfoWindow(marker,infowindow) {
  if(infowindow.marker != marker) {
    infowindow.setContent('');
    infowindow.marker = marker;
    infowindow.addListener('closeclick',function() {
      infowindow.marker=null;
    });
    var streetView = new google.maps.StreetViewService();
    var radius = 50;
    function getStreetView(data,status){
      if(status == google.maps.StreetViewStatus.OK) {
        var streetViewLocation = data.location.latlng;
        var heading = google.maps.geometry.spherical.computeHeading(
          streetViewLocation, marker.position);
        infowindow.setContent('<div>' + marker.title + '</div><div id="pano"</div>');
        var options = {
          position: streetViewLocation,
          pov: {
            heading: heading,
            pitch: 30
          }
        };
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No street view available</div>');
      }

      streetView.getPanoramaByLocation(marker.position,radius,getStreetView);
      infowindow.open(morelia,marker);
    };
  }
};

window.LocationList=(function(ko) {
  return {
    create: function(locations) {
      var viewmodel = {};

      //properties
      viewmodel.locations = locations;
      viewmodel.selectedLocations = ko.observableArray(locations);
      viewmodel.selectedLocation = ko.observable(locations[0]);
      viewmodel.searchFilter = ko.observable('');
      

      //methods
      viewmodel.selectLocation = function(location) {
        this.selectedLocation(location);
      };
      viewmodel.isSelected = function(location) {
        return this.selectedLocation() === location;
      };
      for (var i = 0; i < locations.length; i++) {
        var lat = locations[i].lat;
        var lng = locations[i].lng;
        var position = {"lat":lat,"lng":lng};
        var title = locations[i].title;
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          id: i
        });

  markers.push(marker);
  marker.addListener('click',function() {
    populateInfoWindow(this,largeInfoWindow);
  });
  marker.addListener('mouseover',function() {
    this.setIcon(highlightedIcon);
  });
  marker.addListener('mouseout',function(){
    this.setIcon(defaultIcon);
  });
}

      return viewmodel;
    }
  };
}(window.ko));

window.LocationDetails = (function(ko) {
  // view model properties
  return {
    create: function(location) {
      var viewmodel = {};
      return viewmodel;
    }
  };




});





















//this code block will check whether the browser supports Geolocation API and sets the center
//of the map according to the coordinates of the device
if (navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
   function(position) {
   var lat = position.coords.latitude;
   var lng = position.coords.longitude;
   //Creating LatLng object with latitude and longitude
   var devCenter = new google.maps.LatLng(lat,lng);
   map.setCenter(devCenter);
   map.setZoom(15);
 });
}

startButtonEvents();

var geocoder = new google.maps.Geocoder;
var morelia = {lat: 19.705950, lng: -101.194982};
var infowindow = new google.maps.InfoWindow({
 content:'<div class=currentWindow>'+'</div>'
});

geocoder.geocode({'address': 'Morelia',}, function(results,status) {
   if (status === 'OK') {
     mexicoMap.setCenter(results[0].geometry.location);
     infowindow.setPosition(results[0].geometry.location);
     new google.maps.Marker({
       map: morelia,
       position: results[0].geometry.location
     });
   } else {
     window.alert('Google was not successful for the following reason: ' + status);
   }
});
}
//this zooms the map to a street view
function zoomToStreet() {
 morelia.setZoom(22);
}
function startButtonEvents() {

 document.getElementById('btnZoomToStr').addEventListener('click',function(){
   zoomToStreet();
 });
 document.getElementById('btnRoad').addEventListener('click',function(){
   mexicoMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
 });
 document.getElementById('btnSat').addEventListener('click',function(){
   mexicoMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
 });
 document.getElementById('btnHyb').addEventListener('click',function() {
   mexicoMap.setMapTypeId(google.maps.MapTypeId.HYBRID);
 });
 document.getElementById('btnTer').addEventListener('click',function(){
   mexicoMap.setMapTypeId(google.maps.MapTypeId.TERRAIN);
 });

 google.maps.event.addListener(,'click',function(){
 var morGeoCode =  new google.maps.Geocoder;
 morGeoCode.geocode({location:{lat: 19.705950,lng: -101.194982}},function(results,status){
   if (status===google.maps.GeocoderStatus.OK){
     mexicoMap.setCenter(results[0].geometry.location);
     infowindow.open(mexicoMap, new google.maps.StreetViewPanorama({infowindow,
       position:morelia,
       pov: {
         heading:34,
         pitch:10
       },
       zoomControl:true,
       visible: true
     }),morelia);
   } else {
     console.log('did not work');
   }
 });
 //use geocoder to open an info window at markers
 //have the info window display a google street view 
 //of the location
});

google.maps.event.addListener(mexicoMap,'click',function(){
 infowindow.close();
});

};


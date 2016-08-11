'use strict';
/****************************
------------model------------               
*****************************/
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

// view model
function initMXMap() {
  google.maps.visualRefresh = true;
  var mapOptions = {
    zoom: 14,
    center: new google.maps.LatLng(19.7060,-101.1950),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
     position: google.maps.ControlPosition.BOTTOM_CENTER,
     mapTypeIds:[google.maps.MapTypeId.ROADMAP]
    },
    panControl:true,
    panControlOptions: {
     position: google.maps.ControlPosition.TOP_RIGHT
    },
    zoomControl: true,
    zoomControlOptions: {
     style: google.maps.ZoomControlStyle.LARGE,
     position: google.maps.ControlPosition.LEFT_CENTER
  }

  morelia = new google.maps.Map(document.getElementById('morelia'), mapOptions);

};

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
      viewmodel.selectedLocations = ko.observableArray(locations);
      viewmodel.locations = locations;
      viewmodel.selectedLocation = ko.observable(locations[0]);

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

  // properties
  viewmodel.title = ko.observable(locations[0].title);
  viewmodel.lat = ko.observable(locations[0].lat);
  viewmodel.lng = ko.observable(locations[0].lng);
  viewmodel.streetAddress = ko.observable(locations[0].streetAddress);
  viewmodel.cityAddress = ko.observable(locations[0].cityAddress);
  viewmodel.url = ko.observable(locations[0].url);


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


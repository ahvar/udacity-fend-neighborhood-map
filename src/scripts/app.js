{
// model
var morelia;
var lugares = [];
// TODO: Complete the following function to initialize the map
function initMXMap() {
  google.maps.visualRefresh = true;
  var mapOptions = {
  zoom: 10,
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
};
// TODO: use a constructor to create a new map JS object. You can use the coordinates
// we used, 40.7413549, -73.99802439999996 or your own!
morelia = new google.maps.Map(document.getElementById('morelia'), mapOptions);

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
});}

};


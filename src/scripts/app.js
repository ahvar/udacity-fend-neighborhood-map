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
    tags: ['monuments','architecture','aqueduct','landmark','historic']
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
    tags: ['cathedral','church','building','historic','architecture','landmark','center','catholic']
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
    tags: ['stadium','soccer','futbol','sports']
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
    tags: ['sculpture','horse','monument','historic','statue','Jose Maria Morelos']
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
    tags: ['government','historic','palace','court','justice','legal','museum','culture']
  },
];

/*
 * A map of Morelia, Michoacan, MX
 */
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
    if(viewmodel.start && !viewmodel.markersDropped) {
      viewmodel.dropMarkers();
    } 
  }
};


/*********************************************************************
/************************** LOCATION *********************************
/* This global object creates several knockout observables defining
/* a specific point of interest. Observables notify potential subscribers
/* whenever a value changes. The location object is used by the view model 
**********************************************************************/

var Location = function(model,parent) {

  // Object properties
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
    icon: 'images/situation-pin.png'
  });

  google.maps.event.addListener(marker,'click',(function(location,parent){
    return function() {
      parent.showLocation(location);
    };
  })(this,parent));
 
  this.marker = marker;
};


var Select = function(search) {
  this.word = ko.observable(search.title);
  this.is = ko.observable(true);
};

/*********************************************************************
//************************** VIEW MODEL *******************************
**********************************************************************/

var viewmodel = function() {
  var self = this;

  // view model properties
  self.selectWord = ko.observable('');
  self.selectedLocation = ko.observable();
  self.start = false;
  self.markersDropped = false;
  self.networkProblem = ko.observable(false);

  self.init = function() {
    var searchWordsArray = [];
    var currentDropDown = [];

    /*create an array to hold locations of interest to user*/
    self.selectedLocationArray = ko.observableArray([]);

    /* 
     * Use a nested for loop to make a KO observable for each
     * location in model and loop through the tags for each location
     * and add them to the list of searchable words
     */
    var allLocations = locations;
    for (var i = 0; i < allLocations.length; i++) {
      self.selectedLocationArray.push(new Location(allLocations[i], self));
      // if the tag doesn't already exist within the array of search words then push
      for (var j = 0; j < allLocations[i].tags.length; j++) {
        if(allLocations[i].tags[j].indexOf(searchWordsArray) < 0) {
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

  self.populateInfoWindow = function(marker,infowindow) {
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
    }
  }
};

var viewmodel = new viewmodel();

$(document).ready(function() {
  vm.init();
  ko.applyBindings(vm);

  $(window).on('resize', function() {
    google.maps.event.trigger(morelia.map,'resize');
    morelia.map.setCenter(morelia.options.center);
  });
});

google.maps.event.addDomListener(window,'load',morelia.init(vm));








      













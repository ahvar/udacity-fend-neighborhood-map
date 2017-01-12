
// scrap code from morelia
infowindow: new google.maps.InfoWindow(),
    options: {
        center: {
            lat: 19.7060,
            lng: -101.1950
        },
        zoom: 12
    },
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
    },
    infoWindowContent: '<div class = "info-window"><div class="window-title">%title%</div><div class="window-description">%description%</div></div>',



    // scrap code from ViewModel
     var allLocations = locations;
        for (var i = 0; i < allLocations.length; i++) {
            self.selectedLocationArray.push(new Location(allLocations[i], self));
            // if the tag doesn't already exist within the array of search words then push
            for (var j = 0; j < allLocations[i].tags.length; j++) {
                if (allLocations[i].tags[j].indexOf(searchWordsArray) < 0) {
                    searchWordsArray.push(allLocations[i].tags[j]);
                }
            }
        }

        for (var k = 0; k < searchWordsArray.length; k++) {
            searchWordsArray.push(new Select({
                word: searchWordsArray[k]
            }));
        }



// self.displayLocation
         if (!location.initialized()) {
            //store nyt url in variable nytURL
            var nytURL = "http://api.nytimes.com/svc/semantic/v2/articlesearch.json";

            //add parameter for country and api key to nytURL
            nytURL = +$.param({
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
                    $.each(articles, function(index, element) {
                        $nytElem.append('<li class="article">' + '<a href= "' + element.web_url + '">' + selectedCity + '</a>' +
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




self.populateInfoWindow = function(marker, infowindow) {
        if (infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
            var streetView = new google.maps.StreetViewService();
            var radius = 50;

            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
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
                streetView.getPanoramaByLocation(marker.position, radius, getStreetView);
                infowindow.open(morelia, marker);
            }
        }
    };
};
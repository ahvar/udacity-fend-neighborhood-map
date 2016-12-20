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
var map, featureList, spatialFolkSearch = [], susPartnerSearch = [];

var mapStartCoords = [-42.0288, 146.7828];
var mapStartZoom = 7;

$(document).on("click", ".feature-row", function(e) {
  sidebarClick(parseInt($(this).attr("id"), 10));
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  //map.fitBounds(boroughs.getBounds());
  map.setView(mapStartCoords, mapStartZoom)
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

$(function(){
  $('#submitform').click(function()
  {
      console.log('triggered send mail')
      var email = $("#email").val(); // get email field value
      var firstname = $("#firstname").val(); // get name field value
      var lastname = $("#lastname").val(); // get name field value
      var msg = $("#msg").val(); // get message field value
      sendMail(email, firstname + ' ' + lastname, msg);
      $('#aboutModal').modal('hide');
      $("#email").val('');
      $("#firstname").val('');
      $("#lastname").val('');
      $("#msg").val('');
      return false; // prevent page refresh
  });
});

function sidebarClick(id) {
  map.addLayer(susPartnersLayer).addLayer(spatialFolksLayer);
  var layer = markerClusters.getLayer(id);
  lat = layer.feature.geometry.coordinates[0][1]
  lng = layer.feature.geometry.coordinates[0][0]
  if(lat===undefined) {
    lat = layer.feature.geometry.coordinates[1]
    lng = layer.feature.geometry.coordinates[0]
  }
  map.setView([lat, lng], 16);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function sendMail(fromEmail, fromName, message) {
  var m = new mandrill.Mandrill('U4CqG61u1EvbqlWA4NNTjQ');

  var params = {
    "message": {
        "from_email": fromEmail,
        'from_name': fromName,
        "to":[{"email":"alexgleith@gmail.com"}],
        "subject": 'SSSI Spatial Folks Form Submission',
        "text": message
    }
  };

  m.messages.send(params, function(res) {
        console.log(res);
        alert('Message sent, thanks for the feedback!')
    }, function(err) {
        console.log(err);
        alert('Message failed, please contact us via email...')
    });
}

//Define base layers
var LISTTopographic = new L.tileLayer("https://services.thelist.tas.gov.au/arcgis/rest/services/Basemaps/Topographic/ImageServer/tile/{z}/{y}/{x}", {
    attribution: "Basemap &copy The LIST",
    maxZoom: 20,
    maxNativeZoom: 18
});

var LISTAerial = new L.tileLayer("https://services.thelist.tas.gov.au/arcgis/rest/services/Basemaps/Orthophoto/ImageServer/tile/{z}/{y}/{x}", {
    attribution: "Basemap &copy The LIST",
    maxZoom: 20,
    maxNativeZoom: 19
});

var baseLayers = {
  "LIST Basemap": LISTTopographic,
  "LIST Imagery": LISTAerial
};


/* Overlay Layers */
var highlight = L.geoJson(null);

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

/* Empty layer placeholder to add to layer control for listening when to add/remove spatialfolks to markerClusters layer */
var susPartnersLayer = L.geoJson(null);
var susPartners = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/suspartner.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<center><img src=\"images/"+feature.properties.LogoImage+"\" height='200'></center>"+
      "<table class='table table-striped table-bordered table-condensed'>" + 
      "<tr><th>Name</th><td>" + feature.properties.Name + 
      "</td></tr>" + "<tr><th>Type</th><td>" + feature.properties.Type + "</td></tr>" + 
      "<tr><th>Description</th><td>" + feature.properties.Descriptio + 
      "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.Website + 
      "' target='_blank'>" + feature.properties.Website + "</a></td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="'+L.stamp(layer)+'"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/suspartner.png"></td><td class="feature-name">'+layer.feature.properties.Name+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      var featureObj = {
        name: layer.feature.properties.Name,
        address: layer.feature.properties.Type,
        source: "susPartners",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[0][1],
        lng: layer.feature.geometry.coordinates[0][0]
      };
      susPartnerSearch.push(featureObj);
    }
  }
});

$.getJSON("data/suspartners.geojson", function (data) {
  susPartners.addData(data);
  map.addLayer(susPartnersLayer);
});

/* Empty layer placeholder to add to layer control for listening when to add/remove suspartners to markerClusters layer */
var spatialFolksLayer = L.geoJson(null);
var spatialFolks = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/spatialfolk.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.Name,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.Address + "</td></tr>" + "<tr><th>Description</th><td>" + feature.properties.Description + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.Link + "' target='_blank'>" + feature.properties.Link + "</a></td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });

      var textforrow = '<tr class="feature-row" id="'+L.stamp(layer)+'"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/spatialfolk.png"></td><td class="feature-name">'+layer.feature.properties.Name+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>'
      $("#feature-list tbody").append(textforrow);
      var featureObj = {
        name: layer.feature.properties.Name,
        address: layer.feature.properties.Address,
        source: "spatialFolks",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      };
      spatialFolkSearch.push(featureObj);
    }
  }
});

var query = "SELECT * from 1SwmC7fBjasWmiHx3A9sW33XtI-kOhwF5gUiaUdNP";
var encodedQuery = encodeURIComponent(query);
// Construct the URL
var url = ['https://www.googleapis.com/fusiontables/v1/query'];
url.push('?sql=' + encodedQuery);
url.push('&key=AIzaSyCmnbiEvpRCR0TziQLKSb6QbyHFH1Jn9kg');
url.push('&callback=?');

//global for the featurelist
var featureList
$.ajax({
  url: url.join(''),
  dataType: 'jsonp',
  success: function (data) {
    var allFeatures = []
    for (i = 0; i < data.rows.length; i++) { 
      var geojsonFeature = {
        "type": "Feature",
        "properties": {
            'Name': data.rows[i][1],
            'Address': data.rows[i][2],
            'Description': data.rows[i][3],
            'Link': data.rows[i][4]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [parseFloat(data.rows[i][5].split(',')[1]), parseFloat(data.rows[i][5].split(',')[0])]
        }
      };
      allFeatures.push(geojsonFeature)
    }
    var featuresCollection = { 
      "type": "FeatureCollection",
      "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      "features": allFeatures
    }
    spatialFolks.addData(featuresCollection);
    map.addLayer(spatialFolksLayer);

    //Oops, a ridiculous hack - CAREFUL!
    runAtEnd();
  }
});

map = L.map("map", {
  zoom: mapStartZoom,
  center: mapStartCoords,
  layers: [LISTTopographic, markerClusters, highlight],
  zoomControl: false,
  attributionControl: false
});

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === susPartnersLayer) {
    markerClusters.addLayer(susPartners);
  }
  if (e.layer === spatialFolksLayer) {
    markerClusters.addLayer(spatialFolks);
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === susPartnersLayer) {
    markerClusters.removeLayer(susPartners);
  }
  if (e.layer === spatialFolksLayer) {
    markerClusters.removeLayer(spatialFolks);
  }
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
  $("#attribution").append(('<br>Data &copy; SSSI, <a href="https://creativecommons.org/licenses/by/3.0/au/deed.en">CC-BY</a>')); 
}

map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Dev by <a href='http://agl.pw'>agl</a> based on <a href='https://github.com/bmcbride/bootleaf'>Bootleaf</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var groupedOverlays = {
  "Points of Interest": {
    "<img src='assets/img/spatialfolk.png' width='24' height='28'>&nbsp;Spatial Professionals": spatialFolksLayer,
    "<img src='assets/img/suspartner.png' width='24' height='28'>&nbsp;Sustaining Partners": susPartnersLayer
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});
/* Typeahead search functionality */
var runAtEnd = function() {
  $("#loading").hide();
  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});
  var spatialfolksBH = new Bloodhound({
    name: "spatialFolks",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: spatialFolkSearch,
    limit: 10
  });

  var suspartnersBH = new Bloodhound({
    name: "susPartners",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: susPartnerSearch,
    limit: 10
  });

  spatialfolksBH.initialize();
  suspartnersBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "spatialFolks",
    displayKey: "name",
    source: spatialfolksBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/spatialfolk.png' width='24' height='28'>&nbsp;Spatial People</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }, {
    name: "susPartners",
    displayKey: "name",
    source: suspartnersBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/suspartner.png' width='24' height='28'>&nbsp;Sustaining Partners</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{type}}</small>"].join(""))
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "spatialFolks") {
      if (!map.hasLayer(spatialFolksLayer)) {
        map.addLayer(spatialFolksLayer);
      }
      map.setView([datum.lat, datum.lng], 16);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if (datum.source === "susPartners") {
      if (!map.hasLayer(susPartnersLayer)) {
        map.addLayer(susPartnersLayer);
      }
      map.setView([datum.lat, datum.lng], 16);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
}


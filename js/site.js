$(function() {
	var MarkerItem = Backbone.Model.extend({
		defaults : {
			venueName : "unknownName",
			venueType : "unknownType",
			latitude : null,
			longitude : null,
		},
		setMarkerObj : function(markerObj) {
			this.set({
				'markerObj' : markerObj
			});
		}
	});

	var MarkerItemView = Backbone.View.extend({
		initialize : function() {
		},
		render : function(gmapObj) {
			var location = new google.maps.LatLng(this.model.get('latitude'),
					this.model.get('longitude'));
			this.addToMap(gmapObj, location);
		},
		setIcon : function(icon) {
			this.iconImage = icon;
		},
		addToMap : function(gmapObj, location) {
			var marker = new google.maps.Marker({
				position : location
			});
			marker.setIcon(this.model.get('icon'));
			marker.setMap(gmapObj);
			var infowindow = new google.maps.InfoWindow({
				content : this.model.get('venueName')
			});
			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(gmapObj, marker);
			});
			this.model.setMarkerObj(marker);
		},
		removeFromMap : function() {
			this.model.get('markerObj').setMap(null);
		}
	});

	var MarkerList = Backbone.Collection.extend({
		model : MarkerItem
	});

	var MarkerListView = Backbone.View.extend({
		el : $('body'),
		events : {
			'change #choose_venue_select' : 'changeMarkers'
		},
		initialize : function() {
			this.collection = new MarkerList();
		},
		setVenueParams : function(jsonVenueParams) {
			this.arrVenues = jsonVenueParams;
		},
		setIconsParams : function(jsonIconsParams) {
			this.jsonIconsParams = jsonIconsParams;
		},
		setGmapObj : function(gmapObj) {
			this.gmapObj = gmapObj;
		},
		changeMarkers : function() {
			this.removeMarkers();
			var selectedVenueType = $('#choose_venue_select').val();
			this.render(selectedVenueType);
		},
		render : function(selectedVenueType) {
			var venue, marker;
			for ( var i = 0; i < this.arrVenues.length; i++) {
				venue = this.arrVenues[i];
				if (typeof (selectedVenueType) === 'undefined'
						|| selectedVenueType.toLowerCase() == 'all'
						|| selectedVenueType.toLowerCase() == venue.venueType
								.toLowerCase()) {
					marker = new MarkerItem();
					marker.set({
						venueName : venue.venueName,
						venueType : venue.venueType,
						latitude : venue.latitude,
						longitude : venue.longitude,
						icon : this.jsonIconsParams[venue.venueType]
					});
					this.collection.add(marker); // adds to collection
				}
			}
			this.renderMarkers();
		},
		renderMarkers : function() {
			for ( var i = 0; i < this.collection.length; i++) {
				var markerItemView = new MarkerItemView({
					model : this.collection.at(i)
				});
				markerItemView.render(this.gmapObj);
			}
		},
		removeMarkers : function() {
			for ( var i = 0; i < this.collection.length; i++) {
				var markerItemView = new MarkerItemView({
					model : this.collection.at(i)
				});
				markerItemView.removeFromMap();
			}
			;
			for ( var i = this.collection.length - 1; i > -1; i--) {
				this.collection.remove(this.collection.at(i));
			}
		},
		populateVenueSelector : function() {
			var arrUniqueVenues = [];
			var venueType;
			for ( var i = 0; i < this.arrVenues.length; i++) {
				venueType = this.arrVenues[i].venueType;
				if ($.inArray(venueType, arrUniqueVenues) == -1) {
					arrUniqueVenues.push(venueType);
				}
			}
			arrUniqueVenues.sort();
			arrUniqueVenues.splice(0, 0, 'All');
			for ( var i = 0; i < arrUniqueVenues.length; i++) {
				$('<option>').appendTo($('#choose_venue_select')).html(
						arrUniqueVenues[i].toLowerCase()).attr('value',
						arrUniqueVenues[i]);
			}
		},
	});

	var MapItem = Backbone.Model.extend({
		defaults : {
			mapJson : "unknownFile",
		},
		setMapJson : function(json) {
			this.mapJson = json;
		}
	});

	var MapItemView = Backbone.View.extend({
		initialize : function() {
		},
		render : function(jsonMapParams) {
			var jsonMain = this.model.mapJson;
			// create google map without markers
			var jsonMapParams = jsonMain.map_general;
			$("#map_name").html(jsonMapParams['area_name']);
			var jsonVenueParams = jsonMain.venues;
			var jsonIcons = jsonMain.icons;
			var mapProp = {
				center : this.getGmapLocationObject(
						jsonMapParams.center.latitude,
						jsonMapParams.center.longitude),
				zoom : jsonMapParams.zoom,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			};
			var gmapObj = new google.maps.Map(document
					.getElementById("googleMap"), mapProp);
			// add markers
			var markerListView = new MarkerListView();
			markerListView.setVenueParams(jsonVenueParams);
			markerListView.setIconsParams(jsonIcons);
			markerListView.setGmapObj(gmapObj);
			markerListView.render();
			markerListView.populateVenueSelector();
		},
		getGmapLocationObject : function(latitude, longitude) {
			return new google.maps.LatLng(latitude, longitude);
		}

	});

	var JsonInterface = function() {
		this.jsonObj = null;
		this.url = null;

		this.setUrl = function(url) {
			this.url = url;
		}
		this.load = function() {
			var self = this;
			$.ajax({
				type : "GET",
				url : this.url,
				async : false,
				dataType : "json",
				success : function(data) {
					self.jsonObj = data;
				},
				error : function(xhr, ajaxOptions, thrownError) {
					alert("status: " + xhr.status);
					alert("error: " + thrownError);
				}
			});
		}
		this.getJsonObj = function() {
			return this.jsonObj;
		}
	}

	var getJson = function(url) {
		var jsonInterface = new JsonInterface();
		jsonInterface.setUrl(url);
		jsonInterface.load();
		return jsonInterface.getJsonObj();
	}

	var createMap = function() {
		// clear venue type list
		$('#choose_venue_select').find('option').remove();
		// get value of map json
		var jsonFile = $('#choose_map_select').val();
		var mapItem = new MapItem();
		var json = getJson(jsonFile);
		mapItem.setMapJson(json);
		var mapItemView = new MapItemView({
			model : mapItem
		});
		mapItemView.render();

	}

	var doAnimation = function() {
		$('#googleMap').animate({
			marginLeft : "-=2000px",
		}, 1000, 
		function() { // after completion - makes op sync
			createMap();
			moveMapOn();
		});
	}

	var moveMapOn = function() {
		$('#googleMap').animate({
			marginLeft : "+=2000px",
		}, 1000);
	}

	var init = function() {
		var jsonMaps = getJson('json/maps.json');
		// populate map selector dropdown
		var mapsArray = jsonMaps.maps;
		for ( var i = 0; i < mapsArray.length; i++) {
			var mapOption = mapsArray[i];
			var mapLabel = mapOption.label;
			var jsonFile = mapOption.jsonFile;
			$('<option>').appendTo($('#choose_map_select')).html(mapLabel)
					.attr('value', jsonFile);
		}
	}

	$('#choose_map_select').change(function() {
		if ($(this).val() != "") {
			doAnimation();
		}
	});

	init();
});
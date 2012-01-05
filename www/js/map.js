var osm = {cpan: {}, leftpan: {on: false}, mappan: {}, ui: {fs: false}, layers:{}, markers:{}};
var search = {};
var wpc = {
  layers: null,
  rq: null,
  bbox: null,
  zoom: null
};

function $_(id) { return document.getElementById(id); }

function setView(position) {
  osm.map.setView(new L.LatLng(position.coords.latitude, position.coords.longitude), 10);
}

function reloadKML() {
  if (!wpc.layers.visible) return;
  //if(osm.map.getZoom()<13) return;
  var zoom = osm.map.getZoom();
  var bounds = osm.map.getBounds();
  var minll = bounds.getSouthWest();
  var maxll = bounds.getNorthEast();
  if(wpc.zoom && wpc.bbox)
    if(wpc.zoom == zoom && minll.lng >= wpc.bbox[0] && minll.lat >= wpc.bbox[1] && maxll.lng <= wpc.bbox[2] && maxll.lat <= wpc.bbox[3])
      return;
  var w = maxll.lng - minll.lng;
  var h = maxll.lat - minll.lat;
  wpc.bbox = []
  wpc.bbox[0] = minll.lng - w/2;
  wpc.bbox[1] = minll.lat - h/2;
  wpc.bbox[2] = maxll.lng + w/2;
  wpc.bbox[3] = maxll.lat + h/2;
  wpc.zoom = zoom;
  wpc.layers.clearLayers();
  var url = 'http://osm.sbin.ru/osm-wp2/www/wpc.php?bbox=' + wpc.bbox[0] + ',' + wpc.bbox[1] + ',' + wpc.bbox[2] + ',' + wpc.bbox[3];
  wpc.layers.addKML(url);
}

osm.saveLocation = function() {
  var ll = osm.map.getCenter();
  var z = osm.map.getZoom();
  var l = escape(osm.map.control_layers.currentBaseLayer().name);

  var d = new Date();
  d.setYear(d.getFullYear()+10);
  
  document.cookie = "_osm_location=" + ll.lng + "|" + ll.lat + "|" + z + "|" + l + "; expires=" + d.toGMTString();
}

osm.getCookie = function(name) {
  var cookie = " " + document.cookie;
  var search = " " + name + "=";
  var setStr = null;
  var offset = 0;
  var end = 0;
  if (cookie.length > 0) {
    offset = cookie.indexOf(search);
    if (offset != -1) {
      offset += search.length;
      end = cookie.indexOf(";", offset)
	if (end == -1) {
	  end = cookie.length;
	}
      setStr = unescape(cookie.substring(offset, end));
    }
  }
  return(setStr);
}

function init() {
  parseGET();
  var w;
  if (self.innerHeight) w = self.innerWidth;
  else if (document.documentElement && document.documentElement.clientHeight) w = document.documentElement.clientWidth;
  else if (document.body) w = document.body.clientWidth;

  var loc = osm.getCookie('_osm_location');
  var center;
  var zoom;
  if(loc) {
    var locs = loc.split('|');
    center = new L.LatLng(locs[1], locs[0]);
    zoom = locs[2];
    layer = unescape(locs[3]);
  } else {
    center = new L.LatLng(62.0, 88.0);
    zoom = w > 1200 ? 3 : 2;
    layer = "Mapnik";
  }
  
  osm.layers.layerMapnik = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy; <a href='http://osm.org'>OpenStreetMap</a> contributors"});
  osm.layers.layerKosmo = new L.TileLayer('http://{s}.tile.osmosnimki.ru/kosmo/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy <a href='http://osm.org'>OpenStreetMap</a> contributors, CC-BY-SA; rendering by <a href='http://kosmosnimki.ru'>kosmosnimki.ru</a>"});
  osm.layers.layerTAH = new L.TileLayer('http://{s}.tah.openstreetmap.org/Tiles/tile/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy; <a href='http://osm.org'>OpenStreetMap</a> contributors (TAH)"});
  osm.layers.layerCycle = new L.TileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy; <a href='http://osm.org'>OpenStreetMap</a> contributors (Cycle)"});
  osm.layers.layerMQ = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy; <a href='http://osm.org'>OpenStreetMap</a> contributors, tiles &copy; <a href=\"http://www.mapquest.com/\" target=\"_blank\">MapQuest</a> <img src=\"http://developer.mapquest.com/content/osm/mq_logo.png\">", subdomains: '1234'});
  osm.layers.layerBing = new L.BingLayer('AjNsLhRbwTu3T2lUw5AuzE7oCERzotoAdzGXnK8-lWKKlc2Ax3d9kzbxbdi3IdKt', {maxZoom: 18});
  osm.layers.layerLatlonPt = new L.TileLayer('http://{s}.tile.osmosnimki.ru/pt/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Маршруты &copy; <a href='http://latlon.org/pt'>LatLon.org</a>", subdomains: 'abcdef'});
  osm.layers.layerKosmoHyb = new L.TileLayer('http://{s}.tile.osmosnimki.ru/hyb/{z}/{x}/{y}.png', {maxZoom: 18, attribution: "Map data &copy <a href='http://osm.org'>OpenStreetMap</a> contributors, CC-BY-SA; rendering by <a href='http://kosmosnimki.ru'>kosmosnimki.ru</a>"});
  osm.map = new L.Map('map', {zoomControl: false, center: center, zoom: zoom, layers: [osm.layers.layerMapnik]});

  osm.layers.search_marker = new L.LayerGroup();
  osm.layers.osb = new L.OpenStreetBugs();
  osm.map.addLayer(osm.layers.search_marker);
  WPCLayer = L.KML.extend({
    visible: false,
    onAdd: function(map) {
      this._map = map;
      this._map.on('moveend',reloadKML,this);
      this.visible = true;
      this._iterateLayers(map.addLayer, map);
      reloadKML();
    },
    onRemove: function(map) {
      this._map.off('moveend',reloadKML,this);
      this._iterateLayers(map.removeLayer, map);
      this.visible = false;
      delete this._map;
    }
  });
  wpc.layers = new WPCLayer();
  osm.map.control_layers = new L.Control.Layers(
    {
      'Mapnik':osm.layers.layerMapnik,
      'Космоснимки':osm.layers.layerKosmo,
      'Osmarender':osm.layers.layerTAH,
      'MapQuest':osm.layers.layerMQ,
      'Карта для велосипедистов':osm.layers.layerCycle,
      'Bing (снимки)':osm.layers.layerBing
    },
    {
      'Неточность на карте (bugs)':osm.layers.osb,
      'Маршруты общ.транспорта':osm.layers.layerLatlonPt,
      'Космоснимки (гибрид)':osm.layers.layerKosmoHyb,
      'Фото (ВикиСклад) beta':wpc.layers
    }
  );
  osm.map.addControl(osm.map.control_layers);

  osm.leftpan.panel = $_('leftpan');
  osm.leftpan.content = $_('content_pan');
  osm.mappan.panel = $_('mappan');
  osm.input = $_('qsearch');
  osm.search_marker = new L.LayerGroup();
  osm.map.addLayer(osm.search_marker);
  
  //osm.map.control_layers.chooseBaseLayer(layer);
  osm.map.addControl(new L.Control.Scale({width: 100, position: L.Control.Position.BOTTOM_LEFT}));
  osm.map.permalink = new L.Control.Permalink(osm.map.control_layers);
  osm.map.addControl(osm.map.permalink);
  osm.map.addControl(new L.Control.Zoom({shiftClick: true}));
  
  reloadKML(); 
  osm.map.on('moveend', reloadKML);

  search.inLoad();
  osm.setLinkOSB();

  osm.editUpdate();
  osm.map.on('moveend', osm.saveLocation);
  osm.map.on('moveend', osm.editUpdate);
};

osm.editUpdate = function() {
  var pos = osm.map.getBounds();
  var url="http://127.0.0.1:8111/load_and_zoom?left=" + pos._southWest.lng + "&top=" + pos._northEast.lat + "&right=" + pos._northEast.lng + "&bottom=" + pos._southWest.lat;
  var edit = $_('EditJOSM');
  edit.target = 'hiddenIframe';
  edit.href = url;
}

osm.setLinkOSB = function() {
  if (parseInt(get['bugid'])) {
    osm.map.addLayer(osm.layers.osb);
    osm.map.control_layers._update();
  }
};

osm.leftpan.toggle = function(on) {
  if (typeof on == "undefined") on = !this.on;
  var center = osm.map.getCenter();
  if (on != this.on) {
    if (on) {
      this.on = true;
      $_('downpan').className = '';
    }
    else {
      this.on = false;
      $_('downpan').className = 'left-on';
    }
    osm.map.invalidateSize();
  }
};

search.processResults = function(results) {
  try {
    if (results.error) {
      osm.leftpan.content.innerHTML='Произошла ошибка: ' + (results.error);
    } else if (results.find==0) {
      osm.leftpan.content.innerHTML='Ничего не найдено по запросу "' + (results.search)  + '"';
    }
    else if (results.find==1 && results.accuracy_find==0) {
      osm.leftpan.content.innerHTML='Пожалуйста, уточните запрос "' + (results.search) + '"';
    }
    else {
      var content = '<ul id="ol-search_result">';
      osm.layers.search_marker.clearLayers();
      var MyIcon = L.Icon.extend({
      iconUrl: '../img/marker.png',
      shadowUrl: '../img/marker-shadow.png',
      iconSize: new L.Point(18, 29),
      shadowSize: new L.Point(29, 29),
      iconAnchor: new L.Point(8, 29),
      popupAnchor: new L.Point(-8, -50)
      });
      var icon = new MyIcon();
      var matches=results.matches;
      for (var i in matches) {
      content += ('<li><a href="" onClick="osm.map.setView(new L.LatLng(' + matches[i].lat + ',' + matches[i].lon + '), 16); return false;" info="id='+matches[i].id+'  weight='+matches[i].weight+'">' + matches[i].display_name + '</a></li>');
      marker = new L.Marker(new L.LatLng(matches[i].lat, matches[i].lon),{icon: icon});
      marker.bindPopup("<b>Адрес:</b><br /> " + matches[i].display_name);
      osm.layers.search_marker.addLayer(marker);
      }
      osm.map.setView(new L.LatLng(matches[0].lat, matches[0].lon), 11);
      content += '</ul>';
      osm.leftpan.content.innerHTML = content;
    }
  } catch(e) {
    osm.leftpan.content.innerHTML = 'Ошибка: ' + e.description + '<br /> Ответ поиск.серв.: '+results.error;
  }
};

search.errorHandler = function(jqXHR, textStatus, errorThrown) {
  osm.leftpan.content.innerHTML = 'Ошибка: ' + textStatus + '<br />' + errorThrown.message;
};

search.search = function(inQuery) {
  inQuery = inQuery || osm.input.value;
  osm.input.value = inQuery;
  if (inQuery.length < 1)
    return false;
  mapCenter=osm.map.getCenter();
  osm.leftpan.toggle(true);
  $.getJSON('/api/search', {q: inQuery, accuracy: 1, lat: mapCenter.lat, lon: mapCenter.lng}, search.processResults)
  .error(search.errorHandler);
/*  this.request = new XMLHttpRequest();
  //this.request.open('GET', 'http://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(osm.input.value) + '&format=json');
  this.request.open('GET', '/api/search?q=' + encodeURIComponent(inQuery) + '&accuracy=1' + '&lat=' + mapCenter.lat + '&lon=' + mapCenter.lng);
  this.request.onreadystatechange = function(){search.processResults(this)};
  this.request.send(null);*/
  return false;
};

search.inLoad = function() {
  var query = get['q'] || '';
  if (query != '')
    search.search(query);
};

function parseGET() {
  var tmp = new Array();
  var tmp2 = new Array();
  get = new Array();
  var url = location.search;
  if(url != '') {
    tmp = (url.substr(1)).split('&');
    for(var i=0; i < tmp.length; i++) {
      tmp2 = tmp[i].split('=');
      get[tmp2[0]] = decodeURIComponent(tmp2[1].replace(/\+/g, " "));
    }
  }
};

osm.onPermalink = function () {
  mapCenter=osm.map.getCenter();
  osm.permalink.href = 'http://' + location.host + '?lat=' + mapCenter.lat + '&lon=' + mapCenter.lng + '&zoom=' + osm.map._zoom;
};

osm.ui.whereima = function() {
  navigator.geolocation.getCurrentPosition(setView);
};

osm.ui.togglefs = function() {
  if (osm.ui.fs) {
    document.body.className = '';
    $_('fsbutton').innerHTML = '&uarr;';
  }
  else {
    document.body.className = 'fs';
    $_('fsbutton').innerHTML = '&darr;';
  }
  osm.ui.fs = !osm.ui.fs;
};

osm.ui.searchsubmit = function() {
  return search.search($_('qsearch').value);
}

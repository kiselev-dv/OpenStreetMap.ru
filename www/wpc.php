<?
Header("Content-Type: text/xml; charset=utf-8");

include_once("include/passwd.php");
// declare $pgconnstr in include/passwd.php
pg_connect($pgconnstr);

function furl($f) {
  $m = md5($f);
  $url = "http://upload.wikimedia.org/wikipedia/commons/thumb/".
         $m[0]."/".$m[0].$m[1]."/".$f."/180px-".$f;
  $url = str_replace(" ","_",$url);
  return $url;
}

$emptykml = 
'<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://earth.google.com/kml/2.1">
 <Style id="Commons-logo">
  <IconStyle>
   <Icon>
    <href>img/commons.png</href>
   </Icon>
  </IconStyle>
 </Style>
</kml>';

$doc = new SimpleXMLElement($emptykml);

$bbox = explode(",", $_GET["bbox"]);

foreach($bbox as $v)
  if (!preg_match('/^-?\d+(\.\d+)$/', $v)) die;

$bbox = "ST_SetSRID(ST_GeomFromText('LINESTRING($bbox[1] $bbox[0],$bbox[3] $bbox[2])'),4326)";

$query = "SELECT page,\"desc\",ST_X(point) AS lon,ST_Y(point) AS lat FROM wpc_img WHERE point && $bbox LIMIT 256";

$res = pg_query($query);

while ($row = pg_fetch_assoc($res)) {
  $pm = $doc->addChild("Placemark");
  $pm->addChild("name");
  $pm->name = "<a href=\"http://commons.wikimedia.org/\"><img src=\"http://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/20px-Commons-logo.svg.png\" width=20 height=27 border=0></a> Wikimedia Commons";

  $pm->addChild("description");
  $pm->{'description'} = "<p>".$row["desc"]."</p><a href=\"http://commons.wikipedia.org/wiki/".htmlspecialchars($row["page"])."\" target=_blank><img src=\"".htmlspecialchars(furl(str_replace(" ","_",str_replace("File:","",$row["page"]))))."\" /></a>";
  $pm->addChild("styleUrl");
  $pm->styleUrl = "#Commons-logo";
  $p = $pm->addChild("Point");
  $p->addChild("coordinates");
  $p->coordinates = $row["lat"].",".$row["lon"].",0";
}

print $doc->asXML();
?>

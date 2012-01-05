<?
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

$cx = ($bbox[1]+$bbox[3])/2;
$cy = ($bbox[0]+$bbox[2])/2;
$dx = $bbox[3]-$bbox[1];
$dy = $bbox[2]-$bbox[0];
$dx = $dx/30;
$dy = $dy/30;
$bbox = "ST_SetSRID(ST_GeomFromText('LINESTRING($bbox[1] $bbox[0],$bbox[3] $bbox[2])'),4326)";
$center = "ST_SetSRID(ST_MakePoint($cx,$cy),4326)";
$dist = "ST_Distance_Sphere(MIN(point),$center)";
$dist = "RANDOM()";

$query = "SELECT MIN(page) AS page,MIN(\"desc\") AS \"desc\",MIN(ST_X(point)) AS lon,MIN(ST_Y(point)) AS lat FROM wpc_img WHERE point && $bbox GROUP BY ST_SnapToGrid(point,$cx,$cy,$dx,$dy) ORDER BY $dist ASC LIMIT 256";

$res = pg_query($query);
if(!$res) {
  Header("Content-Type: text/xml; charset=utf-8");
  $pm = $doc->addChild("Placemark");
  $pm->addChild("name");
  $pm->name = "Error in query";
  $pm->addChild("description");
  $pm->{'description'} = "<br/><b>$query<b>";
  $p = $pm->addChild("Point");
  $p->addChild("coordinates");
  $p->coordinates = $cx.",".$cy.",0";
  print $doc->asXML();
  exit;
}

Header("Content-Type: text/xml; charset=utf-8");

while ($row = pg_fetch_assoc($res)) {
  $pm = $doc->addChild("Placemark");
  $pm->addChild("name");
  $pm->name = "<a href=\"http://commons.wikimedia.org/\"><img src=\"img/commons-mini.png\" width=\"20\" height=\"27\" border=\"0\"></a> Wikimedia Commons";

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

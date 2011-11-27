<?

include_once("config.php");

function show_menu($current = '', $level = 0) {
  dbconn();
  $result = pg_query('SELECT * FROM pagedata WHERE level<='.$level.' AND activate');

  echo '<div id="menupan"><div id="menuback"></div><table><tr>';
  $menu = array();
  while ($row = pg_fetch_assoc($result))
    $menu[] = ($current == $row['name'] ? '<td><div class="current">'.$row['text'].'</div></td>' : '<td><a href="/'.$row['name'].'"><div>'.$row['text'].'</div></a></td>');
  if (checkauth()) $menu[] = "<td><div><a href=\"account\">Настройки</a></div></td>";
  else $menu[] = "<td><div><a href=\"login\">Войти</a></div></td>"; 
  echo implode($menu);
  echo '</tr></table></div>';
}

function show_menu_old($current = '', $level = 0) {
  dbconn();
  $result = pg_query('SELECT * FROM pagedata WHERE level<='.$level);

  echo '<div id="menupan"><ul>';
  $menu = array();
  while ($row = pg_fetch_assoc($result))
    $menu[] = ($current == $row['name'] ? '<li><div class="current">'.$row['text'].'</div></li>' : '<li><a href="'.$row['name'].'"><div>'.$row['text'].'</div></a></li>');
  echo implode($menu);
  echo '</ul></div>';
}

function err404($code=0) {
  header("Status: 404 Not Found");
  include_once '404.php';
  exit();
}

function err500() {
  header("Status: 500 Internal Server Error");
  echo 'Ошибка на сервере.';
  exit();
}

# Connect to database
function dbconn() {
  global $pg_conn, $pg_host, $pg_user, $pg_pass, $pg_base;
  if (isset($pg_conn)) return;
  $pg_conn = pg_connect("host='".$pg_host."' user='".$pg_user."' password='".$pg_pass."' dbname='".$pg_base."'") or die(Err500());
}

# SQL escape
function sqlesc($s) {
  return "'".pg_escape_string($s)."'";
}

# Checks for authorization
function checkauth() {
  global $osm_user, $osm_id;
  session_start();

  if (isset($osm_user)) return true;

  if (!isset($osm_user)) {
    $hash = $_COOKIE["osmru__hash"];
    if ($hash) {
      dbconn();
      $res = pg_query("SELECT osm_id,osm_user,oa_token,oa_secret FROM tokens WHERE hash=".sqlesc($hash));
      if (pg_num_rows($res)>0) {
	$row = pg_fetch_assoc($res);
	$osm_user = $row["osm_user"];
	$osm_id = $row["osm_id"];
	return true;
      }
    }
  }
  return false;
}
?>

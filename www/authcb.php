<?php

  session_start();

  include_once("include/passwd.php");
  include_once("include/functions.php");

  try {
    $oauth = new OAuth($oa_key, $oa_sec, OAUTH_SIG_METHOD_HMACSHA1, OAUTH_AUTH_TYPE_URI);
    $oauth->enableDebug();

    $oauth->setToken($_GET['oauth_token'], $_SESSION['secret']);
    $access_token_info = $oauth->getAccessToken($acc_url);
    $_SESSION['token'] = strval($access_token_info['oauth_token']);
    $_SESSION['secret'] = strval($access_token_info['oauth_token_secret']);
    $oauth->setToken($_SESSION['token'], $_SESSION['secret']);

    $oauth->fetch($api_url."user/details");
    $user_details = $oauth->getLastResponse();
  } catch(OAuthException $E) {
    print "<p><b>Ошибка авторизации:<pre>\n";
    print_r($E);
    exit;
  }

  $xml = simplexml_load_string($user_details);       
  $osm_id = strval($xml->user['id']);
  $osm_user = strval($xml->user['display_name']);

  $_SESSION['osm_id'] = $osm_id;
  $_SESSION['osm_user'] = $osm_user;

  $rt = $_SESSION["returnto"];
  unset($_SESSION["returnto"]);
  $hash = md5(uniqid($_SESSION["token"]));
  dbconn();
  pg_query("INSERT INTO tokens (hash,osm_id,osm_user,oa_token,oa_secret,ctime,mtime) VALUES (".
      sqlesc($hash).",".sqlesc($_SESSION["osm_id"]).",".sqlesc($_SESSION["osm_user"]).",".
      sqlesc($_SESSION["token"]).",".sqlesc($_SESSION["secret"]).",NOW(),NOW())");
  setcookie("osmru__hash",$hash,0x7fffffff);
  if(!$rt) $rt = "./account";
  Header("Location: ".$rt);
  exit;

?>

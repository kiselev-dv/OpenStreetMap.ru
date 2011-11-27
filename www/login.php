<?php

  session_start();
  
  include_once("include/passwd.php");

  try {
    $oauth = new OAuth($oa_key, $oa_sec, OAUTH_SIG_METHOD_HMACSHA1, OAUTH_AUTH_TYPE_URI);
    $request_token_info = $oauth->getRequestToken($req_url);
    $_SESSION['secret'] = $request_token_info['oauth_token_secret'];
    Header("Location: ".$authurl."?oauth_token=".$request_token_info['oauth_token']);
    exit;
  } catch (OAuthException $E) {
    print "<p><b>Ошибка авторизации:<pre>\n";
    print_r($E);
    exit;
  }

?>

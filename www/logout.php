<?
  include_once("include/functions.php");

  session_unset();
  session_write_close();
  dbconn();
  pg_query("DELETE FROM tokens WHERE hash=".sqlesc($_COOKIE["osmru__hash"]));
  setcookie("osmru__hash",null);
  Header("Location: ./");
  exit;
?>

<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */

/**
 * Session Vars:
 * user
 * school
 * server
 * putspam
 * putcount
 * timeoutVar
 * password
 * cookieNames
 * cookieValues
 * secretOpen
 * isTeacher
 * classes
 * isClassAdmin
 * class
 * userId
 * rank
 * aUsername
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/EasyCurl.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/EventData.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/TableChange.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/CWebUntis.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/WebUntis.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/DB_Requests.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/BasicTools.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/DB_Query.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/MySecure.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/Notifications.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/errorHandling.php";
require $_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/Auth.php";

session_start();
date_default_timezone_set("Europe/Vienna");

if (!BasicTools::IsSenseful($_COOKIE["timeoutVar"])) {
    MySecure::SetCookie("timeoutVar", "set", 60 * 60 * 24 * 365);
    $_SESSION["timeoutVar"] = "set";
} else if (!BasicTools::IsSenseful($_SESSION["timeoutVar"])) {
    if (!Auth::CookieLogin()) {
        $_SESSION["timeoutVar"] = "set";
        BasicTools::Log("[SessionTimeout]" . session_id());
        trigger_error("#error003", E_USER_ERROR);
    }
}

header_remove("Cache-Control");
header("Cache-Control: no-cache, must-revalidate", true);

BasicTools::Log("GET: " . json_encode($_GET) . " POST: " . json_encode($_POST), "inputoutput");

function BaseStart($link) {

    $random = rand(1, 1000000);
    if (111 == $random) {
        header("Location: https://jptr.ml/secret?secret=thatsAnError");
        die();
    }
    $arr = preg_split("/<php-(?:(\w*)\/>)/", file_get_contents($link), -1, PREG_SPLIT_DELIM_CAPTURE);
    $htm = array();
    for ($i = 1; $i < sizeof($arr); $i += 2) {
        $htm[$arr[$i]] = $arr[$i + 1];
    }
    $filename = substr($link, strrpos($link, "/") + 1);
    $site = substr($filename, 0, strrpos($filename, "."));
    $autologged = false;
    if (!BasicTools::IsSenseful($_SESSION["school"])) {
        Auth::CookieLogin();
        if (BasicTools::IsSenseful($_SESSION["school"])) {
            $autologged = true;
        }
    }

    //ie no support
    $ua = htmlentities($_SERVER['HTTP_USER_AGENT'], ENT_QUOTES, 'UTF-8');
    if (preg_match('~MSIE|Internet Explorer~i', $ua) || (strpos($ua, 'Trident/7.0; rv:11.0') !== false)) {
        die("<!doctype html><html><body><style>div{}#div1{border:black solid 2px;width:580.8px;height:92px;padding:5px;animation-timing-function: linear;animation-name: shit;animation-duration: 1s; animation-iteration-count: infinite;}#div2{position: absolute;animation-name: happens;animation-timing-function: linear;animation-duration: 30s;animation-direction:alternate; animation-iteration-count: infinite; }#div3{position:relative;width:100%;height:100%;} #div4{position:fixed;top:0px;left:0px;width:100%;height:100%;padding-right:594.8px;padding-bottom:106px;box-sizing: border-box;}@keyframes shit {0%   {background-color:red;}50%  {background-color:white; }100% {background-color:red;}  }@keyframes happens {0%   {top:0%;left:0%;}14%   {top:100%;left:25%;}28%   {top:0%;left:50%;}42%   {top:100%;left:75%;}50%   {top:50%;left:100%;}58%   {top:0%;left:75%;}72%   {top:100%;left:50%;}86%   {top:0%;left:25%;}100%   {top:100%;left:0%;} }</style><div id='div4'><div id='div3'><div id='div2'><div id='div1'>Leider können wir dieses Programm nicht unterstützen!<br>Wir vermuten es liegt an großen Sicherheitslücken oder am Fehlen sämtlicher Funktionen!<br> Zumindest ist es nicht als Browser geeignet!<br>Wir empfehlern Ihnen diese Fehlkonstruktion zu deinstallieren<br>und so etwas wie <a href=\"https://www.google.de/chrome/\">Chrome</a> oder <a href=\"https://www.mozilla.org/de/firefox/\">Firefox</a> zu verwenden!</div></div></div></div></body></html>");
    }

    $logged = GetLogged($autologged);
    /* $etag = filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/main.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/EasyCurl.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/WebUntis.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/BasicTools.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/CWebUntis.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/DB_Requests.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/DB_Query.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/TableChange.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/MySecure.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/EventData.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/Notifications.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/errorHandling.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/PHP/classes/Auth.php");
    $etag += filemtime($_SERVER['DOCUMENT_ROOT'] . "/HTML/main.html");
    $etag += filemtime($link);
    $etag = json_encode($logged) . strval($etag);
    $etag = md5($etag);
    header("ETag: $etag");*/

    $splitTags = preg_split("/<php-(?=\w*\/>)/", file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/HTML/main.html"));
    $splitTags[0] = "<!--Timestamp: " . date("d.m.Y H:i:s", time()) . "-->\n" . $splitTags[0];
    $additionalLinks = GetAdditionalLinks();
    $cssArr = GetStyle($site, array_key_exists("useapistylesheets", $htm) ? $htm["useapistylesheets"] : "");
    $style = $cssArr[0];
    $theme = $cssArr[1];
    foreach ($splitTags as $index => $split) {
        if (strpos($split, "title") === 0) {
            if (BasicTools::IsSenseful($htm["title"])) {
                echo $htm["title"];
            } else {
                echo "NO TITLE";
            }
        }
        if (strpos($split, "headline") === 0) {
            if (BasicTools::IsSenseful($htm["title"])) {
                $title = str_replace("-", "\u{2011}", $htm["title"]);
                if (strpos($title, ": ") !== false || strpos($title, " \u{2011} ") !== false) {
                    $titleArr = preg_split("/(: )|( \u{2011} )/", $title);
                    if ("Jupiter" == $titleArr[0]) {
                        echo BasicTools::Utf8Strrev($titleArr[0]);
                    } else {
                        echo BasicTools::Utf8Strrev("Jupiter;psbn&\u{2011} " . $titleArr[0]);
                    }

                } else {
                    echo BasicTools::Utf8Strrev($title);
                }

            } else {
                echo "retipuJ";
            }

        }
        if (strpos($split, "css") === 0) {
            echo $style;
        }
        if (strpos($split, "userbutton") === 0) {
            echo $logged[0];
        }

        if (strpos($split, "settings") === 0) {
            echo file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/DATA/settings.json");
        }

        if (strpos($split, "usertext") === 0) {
            echo $logged[1];
        }

        if (strpos($split, "outercontent") === 0 && array_key_exists("outercontent", $htm)) {
            echo $htm["outercontent"];
        }
        if (strpos($split, "content") === 0 && array_key_exists("content", $htm)) {
            echo $htm["content"];
        }

        if (strpos($split, "metas") === 0 && array_key_exists("metas", $htm)) {
            echo $htm["metas"];
            echo '<meta name="theme-color" content="' . $theme . '"/>';
            if ("dev.jptr.ml" == $_SERVER["SERVER_NAME"]) {
                echo '<meta name="robots" content="noindex, nofollow">';
            } else {
                echo '<meta name="robots" content="index, follow">';
            }

        }

        if (strpos($split, "outeroverlays") === 0 && array_key_exists("outeroverlays", $htm)) {
            echo $htm["outeroverlays"];
        }

        if (strpos($split, "oneSignalAppId") === 0) {
            if ("dev.jptr.ml" == $_SERVER["SERVER_NAME"]) {
                echo Notifications::TEST_APP_ID;
            } else {
                echo Notifications::APP_ID;
            }
        }

        if (strpos($split, "additionalLinks") === 0) {
            echo $additionalLinks;
        }

        if (strpos($split, "scripts") === 0 && array_key_exists("scripts", $htm)) {
            echo $htm["scripts"];
            if (null != $logged[2]) {
                echo "<script>
                        autoLogin('" . $logged[2] . "');
                        </script>";
            }
            if (strlen($link) > 13 && strpos($link, "settings.html", strlen($link) - 13)) {
                echo "<script>var serverSideSettings =" . json_encode(DB_Requests::GetSettings()) . "</script>";
            }
        }
        echo preg_replace("/\w*?\/>/", "", $splitTags[$index], 1);
    }
}

function GetLogged($autologged) {
    if ($autologged) {
        if (BasicTools::IsSenseful($_SESSION["user"])) {
            $user = $_SESSION["user"];
            if (BasicTools::TestSessVar("rank", false) !== false) {
                $user = BasicTools::TestSessVar("aUsername");
            }

            return array('showAccount()', $user, WebUntis::GetPersonalInfo());
        }
    }
    if (BasicTools::IsSenseful($_SESSION["user"])) {
        $user = $_SESSION["user"];
        if (BasicTools::TestSessVar("rank", false) !== false) {
            $user = BasicTools::TestSessVar("aUsername");
        }

        return array('logout()', $user, "AlreadyLoggedIn");
    }
    if (BasicTools::IsSenseful($_SESSION["school"])) {
        return array('logout()', "ABMELDEN", "school:" . $_SESSION["school"]);
    }
    return array('openLoginPopup()', "ANMELDEN", null);
}

function GetStyle($site, $apiLinks) {

    $style = "<style>";
    $css = file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/CSS/main.css");
    $css .= file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/CSS/icon.css");

    if (BasicTools::IsSenseful($site)) {
        if (file_exists($_SERVER['DOCUMENT_ROOT'] . "/CSS/" . $site . ".css")) {
            $style .= "/*contains " . $site . " css*/";
            $css .= file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/CSS/" . $site . ".css");
        } else {
            $style .= "/*contains no special css (" . $site . ")*/";
        }
    } else {
        $style .= "/*no site set*/";
    }

    $links = explode("|", $apiLinks);
    foreach ($links as $link) {
        if (BasicTools::IsSenseful($link) && strpos($link, "\n") === false) {
            $style .= "/*contains " . $link . " css*/";
            $css .= file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/CSS/api/" . $link . ".css");
        }
    }

    if (($themeName = BasicTools::Setting("theme")) !== false) {
        $css .= "/*themestart*/";
        $css .= file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/CSS/theme-" . $themeName . ".css");
        $css .= "/*themeend*/";
    }

    if (($opacity = BasicTools::Setting("timeOverlayOpacity")) !== false) {
        $css .= ".time-overlay {
            background-color: rgba(0, 0, 0, $opacity);
        }";
    }
    if (($bgcolor = BasicTools::Setting("backgroundColor")) !== false) {
        $css .= ":root {
    --col-background:$bgcolor;
    }";
    }
    if (($colHide = BasicTools::Setting("timeColHide")) !== false) {
        $css .= ".time-wrapper {
    display:$bgcolor;
    }";
    }

    $css = preg_replace('/((["\']).*?\2)|(\s+(?=\s)|\r?\n)/', "$1", $css);

    $splitCssTags = preg_split('/"php-(?=\w*?")/', $css);

    $style .= $css;
    $style .= "</style>";
    preg_match_all("/--col-theme:(.*?);/", $style, $theme);
    return array($style, end($theme[1]));
}

function GetAdditionalLinks() {
    $additionalLinks = "";
    if (BasicTools::TestSessVar("isTeacher", false) === true) {
        $additionalLinks .= "<a href='/teacher/'>Lehrer-Tools</a>";
    }

    if (BasicTools::TestSessVar("isBeta", false) === true) {
        $additionalLinks .= "<a href='#' onclick='showLog();'>Log(Beta)</a>";
    }

    if (BasicTools::TestSessVar("rank", false) >= 7) {
        $additionalLinks .= "<a href='/HTML/debug.html'>Debug</a><a href='/admin/'>AdminTools</a><a href='#' onclick='showLog();'>Log</a><a href='/review/'>Review</a><script>const admin=true;</script>";
    }

    return $additionalLinks;
}

<?php

class Ajax implements IAjax{

    private $chaptaSecret;//must be set somewhere

    static function Run(){

switch (BasicTools::PostTest("type")) {
case "put":
    Put();
    break;
case "get":
    Get();
    break;
case "login":
    Login();
    break;
case "logout":
    Logout();
    break;
case "validateChapta":
    ValidateChapta();
    break;
default:
    trigger_error("e004|" . BasicTools::PostTest("type"), E_USER_ERROR);
}

    }


function ValidateChapta() {
    echo $easycurl-> AskCurl("https://www.google.com/recaptcha/api/siteverify", "response=" . BasicTools::PostTest("response") . "&secret=$chaptaSecret");
}

function Logout() {
    $auth->Logout();
}

function Get() {
    $array = explode(",", BasicTools::PostTest("getType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
        case "":
            break;
        default:
            trigger_error("w002|$array[$i]", E_USER_WARNING);
            break;
        }
        if ($i + 1 != $length) {
            echo "[᚜#~SPLITTER~#᚛]";
        }
    }
}
function Put() {
    $array = explode(",", BasicTools::PostTest("putType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
        case "":
            break;
        default:
            trigger_error("w002|$array[$i]", E_USER_WARNING);
            break;
        }
        if ($i + 1 != $length) {
            echo "[᚜#~SPLITTER~#᚛]";
        }
    }
}


function Login() {
    $auth->TryLogin( BasicTools::PostTest("id"), BasicTools::PostTest("password"));
}}


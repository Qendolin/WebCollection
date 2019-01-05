<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Ajax implements IAjax{



    static function Run(){
header("Cache-Control:no-cache,must-revalidate");

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
    echo EasyCurl::AskCurl("https://www.google.com/recaptcha/api/siteverify", "response=" . BasicTools::PostTest("response") . "&secret=6Lf2pGkUAAAAALZ2X-ZsflVbVb1mf9N7KuuZSvsA");
}

function Logout() {
    //fill in (logout methode aufrufen)
}

function Get() {
    $array = explode(",", BasicTools::PostTest("getType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
        case "":
            break;
        case "something":
            // return something
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
        case "somthing":
            // save something
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
    //fill in (login methode aufrufen)
}}


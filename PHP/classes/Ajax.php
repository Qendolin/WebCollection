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
            case "messages":
                echo DB_Requests::GetMessages(BasicTools::PostTestOpt("msgType", "%"), BasicTools::PostTestOpt("msgCount", 30), BasicTools::PostTestOpt("reviewed", "%"));
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
            case "addEmp":
                MySecure::AddEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "editEmp":
                MySecure::EditEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "delMessage":
                DB_Requests::DelMessage(BasicTools::PostTest("id"));
                break;
            case "seeMessage":
                DB_Requests::SeeMessage(BasicTools::PostTest("id"));
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


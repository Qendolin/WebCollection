<?php

class Ajax implements IAjax {

    protected $chaptaSecret; //must be set somewhere

    public function __construct($chaptaSecret=null){

    }

    public function Run() {

        switch (BasicTools::PostTest("type")) {
        case "put":
            $this->Put();
            break;
        case "get":
            $this->Get();
            break;
        case "login":
            $this->Login();
            break;
        case "logout":
            $this->Logout();
            break;
        case "validateChapta":
            $this->ValidateChapta();
            break;
        default:
            trigger_error("e004|" . BasicTools::PostTest("type"), E_USER_ERROR);
        }

    }

    protected function ValidateChapta() {
        echo $easycurl->AskCurl("https://www.google.com/recaptcha/api/siteverify", "response=" . BasicTools::PostTest("response") . "&secret=$chaptaSecret");
    }

    protected function Logout() {
        $auth->Logout();
    }

    protected function Get() {
        $array = explode(",", BasicTools::PostTest("getType"));
        $length = count($array);
        for ($i = 0; $i < $length; $i++) {
            switch ($array[$i]) {
            case "":
                break;
            case "messages":
                echo $databaseRequests->GetMessages(BasicTools::PostTestOpt("msgType", "%"), BasicTools::PostTestOpt("msgCount", 30), BasicTools::PostTestOpt("reviewed", "%"));
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
    protected function Put() {
        $array = explode(",", BasicTools::PostTest("putType"));
        $length = count($array);
        for ($i = 0; $i < $length; $i++) {
            switch ($array[$i]) {
            case "":
                break;
            case "addEmp":
                $secure->AddEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "editEmp":
                $secure->EditEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "delMessage":
                $databaseRequests->DelMessage(BasicTools::PostTest("id"));
                break;
            case "seeMessage":
                $databaseRequests->SeeMessage(BasicTools::PostTest("id"));
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

    protected function Login() {
        $auth->TryLogin(BasicTools::PostTest("id"), BasicTools::PostTest("password"));
    }}

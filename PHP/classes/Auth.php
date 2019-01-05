<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Auth implements IAuth {
    private function Login($id, $password) {

        self::Logout();

    }
    public function TryLogin($id, $password, $save, $dontEcho = false, $additionalParameters = null) {
        if (!self::Login($id, $password, $additionalParameters)) {
            if ($dontEcho) {
                return false;
            } else {
                trigger_error();
            }
        }

        if ($save) {
            SaveLogin($id, $password, $additionalParameters);
        }

    }

    public function SaveLogin($id, $password, $additionalParameters) {
        $usertest = DB_Query::AskDB(STANDARDDATABASE, "Select * from login_users where username= ?;", $id);
        $encryptKey = MySecure::MakeCode();
        if (count($usertest) > 0) {
            $encryptKey = $usertest[0]["encryptKey"];
        } else {
            DB_Query::AskDB(STANDARDDATABASE, "Insert into login_users values(null,?,?);", $id, $encryptKey);
        }

        MySecure::SetCookie("additionalParameters", $additionalParameters);
        MySecure::SetCookie("id", $id);
        MySecure::SetCookie("password", MySecure::Encrypt($password, $encryptKey));

    }

    public function Logout() {
        setcookie("additionalParameters", "", time() - 3600, "/");
        setcookie("id", "", time() - 3600, "/");
        setcookie("password", "", time() - 3600, "/");
        if (session_status() != PHP_SESSION_NONE) {
            session_destroy();
            session_start();
            $_SESSION["timeoutVar"] = "set";
        }
    }
public function TryRelogin(){
    if (!self::ReLogin()) {
        if ($dontEcho) {
            return false;
        } else {
            trigger_error();
        }
    }
}

    private function ReLogin() {
        

        if (!BasicTools::IsSenseful($_COOKIE["id"]) || !BasicTools::IsSenseful($_COOKIE["password"])|| !BasicTools::IsSenseful($_COOKIE["additionalParameters"])) {
            return false;
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "Select * from login_users where username= ?;", MySecure::ReadCookie("id"));

        if (!count($res) > 0) {
            return false;
        }
        $pw = MySecure::Decrypt(MySecure::ReadCookie("password"), $res[0]["encryptKey"]);

        return self::TryLogin(MySecure::ReadCookie("id"), $pw, true, true, MySecure::ReadCookie("additionalParameters"));

    }
}

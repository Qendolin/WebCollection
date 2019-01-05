<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Secure implements ISecure {
    /**
     * ranks:
     * 0 nothing
     * 1
     * 2
     * 3
     * 4
     * 5
     * 6
     * 7
     * 8
     * 9 full admin
     */
    private const KEY = "g³D1S#Yẞ:4Üj";

    public  function Hash($unhashed) {
        return password_hash($unhashed, PASSWORD_BCRYPT);
    }

    public  function IsAllowed($neededrank) {
        if (!BasicTools::IsSenseful($_SESSION["rank"])) {
            return false;
        }

        if ($_SESSION["rank"] > $neededrank) {
            return true;
        }

        return false;
    }

    public  function MakeCode() {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < 100; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    public  function SetCookie($name, $value, $expire = -1, $path = "/") {
        if (-1 === $expire) {
            $expire = (time() + 60 * 60 * 24 * 365);
        }
        setcookie($name, self::Encrypt($value, "cookie"), $expire, $path);
    }

    public  function Encrypt($string, $key) {
        if (!BasicTools::IsSenseful($key)) {
            trigger_error("Encrypt Error", E_USER_ERROR);
        }
        $result = openssl_encrypt($string, "AES-256-CBC", $key, null, self::KEY);
        return base64_encode($result);
    }

    public  function ReadCookie($name) {
        return self::Decrypt($_COOKIE[$name], "cookie");
    }

    public  function Decrypt($string, $key) {
        if (!BasicTools::IsSenseful($key)) {
            trigger_error("Decrypt Error", E_USER_ERROR);
        }
        $string = base64_decode($string);
        $result = openssl_decrypt($string, "AES-256-CBC", $key, null, self::KEY);
        return $result;
    }
     function AddEmp($username, $rank, $school, $password, $uUsername, $uPassword) {
        if (self::IsAllowed(7)) {
            $uPassword = self::Encrypt($uPassword, $password);
            $password = self::Hash($password);
            DB_Query::AskDB(STANDARDDATABASE, "Insert into login_employees values(null,?,?,?,?,?,?);", $uUsername, $username, $rank, $school, $uPassword, $password);
        }
    }
     function EditEmp($username, $rank, $school, $password, $uUsername, $uPassword) {
        if (self::IsAllowed(7)) {
            $uPassword = self::Encrypt($uPassword, $password);
            $password = self::Hash($password);
            DB_Query::AskDB(STANDARDDATABASE, "Update login_employees SET wuUsername=?,username=?,rank=?,school=?,wuPassword=?,password=? WHERE username=?;", $uUsername, $username, $rank, $school, $uPassword, $password, $_SESSION["aUsername"]);
        }

    }
     function EmpLogin($username, $password) {
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT  `wuUsername`,`rank`,`school`,`wuPassword`,`password` FROM `login_employees` WHERE username=?", $username);
        if (false == $res || count($res) == 0) {
            return false;
        }

        if (!self::VerifyHash($res[0]["password"], $password)) {
            return false;
        }

        $pw = self::Decrypt($res[0]["wuPassword"], $password);
        if (!self::TryLogin($res[0]["wuUsername"], $pw, $res[0]["school"], false, true)) {
            return false;
        }

        $_SESSION["rank"] = $res[0]["rank"];
        $_SESSION["aUsername"] = $username;
        return true;
    }

    public  function VerifyHash($hashed, $unhashed) {
        return password_verify($unhashed, $hashed);
    }

   

    public  function IsEmp() {
        if (BasicTools::IsSenseful($_SESSION["rank"])) {
            if ($_SESSION["rank"] > 0) {
                return true;
            }
        }

        return false;
    }
    private  function TryLogin(){
        return true;//fill in (add normal login for emps)
    }
}

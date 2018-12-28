<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Cache {
    const USE_CACHE = false;
    const MAKE_CACHE = true;
    const RENEW_CACHE = true;
    
    private static function AskUntis($url, $post = null, $try = 0, $isFuckinDelete = false) {
        if (strpos($url, self::INPUT_SERVER) !== false) {
            $url = str_replace(self::INPUT_SERVER, BasicTools::TestSessVar("server"), $url);
        }
        $cookies = "";

        if (!BasicTools::IsSenseful($_SESSION["cookieNames"])) {
            $_SESSION["cookieNames"] = array();
            $_SESSION["cookieValues"] = array();
        } else {
            for ($i = 0; $i < count($_SESSION["cookieNames"]); $i++) {
                $cookies .= $_SESSION["cookieNames"][$i] . "=" . $_SESSION["cookieValues"][$i] . "; ";
            }
        }
        $ch = curl_init();
        /**
         * curl opt:
         * 0 gefunden
         * 1 überprüft passt ziemlich sicher für uns
         * 2 überprüft passt nicht ganz so sicher
         * vllt gebraucht
         * CURLOPT_CRLF
         * CURLOPT_UNRESTRICTED_AUTH
         * CURLOPT_USERPWD
         * passende zahl für:
         * CURLOPT_CONNECTTIMEOUT (sec)
         * CURLOPT_MAXREDIRS
         * CURLOPT_PORT
         * CURLOPT_TIMEOUT
         * passender string für
         * CURLOPT_DEFAULT_PROTOCOL
         * passendes array für:
         */
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //0
        curl_setopt($ch, CURLOPT_AUTOREFERER, true); //1
        //curl_setopt($ch, CURLOPT_COOKIESESSION, true);//2
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, "self::ReadHeader");
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); //1
        curl_setopt($ch, CURLOPT_FRESH_CONNECT, true); //1
        curl_setopt($ch, CURLOPT_HEADER, false); //1 zum testen ob der header richig is true
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        //curl_setopt($ch,CURLOPT_MUTE , false);//1
        curl_setopt($ch, CURLOPT_NETRC, true); // 2
        curl_setopt($ch, CURLOPT_COOKIEJAR, ""); //0 cookies gehn so ned
        curl_setopt($ch, CURLOPT_COOKIEFILE, ""); //0 cookies gehn so ned
        curl_setopt($ch, CURLOPT_COOKIE, $cookies); //1
        curl_setopt($ch, CURLOPT_URL, $url); // 1
        $header[] = "Connection: keep-alive";
        $header[] = "Accept: application/json";
        $header[] = "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
        if (null === $post) {
            curl_setopt($ch, CURLOPT_HTTPGET, true); // 1
            $header[] = "Content-Type: application/x-www-form-urlencoded";
        } else {
            //curl_setopt($ch,CURLOPT_CUSTOMREQUEST,"POST");//verschieden 1-2
            curl_setopt($ch, CURLOPT_POST, true); //1
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post); // 1
            if (strpos($post, "{") === 0) {
                $header[] = 'Content-Type: application/json';
                $header[] = 'Content-Length: ' . strlen($post);
            } else {
                $header[] = "Content-Type: application/x-www-form-urlencoded";
            }
        }
        if ($isFuckinDelete) {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        }
        //$header[]="Accept-Encoding: gzip, deflate, br";
        //$header[]="Accept-Language: de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7";
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        $result = curl_exec($ch);
        if (false === $result) {
            curl_close($ch);
            trigger_error("#error001", E_USER_ERROR);
        }
        if (curl_getinfo($ch, CURLINFO_HTTP_CODE) != "200") {
            $rCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            trigger_error("#error014|" . $rCode, E_USER_ERROR);
        }
        if (strpos($result, "<title>Maintenance work</title>") !== false) {
            trigger_error("#error024", E_USER_ERROR);
        }

        if (strpos($result, "ssoReauthentication") !== false) {
            self::Login();
            if ($try > 2) {
                curl_close($ch);
                trigger_error("#error015", E_USER_ERROR);
            }
            return WebUntis::AskUntis($url, $post, $try + 1);
        }

        curl_close($ch);
        return $result;
    }

 

  
    private static function CleanCache() {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_querys where cache_querys.school in (select a.school from (select * from cache_querys) as a join cache_info where cache_info.lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY) and a.school like concat(cache_info.school,'%'))");
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_info where lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    }

   
    private static function AskFor($url, $post = null, $forwholeschool = true, $nevercache = false, $isFuckinDelete = false) {
        $url = str_replace(self::INPUT_SERVER, BasicTools::TestSessVar("server"), $url);
        if (!$forwholeschool && !BasicTools::IsSenseful($_SESSION["user"])) {
            trigger_error("#warning001", E_USER_WARNING);
            return "";
        }
        if (self::USE_CACHE && !$nevercache) {
            $answer = self::GetCache(BasicTools::TestSessVar("school"), $url, $forwholeschool);
            if (false !== $answer) {
                return $answer;
            }
        }
        $answer = self::AskUntis($url, $post, 0, $isFuckinDelete);
        if (strpos($answer, '"isSessionTimeout":true') !== false) {
            if (BasicTools::IsSenseful($_SESSION["user"])) {
                $ch = self::Login();
            } else {
                $ch = self::NoAccLogin();
            }
            $answer = self::AskUntis($url, $post);
        }
        if (self::MAKE_CACHE && !$nevercache) {
            self::SetCache($url, $answer, $forwholeschool);
            new TableChange($answer, $url);
        }

        return $answer;
    }

    private static function GetCache($school, $query, $forwholeschool) {
        self::TestTopicality($school);
        if (!$forwholeschool) {
            $school = $school . BasicTools::TestSessVar("user");
        }
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select answer from cache_querys where school= ? and query= ?;", $school, $query);
        if (BasicTools::IsSenseful($result[0]["answer"])) {
            return $result[0]["answer"];
        }
        return false;
    }

   

    private static function SetCache($query, $answer, $forwholeschool) {
        $school = BasicTools::TestSessVar("school");
        if (!$forwholeschool) {
            $school = $school . BasicTools::TestSessVar("user");
        }
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select * from cache_querys where school=? and query=?", $school, $query);
        if (!is_array($result) || count($result) == 0) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into cache_querys values(null,?,?,?)", $school, $query, $answer);
        }
    }

    private static function TestTopicality($school) {
        if (!self::$topicalityTested) {
            self::$topicalityTested = true;
            if (self::RENEW_CACHE) {
                $result = DB_Query::AskDB(STANDARDDATABASE, "Select * from cache_info where school=?", $school);
                if (!is_array($result) || count($result) == 0) {
                    DB_Query::AskDB(STANDARDDATABASE, "Insert into cache_info values(null,?,0,0)", $school);
                }
                $lastT = self::GetlastTruncate($school);
                if (is_array($lastT) && !count($lastT) == 0) {
                    if (strtotime($lastT["lastLook"]) < strtotime($lastT["CURRENT_TIMESTAMP"]) - 60) {
                        $answer = self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=1", null, true, true);
                        $array = json_decode($answer, true);
                        if (!BasicTools::IsSenseful($array["data"]["lastImportTimestamp"])) {
                            BasicTools::Log("
                        Topicality failData(no timestamp found):
                        " . json_encode($array) . "
                        ");
                        }

                        if ($array["data"]["lastImportTimestamp"] > strtotime($lastT["lastTruncate"])) {
                            BasicTools::MainLog("Truncate " . $_SESSION["school"] . ": lid: " . date("d.m.Y H:i:s", $array["data"]["lastImportTimestamp"] / 1000) . " lt:" . date("d.m.Y H:i:s", strtotime($lastT["lastTruncate"]) / 1000), "trun");
                            DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_querys where school Like Concat(?,'%')", $school);
                            DB_Query::AskDB(STANDARDDATABASE, "UPDATE cache_info SET lastTruncate = ? WHERE school = ?;", $array["data"]["lastImportTimestamp"], $school);
                            self::CleanCache();
                            Notifications::SchoolUpdateNotfication();
                        }
                        DB_Query::AskDB(STANDARDDATABASE, "UPDATE cache_info SET lastLook = null WHERE school=?;", $school);
                    }
                }
            }
        }
    }

    static function GetlastTruncate($school) {
        self::TestTopicality($school);
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select lastLook,CURRENT_TIMESTAMP,lastTruncate from cache_info where school=?", $school);
        if (is_array($result) && !count($result) == 0) {
            return $result[0];
        }
        return null;
    }

  
}

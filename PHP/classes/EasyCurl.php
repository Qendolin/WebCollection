<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class EasyCurl implements IEasyCurl{
    private  $curl = null;

    public  function AskCurl($url, $post = null) {
        if (null == self::$curl) {
            self::MakeCurlInstance();
        }
        if (null != $post) {
            curl_setopt(self::$curl, CURLOPT_POST, true);
            curl_setopt(self::$curl, CURLOPT_POSTFIELDS, $post);
            curl_setopt(self::$curl, CURLOPT_COOKIEFILE,"");
            curl_setopt(self::$curl, CURLOPT_COOKIEJAR, "");
        }
        curl_setopt(self::$curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt(self::$curl, CURLOPT_URL, $url);
        return curl_exec(self::$curl);
    }

    private  function MakeCurlInstance() {
        self::$curl = curl_init();
    }
    private  function CleanCache() {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_querys where cache_querys.school in (select a.school from (select * from cache_querys) as a join cache_info where cache_info.lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY) and a.school like concat(cache_info.school,'%'))");
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_info where lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    }
    private  function GetCache($school, $query, $forwholeschool) {
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

   

    private  function SetCache($query, $answer, $forwholeschool) {
        $school = BasicTools::TestSessVar("school");
        if (!$forwholeschool) {
            $school = $school . BasicTools::TestSessVar("user");
        }
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select * from cache_querys where school=? and query=?", $school, $query);
        if (!is_array($result) || count($result) == 0) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into cache_querys values(null,?,?,?)", $school, $query, $answer);
        }
    }

    private  function TestTopicality($school) {
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

     function GetlastTruncate($school) {
        self::TestTopicality($school);
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select lastLook,CURRENT_TIMESTAMP,lastTruncate from cache_info where school=?", $school);
        if (is_array($result) && !count($result) == 0) {
            return $result[0];
        }
        return null;
    }
}class Change {

    
    public function __construct($timegrid, $timegridInfo) {
        $this->timegrid = $timegrid;
        $this->timegridInfo = $timegridInfo;
        $this->CachedNew();
    }
    public function CachedNew() {
        if (!$this->TestForTimegrid() || !$this->TestForCorrectness()) {
            return;
        }

        if (!$this->IsInteresting() || !$this->IsNewVersion()) {
            return;
        }

        $this->NotifyUsers();
        if ($this->insert) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into notification_oldTableInfo values(null,?,?,?)", $this->timegrid, $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        } else {
            DB_Query::AskDB(STANDARDDATABASE, "UPDATE  notification_oldTableInfo set hash=? where date=? and timetable=?", $this->timegrid, $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        }

    }

    private function IsInteresting() {
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_table where ownerType=? and ownerID=? and school=?", $this->timegridInfo["type"], $this->timegridInfo["id"], BasicTools::TestSessVar("school"));
        if (count($res) == 0) {
            return false;
        }

        $this->timegridInfo["tid"] = $res[0]["id"];
        return true;
    }
    private function TestForTimegrid() {
        if (preg_match("/https:\/\/.*\/WebUntis\/api\/public\/timetable\/weekly\/data\?elementType=(.*)&elementId=(.*)&date=(.*)&formatId=1/", $this->timegridInfo, $matches) == 0) {
            return false;
        }

        $this->timegridInfo = array("date" => preg_replace("/-/", "", $matches[3]), "type" => $matches[1], "id" => $matches[2]);
        return true;
    }
    private function DeleteOld() {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from notification_oldTableInfo where (int)date < (int)?", date("Ymd", time() - 14 * 24 * 60 * 60));
    }
    private function TestForCorrectness() {
        if (preg_match('/^{"data":{"result":{"data":.*"elementIds":\[\d+?\]/', $this->timegrid) == 0) {
            return false;
        }

        $this->timegrid = md5($this->timegrid);
        return true;
    }

    private function IsNewVersion() {
        $oldOne = DB_Query::AskDB(STANDARDDATABASE, "SELECT hash from notification_oldTableInfo where date=? and timetable=?", $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        if (count($oldOne) == 0) {
            $this->insert = true;
            return true;
        }

        $oldOne = $oldOne[0]["hash"];
        if ($this->timegrid != $oldOne) {
            return true;
        }

        return false;
    }

    private function NotifyUsers() {
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT userId from notification_clients where timetable=?", $this->timegridInfo["tid"]);
        if (0 == $res) {
            trigger_error("#error026", E_USER_ERROR);
        }

        for ($i = 0; $i < count($res); $i++) {
            $res[$i] = $res[$i]["userId"];
        }
        Notifications::TableChangeNotification($res, $_SESSION["school"], $this->timegridInfo["date"], $this->timegridInfo["type"], $this->timegridInfo["tid"]);
        $this->DeleteOld();
    }
}
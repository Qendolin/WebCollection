<?php
class TableChange {

    
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

    public  function AskForTables() { //
        //asks for 3-5 foreign tables
    }}

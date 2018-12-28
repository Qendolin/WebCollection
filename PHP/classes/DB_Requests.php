<?php
//api adapted
class DB_Requests {
    public static function GetMessages($type, $count, $seen) {
        if (!MySecure::IsAllowed(5)) {
            trigger_error("#error025", E_USER_ERROR);
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT * from feedback_messages where type like ? and seen like ? LIMIT ?", $type, $seen, intval($count));
        for ($i = 0; $i < count($res); $i++) {
            $res[$i]["log"] = gzuncompress($res[$i]["log"]);
        }
        echo json_encode($res, true);
    }
    public static function DelMessage($id){
        //unfin
    }
    public static function SeeMessage($id){
        //unfin
    }
}

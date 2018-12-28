<?php
//api adapted
/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Notifications {

    const APP_ID = "a454f152-7451-404f-93da-258c36ba95a3";//fill in
    const STANDARD_ICON = "https://jptr.ml/DATA/logo256.png";//fill in
    const STANDARD_BADGE = "https://jptr.ml/DATA/logo192alpha.png";//fill in

    public static function Notify(
        $included=null,
        $excluded = null,
        $content = null,
        $contentTemplate = null,
        $headings = null,
        $url = null,
        $filters = null,
        $icon = self::STANDARD_ICON,
        $image = null,
        $badge = self::STANDARD_BADGE,
        $minDateTime = null,
        $delay = null,
        $time = null,
        $lifeTime = null,
        $priority = null
    ) {
        return self::AskOnesignal(self::BuildJson($included, $excluded, $content, $contentTemplate, $headings, $url, $filters, $icon, $image, $badge, $minDateTime, $delay, $time, $lifeTime, $priority));
    }

    private static function AskOnesignal($json) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://onesignal.com/api/v1/notifications");
        if ("dev.jptr.ml" == $_SERVER["SERVER_NAME"]) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json; charset=utf-8', 'Authorization: Basic ZjZjZjdlMjEtZjBiNy00NTU3LTljMzQtZjZiNzhkMDBhNDgy'));
        } else {
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json; charset=utf-8', 'Authorization: Basic Yzk2MzZmOWEtMzQ3ZC00NmIyLTg2NDgtNTAzMjg3MDgwYTVk'));
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        BasicTools::Log($response,"Onesignal");
        return $response;
    }

    private static function BuildJson(
        $included=null,
        $excluded = null,
        $content = null,
        $contentTemplate = null,
        $headings = null,
        $url = null,
        $filters = null,
        $icon = self::STANDARD_ICON,
        $image = null,
        $badge = self::STANDARD_BADGE,
        $minDateTime = null,
        $delay = null,
        $time = null,
        $lifeTime = null,
        $priority = null
    ) {
        if (!BasicTools::IsSenseful($app) && !BasicTools::IsSenseful($included)) {
        }

        $arr = array();
        if ("dev.jptr.ml" == $_SERVER["SERVER_NAME"]) {
            $arr["app_id"] = self::TEST_APP_ID;
        } else {
            $arr["app_id"] = self::APP_ID;
        }

        if (BasicTools::IsSenseful($included)) {
            $arr["included_segments"] = $included;
        }

        if (BasicTools::IsSenseful($content)) {
            $arr["contents"] = $content;
        }

        if (BasicTools::IsSenseful($headings)) {
            $arr["headings"] = $headings;
        }

        if (BasicTools::IsSenseful($contentTemplate)) {
            $arr["template_id"] = $contentTemplate;
        }

        if (BasicTools::IsSenseful($url)) {
            $arr["url"] = $url;
        }

        if (BasicTools::IsSenseful($filters)) {
            $arr["filters"] = $filters;
        }

        if (BasicTools::IsSenseful($icon)) {
            $arr["chrome_web_icon"] = $icon;
        }

        if (BasicTools::IsSenseful($image)) {
            $arr["chrome_web_image"] = $image;
        }

        if (BasicTools::IsSenseful($badge)) {
            $arr["chrome_web_badge"] = $badge;
        }

        if (BasicTools::IsSenseful($minDateTime)) {
            $arr["send_after"] = $minDateTime;
        }

        if (BasicTools::IsSenseful($delay)) {
            $arr["delayed_option"] = $delay;
        }

        if (BasicTools::IsSenseful($time)) {
            $arr["delivery_time_of_day"] = $time;
        }

        if (BasicTools::IsSenseful($lifeTime)) {
            $arr["ttl"] = $lifeTime;
        }

        if (BasicTools::IsSenseful($priority)) {
            $arr["priority"] = $priority;
        }

        if (BasicTools::IsSenseful($excluded)) {
            $arr["excluded_segments"] = $excluded;
        }

        return json_encode($arr);
    }
}
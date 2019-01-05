<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Notifications implements INotifications {

    private $appId ;
    private $standardIcon;
    private $standardBadge;

    function __construct($appId,$standardIcon,$standardBadge){
        $this->appId=$appId;
        $this->standardIcon=$standardIcon;
        $this->standardBadge=$standardBadge;
    }

    public  function Notify(
        $included=null,
        $excluded = null,
        $content = null,
        $contentTemplate = null,
        $headings = null,
        $url = null,
        $filters = null,
        $icon = $this->standardIcon,
        $image = null,
        $badge = $this->standardBadge,
        $minDateTime = null,
        $delay = null,
        $time = null,
        $lifeTime = null,
        $priority = null
    ) {
        return $this->AskOnesignal($this->BuildJson($included, $excluded, $content, $contentTemplate, $headings, $url, $filters, $icon, $image, $badge, $minDateTime, $delay, $time, $lifeTime, $priority));
    }

    private  function AskOnesignal($json) {
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

    private  function BuildJson(
        $included=null,
        $excluded = null,
        $content = null,
        $contentTemplate = null,
        $headings = null,
        $url = null,
        $filters = null,
        $icon = $this->standardIcon,
        $image = null,
        $badge = $this->standardBadge,
        $minDateTime = null,
        $delay = null,
        $time = null,
        $lifeTime = null,
        $priority = null
    ) {
        if (!BasicTools::IsSenseful($app) && !BasicTools::IsSenseful($included)) {
        }

        $arr = array();
      
        $arr["app_id"] = $this->appId;
        

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
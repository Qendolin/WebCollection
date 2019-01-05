<?php
interface INotifications {
    public function Notify($included=null,
    $excluded = null,
    $content = null,
    $contentTemplate = null,
    $headings = null,
    $url = null,
    $filters = null,
    $icon = null,
    $image = null,
    $badge = null,
    $minDateTime = null,
    $delay = null,
    $time = null,
    $lifeTime = null,
    $priority = null);
}
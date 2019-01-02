<?php
//api adapted
class GooglePosition {

 function GetPosition($search,$searchedLink){
    $url = "https://www.google.at/search?q=" . str_replace(" ", "%20", $search);


$pos = 0;
for ($site = 0; $site < 1000; $site += 10) {
    $res = EasyCurl::AskCurl($url . "&start=" . $site);
    $ans = array();
    if (strpos($res, "302 Moved") !== false) {
        return("blocked(ls: $site)");
    }

    preg_match_all('/<h3 class="r"><a href="\/url\?q=(.*?)&/', $res, $ans);
    foreach ($ans[1] as $link) {
        if (strpos($link,$searchedLink)) {
            return("found on position " . ($pos + 1) . $res);
        } else {
            $pos++;
        }
    }
}
return null; //nicht in den ersten 100 Seiten!
}}
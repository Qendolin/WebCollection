<?php
interface IEasyCurl{
  public function  AskCurl($url, $post=null,$cache=null,$usecache=null,$checkForUpdate=null);
}
<?php
interface IEasyCurl{
  public function  AskCurl(string $url,string $post=null,bool $cache=null,bool $usecache=null,bool $checkForUpdate=null): string;
}
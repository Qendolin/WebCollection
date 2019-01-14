<?php
interface IForum{

    public function NewThread(int $parentId,string $name,string $text,string $user);

    public function DelThread(int $id);

     public function NewComment(int $parentId,string $text,string $user);
 
     public function DelComment(int $id);

     public function EditComment(int $parentId,string $text,string $user,int $id);

     public function EditThread(int $parentId,string $name,string $text,string $user,int $id);

     public function NewCat(int $parentId,string $name,bool $threads,int $neededRank);

     public function EditCat(int $parentId,string $name,bool $threads,int $neededRank,int $id);

     public function DelCat(int $id);

    public function GetCat(int $id=0);
    public function GetThread(int $id);
}
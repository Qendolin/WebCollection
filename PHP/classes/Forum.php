<?php

class Forum implements IForum {

    public function NewThread(int $parentId, string $name, string $text, string $user) {
        # code...
    }
    public function DelThread(int $id) {
        # code...
    }
    public function NewComment(int $parentId, string $text, string $user) {
        # code...
    }
    public function DelComment(int $id) {
        # code...
    }
    public function EditComment(int $parentId, string $text, string $user, int $id) {
        # code...
    }
    public function EditThread(int $parentId, string $name, string $text, string $user, int $id) {
        # code...
    }
    public function NewCat(int $parentId, string $name, bool $threads, int $neededRank) {
        # code...
    }
    public function EditCat(int $parentId, string $name, bool $threads, int $neededRank, int $id) {
        # code...
    }
    public function DelCat(int $id) {
        # code...
    }
    public function GetCat(int $id = 0) {
        # code...
    }
    public function GetThread(int $id) {
        # code...
    }

}
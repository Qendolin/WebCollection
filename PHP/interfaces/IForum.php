<?php
interface IForum {

    public function NewThread(int $parentId, string $name, string $text, string $user): void;

    public function DelThread(int $id): void;

    public function NewComment(int $parentId, string $text, string $user): void;

    public function DelComment(int $id): void;

    public function EditComment(int $parentId, string $text, string $user, int $id): void;

    public function EditThread(int $parentId, string $name, string $text, string $user, int $id): void;

    public function NewCat(int $parentId, string $name, bool $threads, int $neededRank): void;

    public function EditCat(int $parentId, string $name, bool $threads, int $neededRank, int $id): void;

    public function DelCat(int $id): void;

    public function GetCat(int $id = 0): ForumCategory;

    public function GetThread(int $id): ForumThread;
}